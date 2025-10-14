import type { ScreenFilterResponse } from '../services/screen';

export type ScreenFilterKey = keyof Omit<ScreenFilterResponse, 'platform'>;

export interface ScreenFilterFieldConfig {
  key: ScreenFilterKey;
  label: string;
  multiple: boolean;
}

export const SCREEN_FILTER_FIELDS: ScreenFilterFieldConfig[] = [
  { key: 'pageTypeL2', label: '页面类型', multiple: false },
  { key: 'appCategoryL2', label: '应用分类', multiple: false },
  { key: 'typeL2', label: '页面布局', multiple: false },
  { key: 'designSystem', label: '设计体系', multiple: false },
  { key: 'spacing', label: '间距', multiple: false },
  { key: 'density', label: '密度', multiple: false },
  { key: 'componentIndexL2', label: '组件索引', multiple: true },
  { key: 'tagsPrimaryL2', label: '功能标签', multiple: true },
  { key: 'tagsStyleL2', label: '风格标签', multiple: true },
  { key: 'tagsComponentsL2', label: '组件标签', multiple: true },
  { key: 'designStyle', label: '设计风格', multiple: true },
  { key: 'feeling', label: '情感标签', multiple: true },
];

export type ScreenFilterSelectionState = Record<ScreenFilterKey, string[]>;

export const createInitialFilterSelection = (): ScreenFilterSelectionState =>
  SCREEN_FILTER_FIELDS.reduce<ScreenFilterSelectionState>((acc, field) => {
    acc[field.key] = [];
    return acc;
  }, {} as ScreenFilterSelectionState);
