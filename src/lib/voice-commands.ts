// 烹饪模式语音指令：sherpa-onnx 关键词识别（WebAssembly），完全在本地运行。
// 模型首次使用时从 COS 下载并缓存到 Cache Storage，之后离线可用。
// 构建方式见 native/kws/build.sh。

export type VoiceCommand = "next" | "prev" | "pause" | "resume" | "repeat" | "ingredients" | "close";

const KWS_BASE_URL = "https://cos.onmicrosoft.cn/cook/kws/v1/";
const KWS_FILES = [
  "sherpa-onnx-wasm-kws-main.js",
  "sherpa-onnx-wasm-kws-main.wasm",
  "sherpa-onnx-wasm-kws-main.data",
  "sherpa-onnx-kws.js",
] as const;
const CACHE_NAME = "vibe-cook-kws-v1";

// 关键词写成模型的拼音 token（由 pypinyin 生成并逐个核对过 tokens.txt）。
// 「一」口语里会变调，三个声调都收；两字词加 #0.35 提高触发门槛，减少误触发。
const KEYWORDS: Record<VoiceCommand, string[]> = {
  next: [
    "x ià y ī b ù @下一步",
    "x ià y í b ù @下一步",
    "x ià y ì b ù @下一步",
    "x ià y ī y è @下一页",
    "x ià y í y è @下一页",
    "x ià y ì y è @下一页",
    "x ià y ī g è @下一个",
    "x ià y í g è @下一个",
    "x ià y ì g è @下一个",
    "x ià y ī t iáo @下一条",
    "x ià y í t iáo @下一条",
    "x ià y ì t iáo @下一条",
    "x ià y ī x iàng @下一项",
    "x ià y í x iàng @下一项",
    "x ià y ì x iàng @下一项",
    "x ià y è #0.35 @下页",
    "h òu y ī b ù @后一步",
    "h òu y í b ù @后一步",
    "h òu y ì b ù @后一步",
    "h òu y ī y è @后一页",
    "h òu y í y è @后一页",
    "h òu y ì y è @后一页",
    "f ān y è #0.35 @翻页",
    "f ān y ī y è @翻一页",
    "f ān y í y è @翻一页",
    "f ān y ì y è @翻一页",
    "f ān x ià y ī y è @翻下一页",
    "f ān x ià y í y è @翻下一页",
    "f ān x ià y ì y è @翻下一页",
    "w ǎng x ià #0.35 @往下",
    "x iàng x ià #0.35 @向下",
    "w ǎng h òu #0.35 @往后",
    "x iàng h òu #0.35 @向后",
    "w ǎng h òu f ān @往后翻",
    "j iē x ià l ái @接下来",
    "r án h òu n e @然后呢",
    "h ǎo l e #0.35 @好了",
    "z uò h ǎo l e @做好了",
    "w án ch éng l e @完成了",
    "g ǎo d ìng l e @搞定了",
    "x ià y ī #0.35 @下一",
    "x ià y í #0.35 @下一",
    "x ià y ì #0.35 @下一",
  ],
  prev: [
    "sh àng y ī b ù @上一步",
    "sh àng y í b ù @上一步",
    "sh àng y ì b ù @上一步",
    "sh àng y ī y è @上一页",
    "sh àng y í y è @上一页",
    "sh àng y ì y è @上一页",
    "sh àng y ī g è @上一个",
    "sh àng y í g è @上一个",
    "sh àng y ì g è @上一个",
    "sh àng y ī t iáo @上一条",
    "sh àng y í t iáo @上一条",
    "sh àng y ì t iáo @上一条",
    "sh àng y ī x iàng @上一项",
    "sh àng y í x iàng @上一项",
    "sh àng y ì x iàng @上一项",
    "sh àng y è #0.35 @上页",
    "q ián y ī b ù @前一步",
    "q ián y í b ù @前一步",
    "q ián y ì b ù @前一步",
    "q ián y ī y è @前一页",
    "q ián y í y è @前一页",
    "q ián y ì y è @前一页",
    "w ǎng sh àng #0.35 @往上",
    "x iàng sh àng #0.35 @向上",
    "w ǎng q ián #0.35 @往前",
    "x iàng q ián #0.35 @向前",
    "f ǎn h uí #0.35 @返回",
    "h uí q ù #0.35 @回去",
    "t uì h uí #0.35 @退回",
    "h òu t uì #0.35 @后退",
    "h uí d ào sh àng y ī b ù @回到上一步",
    "h uí d ào sh àng y í b ù @回到上一步",
    "h uí d ào sh àng y ì b ù @回到上一步",
    "f ǎn h uí sh àng y ī b ù @返回上一步",
    "f ǎn h uí sh àng y í b ù @返回上一步",
    "f ǎn h uí sh àng y ì b ù @返回上一步",
    "t uì y ī b ù @退一步",
    "t uì y í b ù @退一步",
    "t uì y ì b ù @退一步",
  ],
  pause: [
    "z àn t íng #0.35 @暂停",
    "t íng y ī x ià @停一下",
    "t íng y í x ià @停一下",
    "t íng y ì x ià @停一下",
    "t íng x ià #0.35 @停下",
    "x iān t íng #0.35 @先停",
    "t íng zh ǐ #0.35 @停止",
    "d ěng y ī x ià @等一下",
    "d ěng y í x ià @等一下",
    "d ěng y ì x ià @等一下",
    "d ěng d ěng #0.35 @等等",
    "d ěng h uì #0.35 @等会",
    "b ié d ú l e @别读了",
    "b ù y ào d ú l e @不要读了",
    "ān j ìng #0.35 @安静",
  ],
  resume: [
    "j ì x ù #0.35 @继续",
    "j iē zh e #0.35 @接着",
    "k āi sh ǐ #0.35 @开始",
    "k āi sh ǐ j ì sh í @开始计时",
    "j ì x ù j ì sh í @继续计时",
  ],
  repeat: [
    "z ài d ú y ī b iàn @再读一遍",
    "z ài d ú y í b iàn @再读一遍",
    "z ài d ú y ì b iàn @再读一遍",
    "z ài sh uō y ī b iàn @再说一遍",
    "z ài sh uō y í b iàn @再说一遍",
    "z ài sh uō y ì b iàn @再说一遍",
    "z ài n iàn y ī b iàn @再念一遍",
    "z ài n iàn y í b iàn @再念一遍",
    "z ài n iàn y ì b iàn @再念一遍",
    "zh òng d ú #0.35 @重读",
    "zh òng f ù #0.35 @重复",
    "z ài l ái y ī b iàn @再来一遍",
    "z ài l ái y í b iàn @再来一遍",
    "z ài l ái y ì b iàn @再来一遍",
    "m éi t īng q īng @没听清",
    "d ú y ī x ià @读一下",
    "d ú y í x ià @读一下",
    "d ú y ì x ià @读一下",
    "n iàn y ī x ià @念一下",
    "n iàn y í x ià @念一下",
    "n iàn y ì x ià @念一下",
    "zh òng x īn d ú @重新读",
  ],
  ingredients: [
    "p èi l iào b iǎo @配料表",
    "p èi l iào #0.35 @配料",
    "k àn p èi l iào @看配料",
    "k àn k àn p èi l iào @看看配料",
    "d ǎ k āi p èi l iào b iǎo @打开配料表",
    "p èi l iào q īng d ān @配料清单",
    "y òng l iào #0.35 @用料",
    "y òng l iào b iǎo @用料表",
    "sh í c ái #0.35 @食材",
    "sh í c ái q īng d ān @食材清单",
    "c ái l iào #0.35 @材料",
    "y uán l iào #0.35 @原料",
    "d iào l iào #0.35 @调料",
    "f àng d uō sh ǎo @放多少",
    "j iā d uō sh ǎo @加多少",
    "y ào f àng d uō sh ǎo @要放多少",
  ],
  close: [
    "g uān b ì #0.35 @关闭",
    "g uān d iào #0.35 @关掉",
    "g uān sh àng #0.35 @关上",
    "g uān l e #0.35 @关了",
    "sh ōu q ǐ #0.35 @收起",
    "sh ōu q ǐ l ái @收起来",
    "b ù k àn l e @不看了",
    "h ǎo d e g uān b ì @好的关闭",
    "t uì ch ū #0.35 @退出",
    "y ǐn c áng #0.35 @隐藏",
  ],
};
const COMMAND_BY_LABEL = new Map(
  Object.entries(KEYWORDS).flatMap(([command, lines]) =>
    lines.map((line) => [line.split("@")[1], command as VoiceCommand] as const)
  )
);

export const VOICE_COMMAND_LABELS: Record<VoiceCommand, string> = {
  next: "下一步",
  prev: "上一步",
  pause: "暂停",
  resume: "继续",
  repeat: "再读一遍",
  ingredients: "配料表",
  close: "关闭",
};

const SAMPLE_RATE = 16000;
const COOLDOWN_MS = 1200;

interface KwsStream {
  acceptWaveform(sampleRate: number, samples: Float32Array): void;
  free(): void;
}
interface Kws {
  createStream(): KwsStream;
  isReady(stream: KwsStream): boolean;
  decode(stream: KwsStream): void;
  reset(stream: KwsStream): void;
  getResult(stream: KwsStream): { keyword: string };
}
type KwsModule = Record<string, unknown>;

declare global {
  interface Window {
    Module?: KwsModule;
    createKws?: (module: KwsModule, config: unknown) => Kws;
  }
}

// ---------- 模型下载与缓存 ----------

const memoryFiles = new Map<string, Blob>(); // Cache Storage 不可用时（部分 WebView）退回内存

async function openCache() {
  try {
    return typeof caches === "undefined" ? null : await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function isVoiceModelReady(): Promise<boolean> {
  if (KWS_FILES.every((name) => memoryFiles.has(name))) return true;
  const cache = await openCache();
  if (!cache) return false;
  const hits = await Promise.all(KWS_FILES.map((name) => cache.match(KWS_BASE_URL + name)));
  return hits.every(Boolean);
}

export async function downloadVoiceModel(onProgress: (ratio: number) => void): Promise<void> {
  const cache = await openCache();
  const sizes = new Map<string, number>();
  const loaded = new Map<string, number>();
  const report = () => {
    const total = [...sizes.values()].reduce((a, b) => a + b, 0);
    const done = [...loaded.values()].reduce((a, b) => a + b, 0);
    if (total > 0) onProgress(Math.min(done / total, 1));
  };

  await Promise.all(
    KWS_FILES.map(async (name) => {
      const url = KWS_BASE_URL + name;
      if (cache && (await cache.match(url))) return;
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`语音模型下载失败（${res.status}）`);
      sizes.set(name, Number(res.headers.get("content-length")) || 0);
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        loaded.set(name, received);
        report();
      }
      const blob = new Blob(chunks, { type: res.headers.get("content-type") || "application/octet-stream" });
      if (cache) await cache.put(url, new Response(blob, { headers: { "Content-Type": blob.type } }));
      else memoryFiles.set(name, blob);
    })
  );
  onProgress(1);
}

async function readFile(name: string): Promise<Blob> {
  const memory = memoryFiles.get(name);
  if (memory) return memory;
  const cache = await openCache();
  const res = cache && (await cache.match(KWS_BASE_URL + name));
  if (!res) throw new Error("语音模型尚未下载");
  return res.blob();
}

// ---------- 加载 WASM 运行时（整页只加载一次） ----------

let spotterPromise: Promise<Kws> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("语音模型加载失败"));
    document.head.appendChild(script);
  });
}

function loadSpotter(): Promise<Kws> {
  spotterPromise ??= (async () => {
    const urls = new Map<string, string>();
    for (const name of KWS_FILES) {
      let blob = await readFile(name);
      if (name.endsWith(".wasm")) blob = new Blob([blob], { type: "application/wasm" });
      urls.set(name, URL.createObjectURL(blob));
    }
    await loadScript(urls.get("sherpa-onnx-kws.js")!);
    const runtimeReady = new Promise<void>((resolve) => {
      window.Module = {
        locateFile: (path: string) => urls.get(path) ?? path,
        onRuntimeInitialized: () => resolve(),
        print: () => {},
        printErr: () => {},
      };
    });
    await loadScript(urls.get("sherpa-onnx-wasm-kws-main.js")!);
    await runtimeReady;
    const keywords = Object.values(KEYWORDS).flat().join("\n");
    return window.createKws!(window.Module!, {
      featConfig: { samplingRate: SAMPLE_RATE, featureDim: 80 },
      modelConfig: {
        transducer: {
          encoder: "./encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx",
          decoder: "./decoder-epoch-12-avg-2-chunk-16-left-64.onnx",
          joiner: "./joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx",
        },
        tokens: "./tokens.txt",
        provider: "cpu",
        modelType: "",
        numThreads: 1,
        debug: 0,
        modelingUnit: "cjkchar",
        bpeVocab: "",
      },
      maxActivePaths: 4,
      numTrailingBlanks: 1,
      keywordsScore: 1.0,
      keywordsThreshold: 0.25,
      keywords: "",
      keywordsBuf: keywords,
      keywordsBufSize: new TextEncoder().encode(keywords).length,
    });
  })().catch((error) => {
    spotterPromise = null;
    throw error;
  });
  return spotterPromise;
}

// ---------- 麦克风监听 ----------

function downsample(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === SAMPLE_RATE) return input;
  const ratio = fromRate / SAMPLE_RATE;
  const output = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = sum / Math.max(end - start, 1);
  }
  return output;
}

export interface VoiceListenerOptions {
  onCommand: (command: VoiceCommand, heard: string) => void;
  // App 自己正在朗读的文字；朗读内容里本来就有的指令词会被忽略，避免被自己的声音触发
  getSpokenText?: () => string;
}

export async function startVoiceListener({ onCommand, getSpokenText }: VoiceListenerOptions): Promise<() => void> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("当前环境不支持麦克风");
  const spotter = await loadSpotter();
  let media: MediaStream;
  try {
    media = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    throw new Error("无法使用麦克风，请在系统设置中允许访问");
  }

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(media);
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  const mute = audioCtx.createGain();
  mute.gain.value = 0;
  const stream = spotter.createStream();
  let lastHit = 0;

  processor.onaudioprocess = (event) => {
    const samples = downsample(new Float32Array(event.inputBuffer.getChannelData(0)), audioCtx.sampleRate);
    stream.acceptWaveform(SAMPLE_RATE, samples);
    while (spotter.isReady(stream)) {
      spotter.decode(stream);
      const label = spotter.getResult(stream).keyword;
      if (!label) continue;
      spotter.reset(stream);
      const command = COMMAND_BY_LABEL.get(label);
      const now = Date.now();
      if (!command || now - lastHit < COOLDOWN_MS) continue;
      if (getSpokenText?.().includes(label)) continue;
      lastHit = now;
      onCommand(command, label);
    }
  };
  source.connect(processor);
  processor.connect(mute);
  mute.connect(audioCtx.destination);
  await audioCtx.resume();

  return () => {
    processor.onaudioprocess = null;
    source.disconnect();
    processor.disconnect();
    mute.disconnect();
    media.getTracks().forEach((track) => track.stop());
    void audioCtx.close();
    stream.free();
  };
}
