"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const fs = require("node:fs");
const path = require("node:path");
const app_module_1 = require("../src/app.module");
const project_entity_1 = require("../src/modules/project/entities/project.entity");
const screen_entity_1 = require("../src/modules/screen/entities/screen.entity");
const DEFAULT_PROJECT_FILE = path.resolve(__dirname, 'data/projects.json');
const DEFAULT_SCREEN_FILE = path.resolve(__dirname, 'data/screens.json');
const DEFAULT_BATCH_SIZE = 1000;
const ios = `/Users/zhangzhihao/Downloads/ui/ios`;
const web = `/Users/zhangzhihao/Downloads/ui/web`;
function loadJsonArray(filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`未找到数据文件: ${resolved}`);
    }
    const content = fs.readFileSync(resolved, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
        throw new Error(`数据文件不是数组: ${resolved}`);
    }
    return parsed;
}
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
async function importProjects(model, projects, dryRun) {
    if (!projects.length) {
        console.log('未检测到项目数据，跳过 Project 导入。');
        return;
    }
    console.log(`准备导入 ${projects.length} 个 Project 纪录...`);
    if (dryRun) {
        console.log('当前为 dry-run 模式，未执行数据库写入。');
        return;
    }
    const operations = projects.map((project) => ({
        updateOne: {
            filter: { projectId: project.projectId },
            update: { $set: project },
            upsert: true,
        },
    }));
    const { matchedCount, modifiedCount, upsertedCount } = await model.bulkWrite(operations, {
        ordered: false,
    });
    console.log(`Project 导入完成: 匹配 ${matchedCount} 条，更新 ${modifiedCount} 条，新建 ${upsertedCount} 条。`);
}
async function importScreens(model, screens, batchSize, dryRun) {
    if (!screens.length) {
        console.log('未检测到界面数据，跳过 Screen 导入。');
        return;
    }
    console.log(`准备导入 ${screens.length} 个 Screen 纪录...`);
    if (dryRun) {
        console.log('当前为 dry-run 模式，未执行数据库写入。');
        return;
    }
    const screenChunks = chunk(screens, batchSize);
    let matched = 0;
    let modified = 0;
    let upserted = 0;
    for (let i = 0; i < screenChunks.length; i += 1) {
        const batch = screenChunks[i];
        const operations = batch.map((screen) => ({
            updateOne: {
                filter: { screenId: screen.screenId },
                update: {
                    $set: {
                        ...screen,
                        createdAt: screen.createdAt
                            ? new Date(screen.createdAt)
                            : undefined,
                        updatedAt: screen.updatedAt
                            ? new Date(screen.updatedAt)
                            : undefined,
                    },
                },
                upsert: true,
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
    console.log(`Screen 导入完成: 匹配 ${matched} 条，更新 ${modified} 条，新建 ${upserted} 条。`);
}
async function updateScreenCount(model, screens, dryRun) {
    if (!screens.length) {
        return;
    }
    const screenCountByProject = new Map();
    screens.forEach((screen) => {
        const current = screenCountByProject.get(screen.projectId) ?? 0;
        screenCountByProject.set(screen.projectId, current + 1);
    });
    if (!screenCountByProject.size) {
        return;
    }
    console.log('根据 Screen 数据更新 Project.screenCount...');
    if (dryRun) {
        console.log('当前为 dry-run 模式，未执行数据库写入。');
        return;
    }
    const operations = Array.from(screenCountByProject.entries()).map(([projectId, count]) => ({
        updateOne: {
            filter: { projectId },
            update: { $set: { screenCount: count } },
            upsert: false,
        },
    }));
    if (!operations.length) {
        return;
    }
    const { modifiedCount } = await model.bulkWrite(operations, {
        ordered: false,
    });
    console.log(`Project.screenCount 更新完成，更新 ${modifiedCount} 条记录。`);
}
function resolveOptions() {
    const [, , projectFileArg, screenFileArg, batchSizeArg, dryRunArg] = process.argv;
    const options = {
        projectFile: projectFileArg ?? DEFAULT_PROJECT_FILE,
        screenFile: screenFileArg ?? DEFAULT_SCREEN_FILE,
        batchSize: batchSizeArg ? Number(batchSizeArg) : DEFAULT_BATCH_SIZE,
        dryRun: dryRunArg === 'dry-run',
    };
    if (Number.isNaN(options.batchSize) || options.batchSize <= 0) {
        throw new Error('batchSize 需要是大于 0 的数字');
    }
    return options;
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'log'],
    });
    try {
        const projectModel = app.get((0, mongoose_1.getModelToken)(project_entity_1.Project.name));
        const screenModel = app.get((0, mongoose_1.getModelToken)(screen_entity_1.Screen.name));
        const mp = readJsonSync('/Users/zhangzhihao/Documents/GitHub/Design/apps/backend/scripts/data/mp.json');
        const projects = [];
        const screens = [];
        [ios, web].forEach((p) => {
            const list = fs.readdirSync(p);
            for (const item of list) {
                if (item === '.DS_Store')
                    continue;
                const imgsJson = path.join(p, item, 'imgs.json');
                if (fs.existsSync(imgsJson)) {
                    const data = readJsonSync(imgsJson);
                    const mpitem = mp[data.id];
                    const project = {
                        platform: data.platform,
                        appName: data.appName,
                        name: data.name,
                        projectId: data.id,
                        appLogoUrl: getUrl(mpitem.appLogoUrl),
                        previewScreens: mpitem.previewScreens.map((p) => getUrl(p.screenUrl)),
                        screenCount: data.classicCount + data.recommendedCount,
                        recommendedCount: data.recommendedCount,
                        appTagline: mpitem.appTagline,
                        keywords: mpitem.keywords,
                    };
                    projects.push(project);
                    if (data.uiParseResults && data.uiParseResults.length > 0) {
                        data.uiParseResults.forEach((res) => {
                            const p1 = path.join(p, item, 'ui-analysis', res.analysisFile);
                            if (fs.existsSync(p1)) {
                                const analysis = readJsonSync(p1);
                                const screenId = res.analysisFile.split('.')[0].split('_')[1];
                                analysis.projectId = data.id;
                                analysis.screenId = screenId;
                                screens.push(analysisJson(analysis, true));
                            }
                        });
                    }
                    if (data.classicParseResults && data.classicParseResults.length > 0) {
                        data.classicParseResults.forEach((res) => {
                            const p1 = path.join(p, item, 'classic-analysis', res.analysisFile);
                            if (fs.existsSync(p1)) {
                                const analysis = readJsonSync(p1);
                                const screenId = res.analysisFile.split('.')[0].split('_')[2];
                                analysis.projectId = data.id;
                                analysis.screenId = screenId;
                                screens.push(analysisJson(analysis, false));
                            }
                        });
                    }
                }
            }
        });
        await importProjects(projectModel, projects, false);
        await importScreens(screenModel, screens, 1000, false);
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
//# sourceMappingURL=import-projects-and-screens.js.map