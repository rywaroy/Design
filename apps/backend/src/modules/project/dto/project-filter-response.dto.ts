import { ApiProperty } from '@nestjs/swagger';

export class ProjectFilterCategoryDto {
  @ApiProperty({ description: '筛选类别 key，例如 application_type 等' })
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

export class ProjectFilterResponseDto {
  @ApiProperty({
    type: [ProjectFilterCategoryDto],
    description: '筛选类别集合，默认返回所有类别的第一层可选项',
  })
  categories: ProjectFilterCategoryDto[];
}
