export type Platform = 'ios' | 'web';

export interface Project {
  projectId: string;
  name: string;
  platform: Platform;
  appName: string;
  appLogoUrl?: string;
  previewScreens: string[];
  screenCount: number;
  recommendedCount: number;
  appTagline?: string;
  keywords?: string[];
  applicationType?: string[];
  industrySector?: string[];
  isFavorite?: boolean;
}

export interface Screen {
  screenId: string;
  projectId: string;
  order?: number;             // 在项目内的排序序号
  originalUrl?: string;       // 原始源链接
  isAiRecommended?: boolean;  // 是否为 AI 推荐
  isFavorite?: boolean;       // 是否为当前用户收藏
  aiAnalysis?: Record<string, unknown>; // 预留 AI 分析结构
  pageType?: string[];
  tagsStyle?: string[];
  componentIndex?: string[];
  designSystem?: string[];
  platformTags?: string[];
  layout?: string[];
  colorPalette?: string[];
  tone?: string[];
  industry?: string[];
  userPersona?: string[];
  interactionPattern?: string[];
  goal?: string[];
  featureKeywords?: string[];
  visualFocus?: string[];
  additionalSearchTags?: Record<string, string[]>;
  matchScore?: number;
  matchedTags?: Record<string, string[]>;
}

export type ParsedSearchTagValue = string[] | null;

export interface ParsedSearchTags {
  pageType: ParsedSearchTagValue;
  tagsStyle: ParsedSearchTagValue;
  componentIndex: ParsedSearchTagValue;
  designSystem: ParsedSearchTagValue;
  platformTags?: ParsedSearchTagValue;
  layout?: ParsedSearchTagValue;
  colorPalette?: ParsedSearchTagValue;
  tone?: ParsedSearchTagValue;
  industry?: ParsedSearchTagValue;
  userPersona?: ParsedSearchTagValue;
  interactionPattern?: ParsedSearchTagValue;
  goal?: ParsedSearchTagValue;
  featureKeywords?: ParsedSearchTagValue;
  visualFocus?: ParsedSearchTagValue;
  [key: string]: ParsedSearchTagValue;
}

export interface LlmMeta {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  notice?: string;
  [key: string]: string | number | undefined;
}

export interface SearchResultScreen extends Screen {
  matchScore: number;
  matchedTags: Record<string, string[]>;
}

export interface SearchResponse {
  query: string;
  parsedTags: ParsedSearchTags;
  screens: SearchResultScreen[];
  llmMeta: LlmMeta;
  matchThreshold?: number;
  totalMatchedScreens?: number;
}

export interface SearchRequest {
  query: string;
}

export interface GenerationMeta extends LlmMeta {
  provider?: string;
  latencyMs?: number;
  pipeline?: string;
}

export interface GenerateRequest {
  instruction: string;
  selectedScreenIds: string[];
  parsedTags?: ParsedSearchTags;
  query?: string;
}

export interface GenerateResponse {
  generationId: string;
  imageUrl: string;
  usedScreenIds: string[];
  instruction: string;
  llmMeta: GenerationMeta;
  parsedTags?: ParsedSearchTags;
  query?: string;
}
