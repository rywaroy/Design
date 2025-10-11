/* eslint-disable @typescript-eslint/no-var-requires */

export interface TagNode {
  name: string;
  children?: TagNode[];
}

export const pageTypeData = require('../data/page_type.json') as TagNode[];
export const appCategoryData =
  require('../data/app_category.json') as TagNode[];
export const componentIndexData =
  require('../data/component_index.json') as TagNode[];
export const tagsPrimaryData =
  require('../data/tags_primary.json') as TagNode[];
export const tagsStyleData = require('../data/tags_style.json') as TagNode[];
export const tagsComponentsData =
  require('../data/tags_components.json') as TagNode[];
export const layoutTypeData = require('../data/layout_type.json') as TagNode[];

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

/* eslint-enable @typescript-eslint/no-var-requires */
