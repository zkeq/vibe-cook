import { afterEach, describe, expect, it, vi } from "vitest";
import { speech } from "../../src/lib/speech";
import { createAndroidSpeech } from "../web/android-speech";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const options = { rate: 1.12, voiceURI: "" };
const voices = [
  { name: "English", lang: "en-US", voiceURI: "english", localService: true, default: false },
  { name: "中文", lang: "zh-CN", voiceURI: "chinese", localService: true, default: false },
];
const engine = () => ({
  getSupportedVoices: vi.fn(async () => ({ voices })),
  isLanguageSupported: vi.fn(async () => ({ supported: true })),
  speak: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
});

describe("speech compatibility", () => {
  it("reports a missing Web Speech API without synchronously crashing settings", async () => {
    vi.stubGlobal("window", {});
    await expect(speech.getVoices()).rejects.toThrow("不支持朗读");
    await expect(speech.speak("当前步骤", options)).rejects.toThrow("不支持朗读");
    expect(() => speech.subscribeVoicesChanged(() => {})()).not.toThrow();
    await expect(speech.stop()).resolves.toBeUndefined();
  });

  it("uses Android's native voice index without needing Web Speech", async () => {
    vi.stubGlobal("window", {});
    const native = engine();
    await createAndroidSpeech(native).speak("当前步骤", { ...options, voiceURI: "chinese" });
    expect(native.speak).toHaveBeenCalledWith(expect.objectContaining({ text: "当前步骤", lang: "zh-CN", rate: 1.12, voice: 1, queueStrategy: 0 }));
  });

  it("does not start an obsolete step after the user stops while voices load", async () => {
    const native = engine();
    let complete!: (value: { voices: typeof voices }) => void;
    native.getSupportedVoices.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const service = createAndroidSpeech(native);
    const pending = service.speak("旧步骤", options);
    await service.stop();
    complete({ voices });
    await pending;
    expect(native.speak).not.toHaveBeenCalled();
  });

  it("retries a voice query while the Android engine initializes", async () => {
    vi.useFakeTimers();
    const native = engine();
    native.getSupportedVoices.mockRejectedValueOnce(new Error("initializing"));
    const pending = createAndroidSpeech(native).speak("当前步骤", options);
    await vi.advanceTimersByTimeAsync(100);
    await pending;
    expect(native.speak).toHaveBeenCalledTimes(1);
  });

  it("shows an actionable message if Android has no Chinese language data", async () => {
    const native = engine();
    native.isLanguageSupported.mockResolvedValue({ supported: false });
    await expect(createAndroidSpeech(native).speak("当前步骤", options)).rejects.toThrow("安装中文语音包");
    expect(native.speak).not.toHaveBeenCalled();
  });
});
