"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.industrySectorData = exports.applicationTypeData = exports.buildSecondLevelLookup = exports.collectFirstLevelNames = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const resolveDataFile = (fileName) => {
    const cwd = process.cwd();
    const candidates = [];
    const tryPaths = [
        (0, path_1.join)(__dirname, '..', 'data', fileName),
        (0, path_1.join)(__dirname, '..', '..', 'data', fileName),
        (0, path_1.join)(cwd, 'dist', 'modules', 'project', 'data', fileName),
        (0, path_1.join)(cwd, 'src', 'modules', 'project', 'data', fileName),
    ];
    const packageRoot = (0, path_1.join)(cwd, 'apps', 'backend');
    candidates.push(...tryPaths);
    if ((0, fs_1.existsSync)(packageRoot)) {
        candidates.push((0, path_1.join)(packageRoot, 'dist', 'modules', 'project', 'data', fileName), (0, path_1.join)(packageRoot, 'src', 'modules', 'project', 'data', fileName));
    }
    for (const filePath of candidates) {
        if ((0, fs_1.existsSync)(filePath)) {
            return filePath;
        }
    }
    return null;
};
const loadTaxonomyJson = (fileName) => {
    const filePath = resolveDataFile(fileName);
    if (!filePath) {
        throw new Error(`无法找到分类配置文件: ${fileName}`);
    }
    const content = (0, fs_1.readFileSync)(filePath, 'utf8');
    return JSON.parse(content);
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
exports.applicationTypeData = loadTaxonomyJson('application_type.json');
exports.industrySectorData = loadTaxonomyJson('industry_sector.json');
//# sourceMappingURL=project-taxonomy.util.js.map