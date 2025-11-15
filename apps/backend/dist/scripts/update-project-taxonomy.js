"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("tsconfig-paths/register");
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const fs = require("node:fs");
const path = require("node:path");
const app_module_1 = require("../src/app.module");
const project_entity_1 = require("../src/modules/project/entities/project.entity");
const DEFAULT_BATCH_SIZE = 1000;
const iosRoot = `/Users/zhangzhihao/Downloads/ui/ios`;
const webRoot = `/Users/zhangzhihao/Downloads/ui/web`;
function chunk(items, size) {
    if (size <= 0) {
        throw new Error('batchSize 必须大于 0');
    }
    const result = [];
    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size));
    }
    return result;
}
function readJsonSync(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}
function normalizeStringArray(raw) {
    if (!Array.isArray(raw)) {
        return undefined;
    }
    const normalized = raw
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    if (!normalized.length) {
        return undefined;
    }
    return Array.from(new Set(normalized));
}
function mergeArrays(target, source) {
    if (!target && !source) {
        return undefined;
    }
    const merged = new Set();
    (target ?? []).forEach((item) => merged.add(item));
    (source ?? []).forEach((item) => merged.add(item));
    return merged.size ? Array.from(merged) : undefined;
}
function collectProjectTaxonomies(roots) {
    const items = [];
    roots.forEach((root) => {
        if (!fs.existsSync(root)) {
            console.warn(`目录不存在，跳过: ${root}`);
            return;
        }
        const entries = fs.readdirSync(root);
        for (const entry of entries) {
            if (entry === '.DS_Store') {
                continue;
            }
            const imgsJson = path.join(root, entry, 'imgs.json');
            if (!fs.existsSync(imgsJson)) {
                continue;
            }
            try {
                const data = readJsonSync(imgsJson);
                const projectId = typeof data.id === 'string' ? data.id.trim() : '';
                if (!projectId) {
                    continue;
                }
                const applicationType = normalizeStringArray(data.application_type);
                const industrySector = normalizeStringArray(data.industry_sector);
                if (!applicationType && !industrySector) {
                    continue;
                }
                items.push({
                    projectId,
                    applicationType,
                    industrySector,
                });
            }
            catch (error) {
                console.warn(`读取失败，已跳过: ${imgsJson}`, error);
            }
        }
    });
    if (!items.length) {
        return [];
    }
    const merged = new Map();
    items.forEach((item) => {
        const existing = merged.get(item.projectId);
        if (!existing) {
            merged.set(item.projectId, item);
            return;
        }
        merged.set(item.projectId, {
            projectId: item.projectId,
            applicationType: mergeArrays(existing.applicationType, item.applicationType),
            industrySector: mergeArrays(existing.industrySector, item.industrySector),
        });
    });
    return Array.from(merged.values());
}
async function updateProjectTaxonomies(model, seeds, batchSize, dryRun) {
    if (!seeds.length) {
        console.log('未检测到需要更新的 Project 数据，跳过处理。');
        return;
    }
    const validSeeds = seeds.filter((item) => item.projectId &&
        ((item.applicationType && item.applicationType.length > 0) ||
            (item.industrySector && item.industrySector.length > 0)));
    if (!validSeeds.length) {
        console.log('未找到合法的 Project 字段数据，跳过处理。');
        return;
    }
    console.log(`准备更新 ${validSeeds.length} 个 Project 的分类字段（采集源数据 ${seeds.length} 条）。`);
    if (dryRun) {
        console.log('当前为 dry-run 模式，未执行数据库写入。');
        return;
    }
    const seedChunks = chunk(validSeeds, batchSize);
    let matched = 0;
    let modified = 0;
    for (let i = 0; i < seedChunks.length; i += 1) {
        const batch = seedChunks[i];
        const operations = batch.map((item) => {
            const payload = {};
            if (item.applicationType?.length) {
                payload.applicationType = item.applicationType;
            }
            if (item.industrySector?.length) {
                payload.industrySector = item.industrySector;
            }
            return {
                updateOne: {
                    filter: { projectId: item.projectId },
                    update: { $set: payload },
                    upsert: false,
                },
            };
        });
        const { matchedCount, modifiedCount } = await model.bulkWrite(operations, {
            ordered: false,
        });
        matched += matchedCount;
        modified += modifiedCount;
        console.log(`Project 批次 ${i + 1}/${seedChunks.length} 完成: 匹配 ${matchedCount}, 更新 ${modifiedCount}`);
    }
    console.log(`Project 分类字段更新完成: 匹配 ${matched} 条，更新 ${modified} 条。`);
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'log'],
    });
    try {
        const projectModel = app.get((0, mongoose_1.getModelToken)(project_entity_1.Project.name));
        const [, , batchSizeArg, dryRunArg] = process.argv;
        const batchSize = batchSizeArg ? Number(batchSizeArg) : DEFAULT_BATCH_SIZE;
        if (Number.isNaN(batchSize) || batchSize <= 0) {
            throw new Error('batchSize 需要是大于 0 的数字');
        }
        const dryRun = dryRunArg === 'dry-run';
        const seeds = collectProjectTaxonomies([iosRoot, webRoot]);
        await updateProjectTaxonomies(projectModel, seeds, batchSize, dryRun);
        console.log('Project 分类字段更新流程完成');
    }
    finally {
        await app.close();
    }
}
bootstrap().catch((error) => {
    console.error('更新失败', error);
    process.exitCode = 1;
});
//# sourceMappingURL=update-project-taxonomy.js.map