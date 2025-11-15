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
var ScreenAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenAiService = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../ai/ai.service");
const screen_service_1 = require("./screen.service");
const screen_ai_search_dto_1 = require("./dto/screen-ai-search.dto");
const screen_fuzzy_search_query_dto_1 = require("./dto/screen-fuzzy-search-query.dto");
const tag_taxonomy_util_1 = require("./utils/tag-taxonomy.util");
const DIMENSION_CONFIGS = [
    {
        key: 'appCategory',
        snake: 'app_category',
        displayName: '应用类别',
        description: '描述需求所属的应用或行业场景，例如电商、出行、教育等',
        fuzzyField: 'appCategoryL2',
    },
    {
        key: 'componentIndex',
        snake: 'component_index',
        displayName: '组件索引',
        description: '关注页面中突出展示或必须存在的组件模块，例如轮播图、底部导航、操作面板等',
        fuzzyField: 'componentIndexL2',
    },
    {
        key: 'layoutType',
        snake: 'layout_type',
        displayName: '页面布局',
        description: '关注页面内容的整体布局样式，如单列、双列、分屏、卡片式等结构',
        fuzzyField: 'typeL2',
    },
    {
        key: 'pageType',
        snake: 'page_type',
        displayName: '页面类型',
        description: '关注页面在产品流程中的角色，例如首页、详情页、支付页、设置页等',
        fuzzyField: 'pageTypeL2',
    },
    {
        key: 'tagsPrimary',
        snake: 'tags_primary',
        displayName: '核心功能标签',
        description: '描述页面旨在满足的主要目标或关键功能，比如促销转化、数据展示、任务处理等',
        fuzzyField: 'tagsPrimaryL2',
    },
    {
        key: 'tagsStyle',
        snake: 'tags_style',
        displayName: '视觉风格标签',
        description: '描述页面整体视觉或情绪风格，例如极简、科技、活力、商务等',
        fuzzyField: 'tagsStyleL2',
    },
    {
        key: 'tagsComponents',
        snake: 'tags_components',
        displayName: '组件标签',
        description: '页面上最核心或高频出现的组件，例如表格、图表、卡片、列表等',
        fuzzyField: 'tagsComponentsL2',
    },
];
const SYSTEM_INSTRUCTION = `你是一名精通 UI/UX 设计分析的大模型助手，负责根据需求文字解析设计标签。
请严格按照给定的 JSON 格式回复，禁止输出多余文本或解释。
在判断标签时仅使用提供的选项，不要凭空创造新标签。`;
const FIRST_LEVEL_OPTIONS = Object.fromEntries(Object.entries(tag_taxonomy_util_1.TAXONOMY_DATA).map(([key, nodes]) => [
    key,
    (0, tag_taxonomy_util_1.collectFirstLevelNames)(nodes),
]));
const SECOND_LEVEL_LOOKUP = Object.fromEntries(Object.entries(tag_taxonomy_util_1.TAXONOMY_DATA).map(([key, nodes]) => [
    key,
    (0, tag_taxonomy_util_1.buildSecondLevelLookup)(nodes),
]));
const trimText = (value) => typeof value === 'string' ? value.trim() : '';
const sanitizeSelections = (selections, allowed) => {
    if (!selections || selections.length === 0) {
        return [];
    }
    const allowedLookup = new Map(allowed.map((item) => [item.toLowerCase(), item]));
    const unique = new Map();
    selections.forEach((item) => {
        const trimmed = trimText(item);
        if (!trimmed) {
            return;
        }
        const matched = allowedLookup.get(trimmed.toLowerCase());
        if (matched && !unique.has(matched.toLowerCase())) {
            unique.set(matched.toLowerCase(), matched);
        }
    });
    return Array.from(unique.values());
};
const sanitizeSecondLevelSelections = (selections, lookup) => {
    if (!selections) {
        return {};
    }
    const result = {};
    const parentLookup = new Map(Object.keys(lookup).map((key) => [key.toLowerCase(), key]));
    Object.entries(selections).forEach(([parentRaw, children]) => {
        const canonicalParent = parentLookup.get(parentRaw.trim().toLowerCase());
        if (!canonicalParent) {
            return;
        }
        const allowed = lookup[canonicalParent];
        if (!allowed || allowed.length === 0) {
            return;
        }
        const sanitized = sanitizeSelections(children, allowed);
        if (sanitized.length > 0) {
            result[canonicalParent] = sanitized;
        }
    });
    return result;
};
let ScreenAiService = ScreenAiService_1 = class ScreenAiService {
    constructor(aiService, screenService) {
        this.aiService = aiService;
        this.screenService = screenService;
        this.logger = new common_1.Logger(ScreenAiService_1.name);
    }
    async searchWithRequirement(userId, dto) {
        const requirement = dto.requirement;
        const intents = await this.detectDimensionIntent(requirement);
        const dimensionSelections = await this.resolveDimensionSelections(requirement, intents);
        const fuzzQuery = this.buildFuzzySearchQuery(dto, dimensionSelections);
        const totalSelectedTags = Object.values(dimensionSelections).reduce((count, current) => count + current.secondLevel.length, 0);
        let searchResult;
        let notice;
        if (totalSelectedTags === 0) {
            notice = 'AI 未能提取任何可用标签，请完善需求描述后重试';
            searchResult = {
                items: [],
                total: 0,
                page: dto.page,
                pageSize: dto.pageSize,
            };
        }
        else {
            searchResult = await this.screenService.fuzzySearch(userId, fuzzQuery);
        }
        const response = new screen_ai_search_dto_1.ScreenAiSearchResponseDto();
        response.tags = this.composeTagsDto(dimensionSelections);
        response.search = searchResult;
        response.llmMeta = this.composeMetaDto(intents, notice);
        return response;
    }
    async detectDimensionIntent(requirement) {
        const dimensionDescriptions = DIMENSION_CONFIGS.map((config) => `${config.snake}: ${config.displayName} —— ${config.description}`).join('\n');
        const intentPrompt = `请严格按以下要求判断需求是否涉及给定的设计维度（禁止联想或补全，仅依据原文显式信息）。

需求内容: """${requirement}"""
维度说明:
${dimensionDescriptions}

严格匹配原则：
- 仅当需求原文中直接出现该维度的明确词语或同义词时，relevant 才能为 true；否则一律为 false。
- 禁止依据常识、行业惯例或典型页面结构进行任何推断。
- reason（若返回）必须只包含从原文中摘录的证据片段，并用中文引号括起；若 relevant 为 false 可省略 reason。
- confidence 仅在 relevant 为 true 且证据明确时返回 1；否则不要返回。

请输出 JSON，格式如下：
{
  "dimensions": {
    "app_category": { "relevant": true/false, "reason": "“……原文片段……”", "confidence": 1 },
    "component_index": { ... },
    ...
  }
}
说明：
1) 若无法从原文找到该维度的直接证据，请返回 { "relevant": false }；
2) 不要输出任何额外文本。`;
        let response;
        try {
            response = await this.aiService.generateJsonResponse({
                systemInstruction: SYSTEM_INSTRUCTION,
                userPrompt: intentPrompt,
            });
        }
        catch (err) {
            this.logger.warn(`[AI] detectDimensionIntent failed: ${err instanceof Error ? err.message : String(err)}`);
            response = undefined;
        }
        const intentResult = {};
        DIMENSION_CONFIGS.forEach((config) => {
            const raw = response?.dimensions?.[config.snake];
            const relevant = raw?.relevant === true;
            const confidenceValue = raw?.confidence !== undefined ? Number(raw.confidence) : undefined;
            intentResult[config.key] = {
                relevant,
                reason: trimText(raw?.reason),
                confidence: Number.isFinite(confidenceValue) && confidenceValue !== undefined
                    ? Number(confidenceValue.toFixed(2))
                    : undefined,
            };
        });
        return intentResult;
    }
    async resolveDimensionSelections(requirement, intents) {
        const tasks = DIMENSION_CONFIGS.map(async (config) => {
            try {
                const intent = intents[config.key];
                if (!intent?.relevant) {
                    return {
                        key: config.key,
                        selection: new screen_ai_search_dto_1.ScreenAiDimensionSelectionDto(),
                    };
                }
                const firstLevelSelections = await this.selectFirstLevelTags(requirement, config);
                const secondLevelSelections = await this.selectSecondLevelTags(requirement, config, firstLevelSelections);
                const selection = new screen_ai_search_dto_1.ScreenAiDimensionSelectionDto();
                selection.firstLevel = firstLevelSelections;
                selection.secondLevel = Array.from(new Set(Object.values(secondLevelSelections).flatMap((items) => items)));
                selection.mapping = secondLevelSelections;
                return { key: config.key, selection };
            }
            catch (err) {
                this.logger.warn(`[AI] resolveDimensionSelections(${config.key}) failed: ${err instanceof Error ? err.message : String(err)}`);
                return {
                    key: config.key,
                    selection: new screen_ai_search_dto_1.ScreenAiDimensionSelectionDto(),
                };
            }
        });
        const resolved = await Promise.all(tasks);
        const result = {};
        resolved.forEach(({ key, selection }) => {
            result[key] = selection;
        });
        return result;
    }
    async selectFirstLevelTags(requirement, config) {
        const options = FIRST_LEVEL_OPTIONS[config.key] || [];
        if (options.length === 0) {
            return [];
        }
        const prompt = `需求描述: """${requirement}"""
当前维度: ${config.displayName} (${config.snake})
${config.description}
可选的一级标签如下：
${options.map((item, index) => `${index + 1}. ${item}`).join('\n')}
请选择 0~1 个最契合的一级标签，如果没有合适标签请返回空数组。
请严格输出 JSON，格式：{"selected": ["标签A","标签B"]}`;
        try {
            const response = await this.aiService.generateJsonResponse({
                systemInstruction: SYSTEM_INSTRUCTION,
                userPrompt: prompt,
            });
            return sanitizeSelections(response.selected, options);
        }
        catch (err) {
            this.logger.warn(`[AI] selectFirstLevelTags(${config.key}) failed: ${err instanceof Error ? err.message : String(err)}`);
            return [];
        }
    }
    async selectSecondLevelTags(requirement, config, firstLevelSelections) {
        if (!firstLevelSelections || firstLevelSelections.length === 0) {
            return {};
        }
        const lookup = SECOND_LEVEL_LOOKUP[config.key] || {};
        const availableEntries = firstLevelSelections
            .map((parent) => ({
            parent,
            options: lookup[parent],
        }))
            .filter((item) => item.options && item.options.length > 0);
        if (availableEntries.length === 0) {
            return {};
        }
        const prompt = `需求描述: """${requirement}"""
当前维度: ${config.displayName} (${config.snake})
已选一级标签: ${firstLevelSelections.join(', ')}
请在对应的二级标签中，分别为每个一级标签挑选 0~2 个最契合的二级标签。
二级标签选项：
${availableEntries
            .map((entry) => `${entry.parent}: [${entry.options?.map((item) => `"${item}"`).join(', ')}]`)
            .join('\n')}
输出格式示例：{"selected": {"一级标签A": ["二级1","二级2"]}}
若没有合适的二级标签，可令对应数组为空。`;
        try {
            const response = await this.aiService.generateJsonResponse({
                systemInstruction: SYSTEM_INSTRUCTION,
                userPrompt: prompt,
            });
            return sanitizeSecondLevelSelections(response.selected, lookup);
        }
        catch (err) {
            this.logger.warn(`[AI] selectSecondLevelTags(${config.key}) failed: ${err instanceof Error ? err.message : String(err)}`);
            return {};
        }
    }
    buildFuzzySearchQuery(dto, selections) {
        const query = new screen_fuzzy_search_query_dto_1.ScreenFuzzySearchQueryDto();
        query.page = dto.page;
        query.pageSize = dto.pageSize;
        query.projectId = dto.projectId;
        query.platform = dto.platform;
        DIMENSION_CONFIGS.forEach((config) => {
            const secondLevel = selections[config.key]?.secondLevel || [];
            if (secondLevel.length === 0) {
                return;
            }
            query[config.fuzzyField] = secondLevel;
        });
        return query;
    }
    composeTagsDto(selections) {
        const tags = new screen_ai_search_dto_1.ScreenAiTagsDto();
        tags.appCategory = selections.appCategory;
        tags.componentIndex = selections.componentIndex;
        tags.layoutType = selections.layoutType;
        tags.pageType = selections.pageType;
        tags.tagsPrimary = selections.tagsPrimary;
        tags.tagsStyle = selections.tagsStyle;
        tags.tagsComponents = selections.tagsComponents;
        return tags;
    }
    composeMetaDto(intents, notice) {
        const intentEntries = Object.entries(intents).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
        return {
            intent: intentEntries,
            notice,
        };
    }
};
exports.ScreenAiService = ScreenAiService;
exports.ScreenAiService = ScreenAiService = ScreenAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        screen_service_1.ScreenService])
], ScreenAiService);
//# sourceMappingURL=screen-ai.service.js.map