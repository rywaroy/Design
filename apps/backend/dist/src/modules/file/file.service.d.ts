import { ConfigService } from '@nestjs/config';
import { FileInfoDto } from './dto/file-info.dto';
export declare class FileService {
    private readonly configService;
    constructor(configService: ConfigService);
    processUploadedFile(file: Express.Multer.File): FileInfoDto;
    processUploadedFiles(files: Express.Multer.File[]): FileInfoDto[];
}
