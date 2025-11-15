import { ConfigService } from '@nestjs/config';
import { FileService } from './file.service';
import { FileInfoDto } from './dto/file-info.dto';
export declare class FileController {
    private readonly fileService;
    private readonly configService;
    constructor(fileService: FileService, configService: ConfigService);
    private static getStorageConfig;
    private static getMulterConfig;
    uploadFile(file: Express.Multer.File): FileInfoDto;
    uploadFiles(files: Array<Express.Multer.File>): FileInfoDto[];
}
