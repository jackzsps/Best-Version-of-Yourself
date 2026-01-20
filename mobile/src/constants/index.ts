// Copied from shared/constants.ts
import { RecordMode, Language } from '../types';

export const DEFAULT_MODE: RecordMode = RecordMode.STRICT;
export const DEFAULT_LANGUAGE: Language = 'zh-TW';

export const AI_CONFIG = {
  model: 'gemini-pro-vision',
  maxOutputTokens: 1024,
};
