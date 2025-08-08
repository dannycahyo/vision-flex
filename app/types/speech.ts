export interface TextToSpeechHook {
  speak: (options: { text: string; rate?: number }) => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
}

export interface SpeechQueueItem {
  text: string;
  priority: number;
  rate?: number;
}
