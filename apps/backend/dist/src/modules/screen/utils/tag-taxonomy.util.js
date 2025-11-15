"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSecondLevelLookup = exports.collectFirstLevelNames = exports.collectSecondLevelNames = exports.TAXONOMY_DATA = exports.layoutTypeData = exports.tagsComponentsData = exports.tagsStyleData = exports.tagsPrimaryData = exports.componentIndexData = exports.appCategoryData = exports.pageTypeData = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const resolveDataFile = (fileName) => {
    const cwd = process.cwd();
    const runtimeRoot = (0, path_1.join)(__dirname, '..', '..', '..', '..');
    const candidates = [];
    const tryPaths = [
        (0, path_1.join)(__dirname, '..', 'data', fileName),
        (0, path_1.join)(__dirname, '..', '..', 'data', fileName),
        (0, path_1.join)(runtimeRoot, 'modules', 'screen', 'data', fileName),
        (0, path_1.join)(runtimeRoot, 'src', 'modules', 'screen', 'data', fileName),
        (0, path_1.join)(cwd, 'dist', 'modules', 'screen', 'data', fileName),
        (0, path_1.join)(cwd, 'src', 'modules', 'screen', 'data', fileName),
    ];
    const packageRoot = (0, path_1.join)(cwd, 'apps', 'backend');
    candidates.push(...tryPaths);
    if ((0, fs_1.existsSync)(packageRoot)) {
        candidates.push((0, path_1.join)(packageRoot, 'dist', 'modules', 'screen', 'data', fileName), (0, path_1.join)(packageRoot, 'src', 'modules', 'screen', 'data', fileName));
    }
    for (const filePath of candidates) {
        if ((0, fs_1.existsSync)(filePath)) {
            return filePath;
        }
    }
    return null;
};
const loadTagJson = (fileName) => {
    const filePath = resolveDataFile(fileName);
    if (!filePath) {
        throw new Error(`无法找到标签配置文件: ${fileName}`);
    }
    const content = (0, fs_1.readFileSync)(filePath, 'utf8');
    return JSON.parse(content);
};
exports.pageTypeData = loadTagJson('page_type.json');
exports.appCategoryData = loadTagJson('app_category.json');
exports.componentIndexData = loadTagJson('component_index.json');
exports.tagsPrimaryData = loadTagJson('tags_primary.json');
exports.tagsStyleData = loadTagJson('tags_style.json');
exports.tagsComponentsData = loadTagJson('tags_components.json');
exports.layoutTypeData = loadTagJson('layout_type.json');
exports.TAXONOMY_DATA = {
    appCategory: exports.appCategoryData,
    componentIndex: exports.componentIndexData,
    layoutType: exports.layoutTypeData,
    pageType: exports.pageTypeData,
    tagsPrimary: exports.tagsPrimaryData,
    tagsStyle: exports.tagsStyleData,
    tagsComponents: exports.tagsComponentsData,
};
const collectChildrenNames = (nodes) => {
    if (!nodes) {
        return [];
    }
    const result = new Set();
    nodes.forEach((node) => {
        const trimmed = node?.name?.trim();
        if (trimmed) {
            result.add(trimmed);
        }
    });
    return Array.from(result);
};
const collectSecondLevelNames = (nodes) => {
    const result = new Set();
    nodes?.forEach((node) => {
        collectChildrenNames(node?.children).forEach((childName) => {
            result.add(childName);
        });
    });
    return Array.from(result);
};
exports.collectSecondLevelNames = collectSecondLevelNames;
const collectFirstLevelNames = (nodes) => {
    const result = new Set();
    nodes?.forEach((node) => {
        const trimmed = node?.name?.trim();
        if (trimmed) {
            result.add(trimmed);
        }
    });
    return Array.from(result);
};
exports.collectFirstLevelNames = collectFirstLevelNames;
const buildSecondLevelLookup = (nodes) => {
    const map = {};
    nodes?.forEach((node) => {
        const parent = node?.name?.trim();
        if (!parent) {
            return;
        }
        const children = collectChildrenNames(node.children);
        if (children.length > 0) {
            map[parent] = children;
        }
    });
    return map;
};
exports.buildSecondLevelLookup = buildSecondLevelLookup;
//# sourceMappingURL=tag-taxonomy.util.js.map