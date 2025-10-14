import type { ProjectListParams } from '../services/project';

export type ProjectFilterDatasetKey = 'application_type' | 'industry_sector';

export interface ProjectFilterFieldConfig {
  datasetKey: ProjectFilterDatasetKey;
  requestKey: keyof ProjectListParams;
  label: string;
  multiple: boolean;
}

export const PROJECT_FILTER_FIELDS: ProjectFilterFieldConfig[] = [
  { datasetKey: 'application_type', requestKey: 'applicationType', label: '应用类型', multiple: true },
  { datasetKey: 'industry_sector', requestKey: 'industrySector', label: '行业领域', multiple: true },
];

export type ProjectFilterSelectionState = Record<ProjectFilterDatasetKey, string[]>;

export const createInitialProjectFilterSelection = (): ProjectFilterSelectionState =>
  PROJECT_FILTER_FIELDS.reduce<ProjectFilterSelectionState>((acc, field) => {
    acc[field.datasetKey] = [];
    return acc;
  }, {} as ProjectFilterSelectionState);

export const findProjectFilterFieldConfig = (datasetKey: ProjectFilterDatasetKey) =>
  PROJECT_FILTER_FIELDS.find((field) => field.datasetKey === datasetKey);
