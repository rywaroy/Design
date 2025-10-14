import { ApiProperty } from '@nestjs/swagger';

export class ScreenFilterCategoryDto {
  @ApiProperty({ description: '筛选类别 key，例如 app_category、page_type 等' })
  key: string;

  @ApiProperty({ description: '筛选类别名称' })
  label: string;

  @ApiProperty({ type: [String], description: '可选项列表（第一层或子分类）' })
  options: string[];

  @ApiProperty({
    description: '父级名称（仅在查询子分类时返回）',
    required: false,
  })
  parent?: string;
}

export class ScreenFilterResponseDto {
  @ApiProperty({
    type: [ScreenFilterCategoryDto],
    description: '筛选类别集合，默认返回所有类别的第一层可选项',
  })
  categories: ScreenFilterCategoryDto[];
}
