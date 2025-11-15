export declare class ProjectFilterCategoryDto {
    key: string;
    label: string;
    options: string[];
    parent?: string;
}
export declare class ProjectFilterResponseDto {
    categories: ProjectFilterCategoryDto[];
}
