import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { ProjectListItem, ProjectPlatform } from '../services/project';

export interface ProjectListState {
  platform: ProjectPlatform;
  projects: ProjectListItem[];
  currentPage: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  scrollTop: number;
}

interface ProjectListContextValue {
  state: ProjectListState;
  setState: Dispatch<SetStateAction<ProjectListState>>;
}

export const DEFAULT_PROJECT_PLATFORM: ProjectPlatform = 'ios';

const createInitialProjectListState = (): ProjectListState => ({
  platform: DEFAULT_PROJECT_PLATFORM,
  projects: [],
  currentPage: 0,
  total: 0,
  hasMore: true,
  loading: false,
  error: null,
  scrollTop: 0,
});

const ProjectListContext = createContext<ProjectListContextValue | undefined>(undefined);

export const ProjectListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProjectListState>(() => createInitialProjectListState());

  const value = useMemo<ProjectListContextValue>(
    () => ({
      state,
      setState,
    }),
    [state],
  );

  return <ProjectListContext.Provider value={value}>{children}</ProjectListContext.Provider>;
};

export const useProjectListContext = () => {
  const context = useContext(ProjectListContext);
  if (!context) {
    throw new Error('useProjectListContext 必须在 ProjectListProvider 中使用');
  }
  return context;
};
