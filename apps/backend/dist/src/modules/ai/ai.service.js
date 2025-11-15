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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const message_service_1 = require("../message/message.service");
const message_entity_1 = require("../message/entities/message.entity");
const gemini_image_adapter_1 = require("./adapters/gemini-image.adapter");
const model_service_1 = require("../model/model.service");
let AiService = AiService_1 = class AiService {
    constructor(configService, messageService, geminiAdapter, modelService) {
        this.configService = configService;
        this.messageService = messageService;
        this.geminiAdapter = geminiAdapter;
        this.modelService = modelService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.chatHistoryLimit = this.configService.get('ai.chatHistoryLimit') ?? 12;
        const baseUrl = this.configService.get('ai.baseUrl') ||
            'https://generativelanguage.googleapis.com';
        const timeout = this.configService.get('ai.timeoutMs') || 20000;
        this.apiKey = this.configService.get('ai.apiKey') || '';
        this.model =
            this.configService.get('ai.model') || 'gemini-2.5-flash';
        this.httpClient = axios_1.default.create({
            baseURL: baseUrl,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.adapters = [this.geminiAdapter];
    }
    async generateJsonResponse(params) {
        const jsonOnlyInstruction = '请严格输出合法的 JSON 文本，不能包含任何解释、前后缀、或 Markdown 代码块标记（如 ```json 或 ```）。只返回 JSON 本体。';
        const mergedParams = {
            userPrompt: params.userPrompt,
            systemInstruction: params.systemInstruction
                ? `${params.systemInstruction}\n\n${jsonOnlyInstruction}`
                : jsonOnlyInstruction,
        };
        const raw = await this.generateTextResponse(mergedParams);
        try {
            const jsonText = AiService_1.extractJsonBlock(raw);
            return JSON.parse(jsonText);
        }
        catch (error) {
            this.logger.error(`解析大模型返回内容失败: ${error.message}`);
            throw new common_1.InternalServerErrorException('AI 返回内容解析失败');
        }
    }
    async generateTextResponse(params) {
        if (!this.apiKey) {
            this.logger.error('AI_API_KEY 未配置');
            throw new common_1.InternalServerErrorException('AI 服务未正确配置');
        }
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: params.userPrompt }],
                },
            ],
        };
        if (params.systemInstruction) {
            requestBody.systemInstruction = {
                role: 'system',
                parts: [{ text: params.systemInstruction }],
            };
        }
        try {
            const response = await this.httpClient.post(`/v1beta/models/${this.model}:generateContent`, requestBody, {
                params: { key: this.apiKey },
            });
            const candidate = response.data.candidates?.[0];
            const trimmed = AiService_1.extractTextFromParts(candidate?.content?.parts);
            if (!trimmed) {
                this.logger.error(`AI 服务未返回任何文本，finishReason=${candidate?.finishReason}`);
                throw new common_1.InternalServerErrorException('AI 服务返回为空');
            }
            return trimmed;
        }
        catch (error) {
            const axiosError = error;
            const message = axiosError.response?.data || axiosError.message || error;
            this.logger.error(`调用 AI 服务失败: ${JSON.stringify(message)}`);
            throw new common_1.InternalServerErrorException(`AI 服务调用失败 - ${JSON.stringify(message)}`);
        }
    }
    async chat(dto) {
        const resolved = await this.modelService.resolveForChat(dto.model);
        const adapter = this.adapters.find((candidateAdapter) => candidateAdapter.name.toLowerCase() ===
            (resolved.adapter || '').toLowerCase());
        if (!adapter) {
            throw new common_1.BadRequestException('找不到适配器');
        }
        const history = await this.messageService.list({
            sessionId: dto.sessionId,
            limit: this.chatHistoryLimit,
        });
        const prepared = await adapter.prepare({ ...dto, model: resolved.model }, history);
        const patchedPrepared = {
            ...prepared,
            model: resolved.model || prepared.model,
            endpoint: {
                baseUrl: resolved.baseUrl,
                apiKey: resolved.apiKey,
            },
        };
        await this.messageService.create({
            sessionId: dto.sessionId,
            role: message_entity_1.MessageRole.USER,
            content: prepared.userRecord.content,
            images: prepared.userRecord.images,
        });
        try {
            const rawResponse = await adapter.send(patchedPrepared);
            const normalized = await adapter.normalize(rawResponse, patchedPrepared);
            await this.messageService.create({
                sessionId: dto.sessionId,
                role: normalized.assistantRecord.role ?? message_entity_1.MessageRole.ASSISTANT,
                content: normalized.assistantRecord.content,
                images: normalized.assistantRecord.images,
                metadata: normalized.assistantRecord.metadata,
            });
            return normalized.response;
        }
        catch (error) {
            this.handleAdapterError(error);
        }
    }
    handleAdapterError(error) {
        if (error instanceof axios_1.AxiosError) {
            const message = error.response?.data || error.message || error;
            this.logger.error(`调用 AI 服务失败: ${JSON.stringify(message)}`);
            throw new common_1.InternalServerErrorException(`AI 服务调用失败 - ${JSON.stringify(message)}`);
        }
        if (error instanceof Error) {
            this.logger.error(`适配器执行失败: ${error.message}`);
            throw new common_1.InternalServerErrorException('AI 处理失败');
        }
        this.logger.error(`适配器执行失败: ${JSON.stringify(error)}`);
        throw new common_1.InternalServerErrorException('AI 处理失败');
    }
    static extractJsonBlock(raw) {
        const trimmed = raw.trim();
        if (!trimmed)
            throw new Error('返回内容为空');
        if (trimmed.startsWith('{') || trimmed.startsWith('['))
            return trimmed;
        if (trimmed.startsWith('```')) {
            const withoutFirstFence = trimmed.slice(3);
            const firstNewline = withoutFirstFence.indexOf('\n');
            if (firstNewline === -1)
                throw new Error('代码块不完整');
            const rest = withoutFirstFence.slice(firstNewline + 1);
            const endFence = rest.lastIndexOf('```');
            if (endFence === -1)
                throw new Error('未找到代码块结束标记');
            const code = rest.slice(0, endFence).trim();
            if (!code)
                throw new Error('代码块为空');
            return code;
        }
        throw new Error('未找到 JSON 或 markdown 代码块');
    }
    static extractTextFromParts(parts) {
        if (!parts?.length)
            return '';
        const text = parts
            .map((part) => part.text?.trim() || '')
            .filter((segment) => segment.length > 0)
            .join('\n')
            .trim();
        return text;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        message_service_1.MessageService,
        gemini_image_adapter_1.GeminiImageAdapter,
        model_service_1.ModelService])
], AiService);
//# sourceMappingURL=ai.service.js.map