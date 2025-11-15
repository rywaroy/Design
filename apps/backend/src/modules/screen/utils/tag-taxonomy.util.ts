import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface TagNode {
  name: string;
  children?: TagNode[];
}

const resolveDataFile = (fileName: string): string | null => {
  const cwd = process.cwd();
  const runtimeRoot = join(__dirname, '..', '..', '..', '..');
  const candidates: string[] = [];
  const tryPaths = [
    join(__dirname, '..', 'data', fileName),
    join(__dirname, '..', '..', 'data', fileName),
    join(runtimeRoot, 'modules', 'screen', 'data', fileName),
    join(runtimeRoot, 'src', 'modules', 'screen', 'data', fileName),
    join(cwd, 'dist', 'modules', 'screen', 'data', fileName),
    join(cwd, 'src', 'modules', 'screen', 'data', fileName),
  ];

  const packageRoot = join(cwd, 'apps', 'backend');
  candidates.push(...tryPaths);
  if (existsSync(packageRoot)) {
    candidates.push(
      join(packageRoot, 'dist', 'modules', 'screen', 'data', fileName),
      join(packageRoot, 'src', 'modules', 'screen', 'data', fileName),
    );
  }

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};

const loadTagJson = (fileName: string): TagNode[] => {
  const filePath = resolveDataFile(fileName);
  if (!filePath) {
    throw new Error(`无法找到标签配置文件: ${fileName}`);
  }

  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content) as TagNode[];
};

export const pageTypeData = loadTagJson('page_type.json');
export const appCategoryData = loadTagJson('app_category.json');
export const componentIndexData = loadTagJson('component_index.json');
export const tagsPrimaryData = loadTagJson('tags_primary.json');
export const tagsStyleData = loadTagJson('tags_style.json');
export const tagsComponentsData = loadTagJson('tags_components.json');
export const layoutTypeData = loadTagJson('layout_type.json');

export type ScreenDimensionKey =
  | 'appCategory'
  | 'componentIndex'
  | 'layoutType'
  | 'pageType'
  | 'tagsPrimary'
  | 'tagsStyle'
  | 'tagsComponents';

export const TAXONOMY_DATA: Record<ScreenDimensionKey, TagNode[]> = {
  appCategory: appCategoryData,
  componentIndex: componentIndexData,
  layoutType: layoutTypeData,
  pageType: pageTypeData,
  tagsPrimary: tagsPrimaryData,
  tagsStyle: tagsStyleData,
  tagsComponents: tagsComponentsData,
};

const collectChildrenNames = (nodes?: TagNode[]): string[] => {
  if (!nodes) {
    return [];
  }
  const result = new Set<string>();
  nodes.forEach((node) => {
    const trimmed = node?.name?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  });
  return Array.from(result);
};

export const collectSecondLevelNames = (nodes: TagNode[]): string[] => {
  const result = new Set<string>();
  nodes?.forEach((node) => {
    collectChildrenNames(node?.children).forEach((childName) => {
      result.add(childName);
    });
  });
  return Array.from(result);
};

export const collectFirstLevelNames = (nodes: TagNode[]): string[] => {
  const result = new Set<string>();
  nodes?.forEach((node) => {
    const trimmed = node?.name?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  });
  return Array.from(result);
};

export const buildSecondLevelLookup = (
  nodes: TagNode[],
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  nodes?.forEach((node) => {
    const parent = node?.name?.trim();
    if (!parent) {
      return;
    }
    const children = collectChildrenNames(node.children);
    if (children.length > 0) {
      map[parent] = children;
    }
  });
  return map;
};
