export declare class ScreenFilterCategoryDto {
    key: string;
    label: string;
    options: string[];
    parent?: string;
}
export declare class ScreenFilterResponseDto {
    categories: ScreenFilterCategoryDto[];
}
