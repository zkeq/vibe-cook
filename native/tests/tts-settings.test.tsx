import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { TtsSettingsPanel, loadTtsSettings } from "../../src/components/cook/tts-settings-panel";
import { speech } from "@/lib/speech";

vi.mock("@/lib/speech", async (original) => ({
  ...await original<typeof import("../../src/lib/speech")>(),
  speech: { getVoices: vi.fn(), speak: vi.fn(), stop: vi.fn(async () => {}), subscribeVoicesChanged: vi.fn(() => () => {}) },
}));

let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = "";
  localStorage.clear();
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.clearAllMocks();
});
afterEach(async () => { await act(async () => root.unmount()); });

it("keeps settings usable when there is no speech API", async () => {
  vi.mocked(speech.getVoices).mockRejectedValue(new Error("当前环境不支持朗读。"));
  await act(async () => {
    root.render(createElement(TtsSettingsPanel, { open: true, settings: { rate: 1.12, voiceURI: "" }, onClose: () => {}, onChange: () => {} }));
  });
  expect(document.body.textContent).toContain("朗读设置");
  expect(document.body.textContent).toContain("朗读速度");
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("不支持朗读");
});

it("keeps the panel visible when voice preview fails", async () => {
  vi.mocked(speech.getVoices).mockResolvedValue([]);
  vi.mocked(speech.speak).mockRejectedValue(new Error("请安装中文语音包"));
  await act(async () => {
    root.render(createElement(TtsSettingsPanel, { open: true, settings: { rate: 1.12, voiceURI: "" }, onClose: () => {}, onChange: () => {} }));
  });
  const preview = [...document.querySelectorAll("button")].find((button) => button.textContent === "试听朗读")!;
  await act(async () => preview.click());
  expect(document.body.textContent).toContain("朗读设置");
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("安装中文语音包");
});

it("normalizes invalid saved settings instead of crashing the rate display", () => {
  localStorage.setItem("cook-tts-settings", JSON.stringify({ rate: "fast", voiceURI: null }));
  expect(loadTtsSettings()).toEqual({ rate: 1.12, voiceURI: "" });
});
