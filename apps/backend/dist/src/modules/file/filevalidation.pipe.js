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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FileValidationPipe = class FileValidationPipe {
    constructor(configService) {
        this.configService = configService;
    }
    transform(value) {
        const maxSizeMB = this.configService.get('file.maxSizeMB', 10);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (value.size > maxSizeBytes) {
            throw new common_1.HttpException(`文件大小超过${maxSizeMB}M`, common_1.HttpStatus.BAD_REQUEST);
        }
        return value;
    }
};
exports.FileValidationPipe = FileValidationPipe;
exports.FileValidationPipe = FileValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileValidationPipe);
//# sourceMappingURL=filevalidation.pipe.js.map