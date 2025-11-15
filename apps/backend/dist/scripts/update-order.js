"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const fs = require("node:fs");
const path = require("node:path");
const app_module_1 = require("../src/app.module");
const screen_entity_1 = require("../src/modules/screen/entities/screen.entity");
const DEFAULT_BATCH_SIZE = 1000;
const ios = `/Users/zhangzhihao/Downloads/ui/ios`;
const web = `/Users/zhangzhihao/Downloads/ui/web`;
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
async function updateScreenOrders(model, screens, batchSize, dryRun) {
    if (!screens.length) {
        console.log('未检测到需要更新排序的界面，跳过处理。');
        return;
    }
    const validScreens = screens.filter((item) => typeof item.screenId === 'string' &&
        item.screenId.trim().length > 0 &&
        Number.isFinite(item.order));
    if (!validScreens.length) {
        console.log('未找到合法的排序数据，跳过处理。');
        return;
    }
    const uniqueScreens = Array.from(new Map(validScreens.map((item) => [item.screenId, item])).values());
    console.log(`准备更新 ${uniqueScreens.length} 个 Screen 的排序（原始数据 ${screens.length} 条）。`);
    if (dryRun) {
        console.log('当前为 dry-run 模式，未执行数据库写入。');
        return;
    }
    const screenChunks = chunk(uniqueScreens, batchSize);
    let matched = 0;
    let modified = 0;
    let upserted = 0;
    for (let i = 0; i < screenChunks.length; i += 1) {
        const batch = screenChunks[i];
        const operations = batch.map((screen) => ({
            updateOne: {
                filter: { screenId: screen.screenId },
                update: {
                    $set: { order: screen.order },
                },
                upsert: false,
            },
        }));
        const { matchedCount, modifiedCount, upsertedCount } = await model.bulkWrite(operations, {
            ordered: false,
        });
        matched += matchedCount;
        modified += modifiedCount;
        upserted += upsertedCount;
        console.log(`Screen 批次 ${i + 1}/${screenChunks.length} 完成: 匹配 ${matchedCount}, 更新 ${modifiedCount}, 新建 ${upsertedCount}`);
    }
    console.log(`Screen 排序更新完成: 匹配 ${matched} 条，更新 ${modified} 条，新建 ${upserted} 条（预期应为 0）。`);
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'log'],
    });
    try {
        const screenModel = app.get((0, mongoose_1.getModelToken)(screen_entity_1.Screen.name));
        const [, , batchSizeArg, dryRunArg] = process.argv;
        const batchSize = batchSizeArg
            ? Number(batchSizeArg)
            : DEFAULT_BATCH_SIZE;
        if (Number.isNaN(batchSize) || batchSize <= 0) {
            throw new Error('batchSize 需要是大于 0 的数字');
        }
        const dryRun = dryRunArg === 'dry-run';
        const screens = [];
        [ios, web].forEach((p) => {
            const list = fs.readdirSync(p);
            for (const item of list) {
                if (item === '.DS_Store')
                    continue;
                const imgsJson = path.join(p, item, 'imgs.json');
                if (fs.existsSync(imgsJson)) {
                    const data = readJsonSync(imgsJson);
                    if (data.uiParseResults && data.uiParseResults.length > 0) {
                        data.uiParseResults.forEach((res) => {
                            const p1 = path.join(p, item, 'ui-analysis', res.analysisFile);
                            if (fs.existsSync(p1)) {
                                readJsonSync(p1);
                                const file = res.analysisFile.split('.')[0];
                                const parts = file.split('_');
                                const order = parts[0];
                                const screenId = parts[1];
                                pushScreenOrder(screens, screenId, order, res.analysisFile);
                            }
                        });
                    }
                    if (data.classicParseResults && data.classicParseResults.length > 0) {
                        data.classicParseResults.forEach((res) => {
                            const p1 = path.join(p, item, 'classic-analysis', res.analysisFile);
                            if (fs.existsSync(p1)) {
                                readJsonSync(p1);
                                const file = res.analysisFile.split('.')[0];
                                const parts = file.split('_');
                                const order = parts[1];
                                const screenId = parts[2];
                                pushScreenOrder(screens, screenId, order, res.analysisFile);
                            }
                        });
                    }
                }
            }
        });
        await updateScreenOrders(screenModel, screens, batchSize, dryRun);
        console.log('数据导入流程完成');
    }
    finally {
        await app.close();
    }
}
bootstrap().catch((error) => {
    console.error('导入失败', error);
    process.exitCode = 1;
});
function readJsonSync(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    const d = JSON.parse(data);
    return d;
}
function writeJsonSync(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
function getUrl(p) {
    const arr = p.split('/');
    return arr[arr.length - 1];
}
function parseOrder(raw) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        return Math.trunc(raw);
    }
    if (typeof raw !== 'string') {
        return null;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
}
function pushScreenOrder(target, screenIdRaw, orderRaw, source) {
    const screenId = typeof screenIdRaw === 'string' ? screenIdRaw.trim() : '';
    if (!screenId) {
        console.warn(`跳过无效 screenId: ${source}`);
        return;
    }
    const orderValue = parseOrder(orderRaw);
    if (orderValue === null) {
        console.warn(`跳过无法解析排序的记录: ${source}`);
        return;
    }
    target.push({ screenId, order: orderValue });
}
function analysisJson(analysis, recommended) {
    const data = {
        projectId: analysis.projectId,
        screenId: analysis.screenId,
        originalUrl: `https://bytescale.mobbin.com/FW25bBB/image/mobbin.com/prod/content/app_screens/${analysis.screenId}.png`,
        url: `${analysis.screenId}.webp`,
        isRecommended: recommended,
        pageType: analysis.page_type,
        pageTypeL2: analysis.page_type_l2,
        platform: analysis.platform.toLowerCase(),
        appCategory: analysis.metadata.app_category,
        appCategoryL2: analysis.metadata.app_category_l2,
        intent: analysis.metadata.intent,
        designSystem: analysis.global_style.design_system,
        type: analysis.layout.type,
        spacing: analysis.layout.spacing,
        density: analysis.layout.density,
        typeL2: analysis.layout.type_l2,
        componentIndex: analysis.component_index,
        componentIndexL2: analysis.component_index_l2,
        tagsPrimary: analysis.tags_primary,
        tagsPrimaryL2: analysis.tags_primary_l2,
        tagsStyle: analysis.tags_style,
        tagsStyleL2: analysis.tags_style_l2,
        tagsComponents: analysis.tags_components,
        tagsComponentsL2: analysis.tags_components_l2,
        designStyle: analysis.global_style.design_style,
        feeling: analysis.global_style.feeling,
    };
    return data;
}
//# sourceMappingURL=update-order.js.map