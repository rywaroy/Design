import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { ProjectListItem } from '../services/project';
import type { ScreenListItem } from '../services/screen';

export type FavoriteTab = 'project' | 'screen';
export type FavoritePlatform = 'ios' | 'web';

export interface FavoriteListState<T> {
  items: T[];
  page: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  scrollTop: number;
}

export interface FavoriteState {
  activeTab: FavoriteTab;
  platform: FavoritePlatform;
  project: FavoriteListState<ProjectListItem>;
  screen: FavoriteListState<ScreenListItem>;
}

interface FavoriteContextValue {
  state: FavoriteState;
  setState: Dispatch<SetStateAction<FavoriteState>>;
}

const createListState = <T,>(): FavoriteListState<T> => ({
  items: [],
  page: 0,
  total: 0,
  hasMore: true,
  loading: false,
  scrollTop: 0,
});

const createInitialState = (): FavoriteState => ({
  activeTab: 'project',
  platform: 'ios',
  project: createListState<ProjectListItem>(),
  screen: createListState<ScreenListItem>(),
});

const FavoriteContext = createContext<FavoriteContextValue | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FavoriteState>(() => createInitialState());

  const value = useMemo(
    () => ({
      state,
      setState,
    }),
    [state],
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
};

export const useFavoriteContext = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavoriteContext 必须在 FavoriteProvider 中使用');
  }
  return context;
};
