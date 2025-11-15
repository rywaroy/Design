export interface TagNode {
    name: string;
    children?: TagNode[];
}
export declare const pageTypeData: TagNode[];
export declare const appCategoryData: TagNode[];
export declare const componentIndexData: TagNode[];
export declare const tagsPrimaryData: TagNode[];
export declare const tagsStyleData: TagNode[];
export declare const tagsComponentsData: TagNode[];
export declare const layoutTypeData: TagNode[];
export type ScreenDimensionKey = 'appCategory' | 'componentIndex' | 'layoutType' | 'pageType' | 'tagsPrimary' | 'tagsStyle' | 'tagsComponents';
export declare const TAXONOMY_DATA: Record<ScreenDimensionKey, TagNode[]>;
export declare const collectSecondLevelNames: (nodes: TagNode[]) => string[];
export declare const collectFirstLevelNames: (nodes: TagNode[]) => string[];
export declare const buildSecondLevelLookup: (nodes: TagNode[]) => Record<string, string[]>;
