import { ApiProperty } from '@nestjs/swagger';

export class ScreenFilterResponseDto {
  @ApiProperty({ type: [String], description: '页面二级类型' })
  pageTypeL2: string[] = [];

  @ApiProperty({ type: [String], description: '应用二级分类' })
  appCategoryL2: string[] = [];

  @ApiProperty({ type: [String], description: '设计体系' })
  designSystem: string[] = [];

  @ApiProperty({ type: [String], description: '二级类型' })
  typeL2: string[] = [];

  @ApiProperty({ type: [String], description: '间距' })
  spacing: string[] = [];

  @ApiProperty({ type: [String], description: '密度' })
  density: string[] = [];

  @ApiProperty({ type: [String], description: '组件二级索引' })
  componentIndexL2: string[] = [];

  @ApiProperty({ type: [String], description: '一级标签二级内容' })
  tagsPrimaryL2: string[] = [];

  @ApiProperty({ type: [String], description: '样式标签二级内容' })
  tagsStyleL2: string[] = [];

  @ApiProperty({ type: [String], description: '组件标签二级内容' })
  tagsComponentsL2: string[] = [];

  @ApiProperty({ type: [String], description: '设计风格' })
  designStyle: string[] = [];

  @ApiProperty({ type: [String], description: '情感标签' })
  feeling: string[] = [];

  @ApiProperty({ type: [String], description: '平台' })
  platform: string[] = [];
}
