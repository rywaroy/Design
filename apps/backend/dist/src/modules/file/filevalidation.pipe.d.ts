import { PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class FileValidationPipe implements PipeTransform {
    private readonly configService;
    constructor(configService: ConfigService);
    transform(value: Express.Multer.File): Express.Multer.File;
}
