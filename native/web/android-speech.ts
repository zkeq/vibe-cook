import type { SpeechService } from "../../src/lib/speech";
import type { TextToSpeechPlugin } from "@capacitor-community/text-to-speech";

type NativeEngine = Pick<TextToSpeechPlugin, "getSupportedVoices" | "isLanguageSupported" | "speak" | "stop">;
const ENGINE_ERROR = "系统语音引擎尚未就绪，请在系统设置中启用文字转语音并安装中文语音包。";

export function createAndroidSpeech(engine: NativeEngine): SpeechService {
  let generation = 0;
  // Android initializes TTS asynchronously; a quick first tap must not fail silently.
  async function getVoices() {
    for (let attempt = 0; attempt < 10; attempt++) {
      try { return (await engine.getSupportedVoices()).voices; }
      catch {
        if (attempt === 9) throw new Error(ENGINE_ERROR);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return [];
  }
  return {
    getVoices,
    async speak(text, options) {
      const current = ++generation;
      const voices = await getVoices();
      if (current !== generation) return;
      let index = voices.findIndex((voice) => voice.voiceURI === options.voiceURI);
      if (index < 0) index = voices.findIndex((voice) => /^zh(-|_)/i.test(voice.lang) && voice.localService);
      if (index < 0) index = voices.findIndex((voice) => /^zh(-|_)/i.test(voice.lang));
      const lang = index < 0 ? "zh-CN" : voices[index].lang;
      const { supported } = await engine.isLanguageSupported({ lang }).catch(() => { throw new Error(ENGINE_ERROR); });
      if (current !== generation) return;
      if (!supported) throw new Error("系统没有可用的中文朗读语音，请在系统设置中启用文字转语音并安装中文语音包。");
      // QUEUE_FLUSH replaces the previous step without waiting for it to finish.
      await engine.speak({ text, lang, rate: options.rate, pitch: 1, volume: 1, voice: index < 0 ? undefined : index, queueStrategy: 0 }).catch(() => {
        if (current === generation) throw new Error("朗读失败，请检查系统语音引擎、中文语音包和媒体音量。");
      });
    },
    async stop() {
      generation++;
      // Stopping before the engine has initialized is harmless.
      await engine.stop().catch(() => {});
    },
    subscribeVoicesChanged() { return () => {}; },
  };
}
