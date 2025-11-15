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
var GeminiImageAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiImageAdapter = void 0;
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const message_entity_1 = require("../../message/entities/message.entity");
let GeminiImageAdapter = GeminiImageAdapter_1 = class GeminiImageAdapter {
    constructor(configService) {
        this.configService = configService;
        this.name = 'Gemini Image';
        this.logger = new common_1.Logger(GeminiImageAdapter_1.name);
    }
    buildHttpClient(baseUrlOverride) {
        const baseUrl = baseUrlOverride?.trim() ||
            this.configService.get('ai.baseUrl') ||
            'https://generativelanguage.googleapis.com';
        const timeout = this.configService.get('ai.timeoutMs') || 20000;
        return axios_1.default.create({
            baseURL: baseUrl,
            timeout,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    resolveApiKey(override) {
        const key = override?.trim() || this.configService.get('ai.apiKey') || '';
        if (!key) {
            this.logger.error('AI_API_KEY 未配置');
            throw new common_1.InternalServerErrorException('AI 服务未正确配置');
        }
        return key;
    }
    get imageModel() {
        return (this.configService.get('ai.imageModel') ||
            'gemini-2.5-flash-image');
    }
    async prepare(dto, history) {
        const contents = await this.buildConversationContext(history);
        const { parts: userParts, record: userRecord } = await this.prepareUserMessage(dto);
        if (!userParts.length) {
            throw new common_1.BadRequestException('消息内容不能为空');
        }
        contents.push({
            role: 'user',
            parts: userParts,
        });
        const model = dto.model || this.imageModel;
        const aspectRatio = dto.aspectRatio?.trim() || '';
        return {
            history: contents,
            userRequest: {
                contents,
                generationConfig: {
                    responseModalities: ['Image', 'Text'],
                    imageConfig: aspectRatio ? { aspectRatio } : undefined,
                },
            },
            userRecord,
            model,
        };
    }
    async send(prepared) {
        const client = this.buildHttpClient(prepared.endpoint?.baseUrl);
        const modelId = prepared.model;
        try {
            const response = await client.post(`/v1beta/models/${modelId}:generateContent`, prepared.userRequest, {
                params: { key: this.resolveApiKey(prepared.endpoint?.apiKey) },
            });
            await this.enrichResponseWithImageUrls(response.data);
            return response.data;
        }
        catch (error) {
            this.handleRequestError(error);
        }
    }
    async normalize(raw, prepared) {
        const candidate = raw.candidates?.[0];
        const content = candidate?.content;
        const assistantRecord = GeminiImageAdapter_1.parseGeminiParts(content?.parts);
        const resolvedRole = GeminiImageAdapter_1.mapGeminiRoleToMessage(content?.role);
        const assistantContentRaw = assistantRecord.content?.trim() ?? '';
        const assistantImages = Array.from(new Set(assistantRecord.images
            .map((url) => url?.trim())
            .filter((url) => !!url?.length)));
        const finalText = assistantContentRaw ||
            (assistantImages.length === 0 ? '模型未返回有效内容' : '');
        const usage = raw.usageMetadata;
        const compactMetadata = Object.fromEntries(Object.entries({
            promptTokens: usage?.promptTokenCount,
            completionTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
        }).filter(([, v]) => v !== undefined));
        const assistantPayload = {
            content: finalText || undefined,
            images: assistantImages,
            model: prepared.model,
            role: resolvedRole,
            metadata: compactMetadata,
        };
        return {
            assistantRecord: assistantPayload,
            response: {
                content: finalText || undefined,
                images: assistantImages,
                metadata: assistantPayload.metadata,
            },
        };
    }
    async buildConversationContext(history) {
        if (!history.length) {
            return [];
        }
        const chronological = [...history].reverse();
        const contents = [];
        for (const message of chronological) {
            const parts = await this.normalizeStoredMessage(message);
            if (!parts.length) {
                continue;
            }
            contents.push({
                role: GeminiImageAdapter_1.mapMessageRoleToGemini(message.role),
                parts,
            });
        }
        return contents;
    }
    async normalizeStoredMessage(message) {
        const payload = GeminiImageAdapter_1.resolveStoredPayload(message);
        if (!GeminiImageAdapter_1.hasPayloadContent(payload)) {
            return [];
        }
        const parts = [];
        if (payload.text) {
            parts.push({ text: payload.text });
        }
        for (const image of payload.images) {
            try {
                const { base64, mimeType } = await this.ensureInlineDataBase64(image);
                parts.push({
                    inlineData: {
                        mimeType,
                        data: base64,
                    },
                });
            }
            catch {
                continue;
            }
        }
        return parts;
    }
    async ensureInlineDataBase64(inlineData) {
        const fallbackMime = 'image/png';
        if (inlineData.data && inlineData.data.trim()) {
            return {
                base64: GeminiImageAdapter_1.stripBase64Prefix(inlineData.data),
                mimeType: inlineData.mimeType?.trim() || fallbackMime,
            };
        }
        if (inlineData.url) {
            const downloaded = await this.downloadImageAsBase64(inlineData.url);
            const mimeType = downloaded.mimeType?.trim() ||
                inlineData.mimeType?.trim() ||
                fallbackMime;
            return { base64: downloaded.base64, mimeType };
        }
        throw new common_1.InternalServerErrorException('图片数据缺失');
    }
    async downloadImageAsBase64(url) {
        try {
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
            });
            const base64 = Buffer.from(response.data).toString('base64');
            const mimeType = response.headers['content-type'];
            return { base64, mimeType };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`下载图片失败: ${url} - ${message}`);
            throw new common_1.InternalServerErrorException('图片下载失败');
        }
    }
    async saveBase64Image(base64, mimeType) {
        const normalized = GeminiImageAdapter_1.stripBase64Prefix(base64);
        const buffer = Buffer.from(normalized, 'base64');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateFolder = `${year}${month}${day}`;
        const uploadDir = `uploads/${dateFolder}`;
        if (!fs.existsSync(uploadDir)) {
            await fs.promises.mkdir(uploadDir, { recursive: true });
        }
        const effectiveMime = mimeType?.trim() || 'image/png';
        const extension = GeminiImageAdapter_1.resolveExtension(effectiveMime);
        const filename = `${(0, uuid_1.v4)()}.${extension}`;
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, buffer);
        const baseUrl = this.configService.get('app.baseUrl');
        const relativePath = filePath.replace(/\\/g, '/');
        return {
            path: filePath,
            url: `${baseUrl}/${relativePath}`,
            filename,
        };
    }
    async enrichResponseWithImageUrls(response) {
        const candidates = response.candidates || [];
        for (const candidate of candidates) {
            const parts = candidate.content?.parts;
            if (!parts?.length)
                continue;
            for (const part of parts) {
                const inline = part.inlineData;
                if (!inline)
                    continue;
                if (!inline.data || inline.url) {
                    if (inline.url) {
                        part.inlineData = { url: inline.url };
                    }
                    else {
                        part.inlineData = inline;
                    }
                    continue;
                }
                const saved = await this.saveBase64Image(inline.data, inline.mimeType);
                part.inlineData = {
                    url: saved.url,
                };
            }
        }
    }
    async prepareUserMessage(dto) {
        const parts = [];
        const trimmedContent = dto.content?.trim() ?? '';
        const uniqueImages = Array.from(new Set((dto.images ?? [])
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0)));
        if (trimmedContent) {
            parts.push({ text: trimmedContent });
        }
        for (const url of uniqueImages) {
            const { base64, mimeType } = await this.ensureInlineDataBase64({ url });
            parts.push({
                inlineData: {
                    mimeType,
                    data: base64,
                },
            });
        }
        return {
            parts,
            record: {
                content: trimmedContent,
                images: uniqueImages,
                model: dto.model,
            },
        };
    }
    static parseGeminiParts(parts) {
        if (!parts?.length) {
            return { images: [] };
        }
        const textPieces = [];
        const images = [];
        for (const part of parts) {
            const text = part.text?.trim();
            if (text) {
                textPieces.push(text);
            }
            const inline = part.inlineData;
            if (!inline) {
                continue;
            }
            if (inline.url) {
                images.push(inline.url);
                continue;
            }
        }
        return {
            content: textPieces.length ? textPieces.join('\n') : undefined,
            images,
        };
    }
    static resolveStoredPayload(message) {
        const sources = [];
        if (Array.isArray(message.images)) {
            for (const item of message.images) {
                if (typeof item === 'string') {
                    const trimmed = item.trim();
                    if (trimmed.length > 0) {
                        sources.push({ url: trimmed });
                    }
                }
            }
        }
        const raw = message.content;
        let text;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (trimmed) {
                text = trimmed;
            }
        }
        return {
            text,
            images: sources,
        };
    }
    static hasPayloadContent(payload) {
        return ((payload.text && payload.text.trim().length > 0) ||
            payload.images.length > 0);
    }
    static mapMessageRoleToGemini(role) {
        switch (role) {
            case message_entity_1.MessageRole.ASSISTANT:
                return 'model';
            case message_entity_1.MessageRole.SYSTEM:
                return 'system';
            default:
                return 'user';
        }
    }
    static mapGeminiRoleToMessage(role) {
        switch (role) {
            case 'system':
                return message_entity_1.MessageRole.SYSTEM;
            case 'user':
                return message_entity_1.MessageRole.USER;
            default:
                return message_entity_1.MessageRole.ASSISTANT;
        }
    }
    static stripBase64Prefix(data) {
        const trimmed = data.trim();
        const commaIndex = trimmed.indexOf(',');
        if (commaIndex !== -1) {
            return trimmed.slice(commaIndex + 1);
        }
        return trimmed;
    }
    static resolveExtension(mimeType) {
        const mapping = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
        };
        if (mapping[mimeType])
            return mapping[mimeType];
        const suffix = mimeType.split('/')[1] || 'png';
        if (suffix.includes('jpeg'))
            return 'jpg';
        return suffix;
    }
    handleRequestError(error) {
        if (error instanceof axios_1.AxiosError) {
            const message = error.response?.data || error.message || error;
            this.logger.error(`调用 Gemini 失败: ${JSON.stringify(message)}`);
            throw new common_1.InternalServerErrorException(`AI 服务调用失败 - ${JSON.stringify(message)}`);
        }
        if (error instanceof Error) {
            this.logger.error(`Gemini 请求失败: ${error.message}`);
            throw new common_1.InternalServerErrorException('AI 服务调用失败');
        }
        this.logger.error(`Gemini 请求失败: ${JSON.stringify(error)}`);
        throw new common_1.InternalServerErrorException('AI 服务调用失败');
    }
};
exports.GeminiImageAdapter = GeminiImageAdapter;
exports.GeminiImageAdapter = GeminiImageAdapter = GeminiImageAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiImageAdapter);
//# sourceMappingURL=gemini-image.adapter.js.map