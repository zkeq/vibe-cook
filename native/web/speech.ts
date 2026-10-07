import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { speech as browserSpeech } from "../../src/lib/speech";
import { createAndroidSpeech } from "./android-speech";

export { speechErrorMessage } from "../../src/lib/speech";
export type { SpeechOptions, SpeechVoice, SpeechService } from "../../src/lib/speech";

export const speech = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? createAndroidSpeech(TextToSpeech)
  : browserSpeech;
