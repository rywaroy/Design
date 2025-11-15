"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FileController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path = require("path");
const fs = require("fs");
const uuid_1 = require("uuid");
const config_1 = require("@nestjs/config");
const file_service_1 = require("./file.service");
const filevalidation_pipe_1 = require("./filevalidation.pipe");
const file_info_dto_1 = require("./dto/file-info.dto");
const files_info_dto_1 = require("./dto/files-info.dto");
const api_response_decorator_1 = require("../../common/decorator/api-response.decorator");
let FileController = FileController_1 = class FileController {
    constructor(fileService, configService) {
        this.fileService = fileService;
        this.configService = configService;
    }
    static getStorageConfig() {
        return (0, multer_1.diskStorage)({
            destination: (req, file, callback) => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const dateFolder = `${year}${month}${day}`;
                const uploadDir = `uploads/${dateFolder}`;
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                callback(null, uploadDir);
            },
            filename: (req, file, callback) => {
                const extension = path.extname(file.originalname);
                const uuid = (0, uuid_1.v4)();
                const filename = `${uuid}${extension}`;
                callback(null, filename);
            },
        });
    }
    static getMulterConfig() {
        const maxSizeMB = parseInt(process.env.FILE_MAX_SIZE_MB) || 10;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return {
            storage: FileController_1.getStorageConfig(),
            limits: {
                fileSize: maxSizeBytes,
            },
        };
    }
    uploadFile(file) {
        return this.fileService.processUploadedFile(file);
    }
    uploadFiles(files) {
        return this.fileService.processUploadedFiles(files);
    }
};
exports.FileController = FileController;
__decorate([
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', FileController.getMulterConfig())),
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({
        summary: '单文件上传',
        description: '上传单个文件并返回文件信息',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: '文件上传',
        type: 'multipart/form-data',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '要上传的文件',
                },
            },
        },
    }),
    (0, api_response_decorator_1.ApiResponse)(file_info_dto_1.FileInfoDto, '文件上传成功'),
    __param(0, (0, common_1.UploadedFile)(filevalidation_pipe_1.FileValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", file_info_dto_1.FileInfoDto)
], FileController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 3, FileController.getMulterConfig())),
    (0, common_1.Post)('upload-files'),
    (0, swagger_1.ApiOperation)({
        summary: '多文件上传',
        description: '上传多个文件并返回文件信息列表',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: '多文件上传',
        type: 'multipart/form-data',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: '要上传的文件列表',
                },
            },
        },
    }),
    (0, api_response_decorator_1.ApiResponse)(files_info_dto_1.FilesInfoDto, '文件上传成功'),
    __param(0, (0, common_1.UploadedFiles)(filevalidation_pipe_1.FileValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Array)
], FileController.prototype, "uploadFiles", null);
exports.FileController = FileController = FileController_1 = __decorate([
    (0, swagger_1.ApiTags)('文件管理'),
    (0, common_1.Controller)('file'),
    __metadata("design:paramtypes", [file_service_1.FileService,
        config_1.ConfigService])
], FileController);
//# sourceMappingURL=file.controller.js.map