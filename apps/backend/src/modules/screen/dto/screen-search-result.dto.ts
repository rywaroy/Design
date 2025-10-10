import { ApiProperty } from '@nestjs/swagger';
import { Screen } from '../entities/screen.entity';

export class ScreenSearchResultDto extends Screen {
  @ApiProperty({ description: '匹配度百分比', example: 75.5 })
  matchPercentage: number;
}
