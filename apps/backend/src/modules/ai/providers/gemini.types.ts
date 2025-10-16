export type GeminiRole = 'user' | 'model' | 'system';

export interface GeminiInlineData {
  mimeType?: string;
  data?: string;
  url?: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

export interface GeminiContent {
  role?: GeminiRole;
  parts: GeminiPart[];
}

export interface GeminiSafetyRating {
  category?: string;
  probability?: string;
  blocked?: boolean;
  probabilityScore?: number;
}

export interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: GeminiSafetyRating[] | null;
}

export interface GeminiPromptFeedback {
  blockReason?: string;
  safetyRatings?: GeminiSafetyRating[] | null;
}

export interface GeminiTokenDetails {
  modality?: string;
  tokenCount?: number;
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  promptTokensDetails?: GeminiTokenDetails[];
  candidatesTokensDetails?: GeminiTokenDetails[];
}

export interface GeminiGenerationConfig {
  responseModalities?: string[];
  imageConfig: {
    aspectRatio: string;
  };
}

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
}

export interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: GeminiPromptFeedback;
  usageMetadata?: GeminiUsageMetadata;
  modelVersion?: string;
  responseId?: string;
}
