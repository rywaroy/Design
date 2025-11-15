export interface TaxonomyNode {
    name: string;
    children?: TaxonomyNode[];
}
export declare const collectFirstLevelNames: (nodes: TaxonomyNode[]) => string[];
export declare const buildSecondLevelLookup: (nodes: TaxonomyNode[]) => Record<string, string[]>;
export declare const applicationTypeData: TaxonomyNode[];
export declare const industrySectorData: TaxonomyNode[];
