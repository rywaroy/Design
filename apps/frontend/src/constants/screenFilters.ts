import type { ScreenSearchParams } from '../services/screen';

export type ScreenFilterDatasetKey =
  | 'page_type'
  | 'app_category'
  | 'component_index'
  | 'tags_primary'
  | 'tags_style'
  | 'tags_components'
  | 'layout_type';

export interface ScreenFilterFieldConfig {
  datasetKey: ScreenFilterDatasetKey;
  requestKey: keyof ScreenSearchParams;
  label: string;
  multiple: boolean;
}

export const SCREEN_FILTER_FIELDS: ScreenFilterFieldConfig[] = [
  { datasetKey: 'page_type', requestKey: 'pageTypeL2', label: '页面类型', multiple: true },
  { datasetKey: 'app_category', requestKey: 'appCategoryL2', label: '应用分类', multiple: true },
  { datasetKey: 'component_index', requestKey: 'componentIndexL2', label: '组件索引', multiple: true },
  { datasetKey: 'tags_primary', requestKey: 'tagsPrimaryL2', label: '功能标签', multiple: true },
  { datasetKey: 'tags_style', requestKey: 'tagsStyleL2', label: '风格标签', multiple: true },
  { datasetKey: 'tags_components', requestKey: 'tagsComponentsL2', label: '组件标签', multiple: true },
  { datasetKey: 'layout_type', requestKey: 'typeL2', label: '页面布局', multiple: true },
];

export type ScreenFilterSelectionState = Record<ScreenFilterDatasetKey, string[]>;

export const createInitialFilterSelection = (): ScreenFilterSelectionState =>
  SCREEN_FILTER_FIELDS.reduce<ScreenFilterSelectionState>((acc, field) => {
    acc[field.datasetKey] = [];
    return acc;
  }, {} as ScreenFilterSelectionState);

export const findFieldConfig = (datasetKey: ScreenFilterDatasetKey) =>
  SCREEN_FILTER_FIELDS.find((field) => field.datasetKey === datasetKey);
