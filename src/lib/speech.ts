export interface SpeechOptions {
  rate: number;
  voiceURI: string;
}

export interface SpeechVoice {
  name: string;
  lang: string;
  voiceURI: string;
  localService?: boolean;
}

export interface SpeechService {
  getVoices(): Promise<SpeechVoice[]>;
  speak(text: string, options: SpeechOptions): Promise<void>;
  stop(): Promise<void>;
  subscribeVoicesChanged(listener: () => void): () => void;
}

export function speechErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "朗读暂时不可用，请检查系统语音设置。";
}

function getSynthesis() {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
    return undefined;
  }
  return window.speechSynthesis;
}

export const speech: SpeechService = {
  async getVoices() {
    const synthesis = getSynthesis();
    if (!synthesis) throw new Error("当前环境不支持朗读。");
    return synthesis.getVoices();
  },
  async speak(text, options) {
    const synthesis = getSynthesis();
    if (!synthesis) throw new Error("当前环境不支持朗读。");
    synthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = options.rate;
    const voice = synthesis.getVoices().find((voice) => voice.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") resolve();
        else reject(new Error("朗读失败，请检查系统是否已安装中文语音。"));
      };
      synthesis.speak(utterance);
    });
  },
  async stop() { getSynthesis()?.cancel(); },
  subscribeVoicesChanged(listener) {
    const synthesis = getSynthesis();
    if (!synthesis) return () => {};
    synthesis.addEventListener("voiceschanged", listener);
    return () => synthesis.removeEventListener("voiceschanged", listener);
  },
};
