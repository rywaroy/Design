import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelListItemDto {
  @ApiProperty({ description: '配置名称（唯一）' })
  name!: string;

  @ApiProperty({ description: '供应商模型标识' })
  model!: string;

  @ApiPropertyOptional({ description: '厂商，例如 OpenAI、Google' })
  provider?: string;

  @ApiProperty({ description: '适配器名称' })
  adapter!: string;

  @ApiProperty({ description: '是否启用' })
  enabled!: boolean;

  @ApiPropertyOptional({ description: '描述' })
  description?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: '更新时间' })
  updatedAt?: Date;
}

