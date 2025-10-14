import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AiService } from '../ai/ai.service';
import { ProjectService } from './project.service';
import {
  ProjectAiDimensionIntentDto,
  ProjectAiDimensionSelectionDto,
  ProjectAiMetaDto,
  ProjectAiSearchRequestDto,
  ProjectAiSearchResponseDto,
  ProjectAiTagsDto,
} from './dto/project-ai-search.dto';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Project } from './entities/project.entity';
import {
  TaxonomyNode,
  applicationTypeData,
  buildSecondLevelLookup,
  collectFirstLevelNames,
  industrySectorData,
} from './utils/project-taxonomy.util';

type ProjectDimensionKey = 'applicationType' | 'industrySector';

type DimensionSnakeCase = 'application_type' | 'industry_sector';

interface DimensionConfig {
  key: ProjectDimensionKey;
  snake: DimensionSnakeCase;
  displayName: string;
  description: string;
}

interface LlmIntentResponse {
  dimensions: Record<
    DimensionSnakeCase,
    {
      relevant: boolean;
      reason?: string;
      confidence?: number | string;
    }
  >;
}

interface LlmSelectionResponse {
  selected?: string[];
}

interface LlmSecondLevelResponse {
  selected?: Record<string, string[]>;
}

const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    key: 'applicationType',
    snake: 'application_type',
    displayName: '应用类型',
    description:
      '描述产品面向的主要应用场景或功能类型，例如日程管理、任务协作、密码管理等',
  },
  {
    key: 'industrySector',
    snake: 'industry_sector',
    displayName: '行业领域',
    description:
      '描述产品所服务的行业或业务领域，例如信息安全、金融服务、健康医疗等',
  },
];

const SYSTEM_INSTRUCTION = `你是一名精通产品与行业分类的大模型助手，需要根据用户需求提取项目的分类标签。
请严格按照给定的 JSON 格式回复，禁止输出多余文本或解释。
在判断标签时仅使用提供的选项，不要凭空创造新标签。`;

const TAXONOMY_DATA: Record<ProjectDimensionKey, TaxonomyNode[]> = {
  applicationType: applicationTypeData,
  industrySector: industrySectorData,
};

const FIRST_LEVEL_OPTIONS: Record<ProjectDimensionKey, string[]> =
  Object.fromEntries(
    Object.entries(TAXONOMY_DATA).map(([key, nodes]) => [
      key,
      collectFirstLevelNames(nodes),
    ]),
  ) as Record<ProjectDimensionKey, string[]>;

const SECOND_LEVEL_LOOKUP: Record<
  ProjectDimensionKey,
  Record<string, string[]>
> = Object.fromEntries(
  Object.entries(TAXONOMY_DATA).map(([key, nodes]) => [
    key,
    buildSecondLevelLookup(nodes),
  ]),
) as Record<ProjectDimensionKey, Record<string, string[]>>;

const trimText = (value?: string): string =>
  typeof value === 'string' ? value.trim() : '';

const sanitizeSelections = (
  selections: string[] | undefined,
  allowed: string[],
): string[] => {
  if (!selections || selections.length === 0) {
    return [];
  }
  const allowedLookup = new Map(
    allowed.map((item) => [item.toLowerCase(), item]),
  );
  const unique = new Map<string, string>();
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

const sanitizeSecondLevelSelections = (
  selections: Record<string, string[]> | undefined,
  lookup: Record<string, string[]>,
): Record<string, string[]> => {
  if (!selections) {
    return {};
  }
  const result: Record<string, string[]> = {};
  const parentLookup = new Map(
    Object.keys(lookup).map((key) => [key.toLowerCase(), key]),
  );
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

@Injectable()
export class ProjectAiService {
  private readonly logger = new Logger(ProjectAiService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly projectService: ProjectService,
  ) {}

  async searchWithRequirement(
    userId: string,
    dto: ProjectAiSearchRequestDto,
  ): Promise<ProjectAiSearchResponseDto> {
    const requirement = dto.requirement;

    const intents = await this.detectDimensionIntent(requirement);
    const selections = await this.resolveDimensionSelections(
      requirement,
      intents,
    );

    const applicationTags = selections.applicationType.secondLevel;
    const industryTags = selections.industrySector.secondLevel;
    const totalTags = applicationTags.length + industryTags.length;

    let searchResult: PaginationDto<Project>;
    let notice: string | undefined;

    if (totalTags === 0) {
      notice = 'AI 未能提取任何可用标签，请完善需求描述后重试';
      searchResult = {
        items: [],
        total: 0,
        page: dto.page,
        pageSize: dto.pageSize,
      };
    } else {
      const searchQuery = this.buildProjectQuery(dto, {
        applicationType: applicationTags,
        industrySector: industryTags,
      });
      searchResult = await this.projectService.findAll(userId, searchQuery);
    }

    const response = new ProjectAiSearchResponseDto();
    response.tags = this.composeTagsDto(selections);
    response.search = searchResult;
    response.llmMeta = this.composeMetaDto(intents, notice);
    return response;
  }

  private async detectDimensionIntent(
    requirement: string,
  ): Promise<Record<ProjectDimensionKey, ProjectAiDimensionIntentDto>> {
    const dimensionDescriptions = DIMENSION_CONFIGS.map(
      (config) =>
        `${config.snake}: ${config.displayName} —— ${config.description}`,
    ).join('\n');

    const intentPrompt = `请严格按以下要求判断需求是否涉及给定的项目分类维度（禁止联想或补全，仅依据原文显式信息）。

需求内容: """${requirement}"""
维度说明:
${dimensionDescriptions}

严格匹配原则：
- 仅当需求原文中直接出现该维度的明确词语或同义词时，relevant 才能为 true；否则一律为 false。
- reason（若返回）必须只包含从原文中摘录的证据片段，并用中文引号括起；若 relevant 为 false 可省略 reason。
- confidence 仅在 relevant 为 true 且证据明确时返回 1；否则不要返回。

请输出 JSON，格式如下：
{
  "dimensions": {
    "application_type": { "relevant": true/false, "reason": "“……原文片段……”", "confidence": 1 },
    "industry_sector": { ... }
  }
}
说明：
1) 若无法从原文找到该维度的直接证据，请返回 { "relevant": false }；
2) 不要输出任何额外文本。`;

    let response: LlmIntentResponse | undefined;
    try {
      response = await this.aiService.generateJsonResponse<LlmIntentResponse>({
        systemInstruction: SYSTEM_INSTRUCTION,
        userPrompt: intentPrompt,
      });
    } catch (err) {
      this.logger.warn(
        `[AI] detectDimensionIntent failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      response = undefined;
    }

    const intentResult =
      {} as Record<ProjectDimensionKey, ProjectAiDimensionIntentDto>;

    DIMENSION_CONFIGS.forEach((config) => {
      const raw = response?.dimensions?.[config.snake];
      const relevant = raw?.relevant === true;
      const confidenceValue =
        raw?.confidence !== undefined ? Number(raw.confidence) : undefined;
      intentResult[config.key] = {
        relevant,
        reason: trimText(raw?.reason),
        confidence:
          Number.isFinite(confidenceValue) && confidenceValue !== undefined
            ? Number(confidenceValue.toFixed(2))
            : undefined,
      };
    });

    return intentResult;
  }

  private async resolveDimensionSelections(
    requirement: string,
    intents: Record<ProjectDimensionKey, ProjectAiDimensionIntentDto>,
  ): Promise<Record<ProjectDimensionKey, ProjectAiDimensionSelectionDto>> {
    const tasks = DIMENSION_CONFIGS.map(async (config) => {
      try {
        const intent = intents[config.key];
        if (!intent?.relevant) {
          return {
            key: config.key,
            selection: new ProjectAiDimensionSelectionDto(),
          };
        }

        const firstLevelSelections = await this.selectFirstLevelTags(
          requirement,
          config,
        );

        const secondLevelSelections = await this.selectSecondLevelTags(
          requirement,
          config,
          firstLevelSelections,
        );

        const selection = new ProjectAiDimensionSelectionDto();
        selection.firstLevel = firstLevelSelections;
        selection.secondLevel = Array.from(
          new Set(
            Object.values(secondLevelSelections).flatMap((items) => items),
          ),
        );
        selection.mapping = secondLevelSelections;

        return { key: config.key, selection };
      } catch (err) {
        this.logger.warn(
          `[AI] resolveDimensionSelections(${config.key}) failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return {
          key: config.key,
          selection: new ProjectAiDimensionSelectionDto(),
        };
      }
    });

    const resolved = await Promise.all(tasks);
    const result =
      {} as Record<ProjectDimensionKey, ProjectAiDimensionSelectionDto>;
    resolved.forEach(({ key, selection }) => {
      result[key] = selection;
    });
    return result;
  }

  private async selectFirstLevelTags(
    requirement: string,
    config: DimensionConfig,
  ): Promise<string[]> {
    const options = FIRST_LEVEL_OPTIONS[config.key] || [];
    if (options.length === 0) {
      return [];
    }

    const prompt = `需求描述: """${requirement}"""
当前维度: ${config.displayName} (${config.snake})
${config.description}
可选的一级标签如下：
${options.map((item, index) => `${index + 1}. ${item}`).join('\n')}
请选择 0~2 个最契合的一级标签，如果没有合适标签请返回空数组。
请严格输出 JSON，格式：{"selected": ["标签A","标签B"]}`;

    try {
      const response =
        await this.aiService.generateJsonResponse<LlmSelectionResponse>({
          systemInstruction: SYSTEM_INSTRUCTION,
          userPrompt: prompt,
        });
      return sanitizeSelections(response.selected, options);
    } catch (err) {
      this.logger.warn(
        `[AI] selectFirstLevelTags(${config.key}) failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return [];
    }
  }

  private async selectSecondLevelTags(
    requirement: string,
    config: DimensionConfig,
    firstLevelSelections: string[],
  ): Promise<Record<string, string[]>> {
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
请在对应的二级标签中，分别为每个一级标签挑选 0~3 个最契合的二级标签。
二级标签选项：
${availableEntries
  .map(
    (entry) =>
      `${entry.parent}: [${entry.options?.map((item) => `"${item}"`).join(', ')}]`,
  )
  .join('\n')}
输出格式示例：{"selected": {"一级标签A": ["二级1","二级2"]}}
若没有合适的二级标签，可令对应数组为空。`;

    try {
      const response =
        await this.aiService.generateJsonResponse<LlmSecondLevelResponse>({
          systemInstruction: SYSTEM_INSTRUCTION,
          userPrompt: prompt,
        });
      return sanitizeSecondLevelSelections(response.selected, lookup);
    } catch (err) {
      this.logger.warn(
        `[AI] selectSecondLevelTags(${config.key}) failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {};
    }
  }

  private buildProjectQuery(
    dto: ProjectAiSearchRequestDto,
    tags: {
      applicationType: string[];
      industrySector: string[];
    },
  ): ProjectListQueryDto {
    const query = plainToInstance(ProjectListQueryDto, {
      page: dto.page,
      pageSize: dto.pageSize,
      platform: dto.platform,
      applicationType: tags.applicationType,
      industrySector: tags.industrySector,
    });

    return query;
  }

  private composeTagsDto(
    selections: Record<ProjectDimensionKey, ProjectAiDimensionSelectionDto>,
  ): ProjectAiTagsDto {
    const tags = new ProjectAiTagsDto();
    tags.applicationType = selections.applicationType;
    tags.industrySector = selections.industrySector;
    return tags;
  }

  private composeMetaDto(
    intents: Record<ProjectDimensionKey, ProjectAiDimensionIntentDto>,
    notice?: string,
  ): ProjectAiMetaDto {
    const intentEntries = Object.entries(intents).reduce<
      Record<string, ProjectAiDimensionIntentDto>
    >((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    return {
      intent: intentEntries,
      notice,
    };
  }
}
