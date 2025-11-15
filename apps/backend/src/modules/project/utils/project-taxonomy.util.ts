import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface TaxonomyNode {
  name: string;
  children?: TaxonomyNode[];
}

const resolveDataFile = (fileName: string): string | null => {
  const cwd = process.cwd();
  const runtimeRoot = join(__dirname, '..', '..', '..', '..');
  const candidates: string[] = [];
  const tryPaths = [
    join(__dirname, '..', 'data', fileName),
    join(__dirname, '..', '..', 'data', fileName),
    join(runtimeRoot, 'modules', 'project', 'data', fileName),
    join(runtimeRoot, 'src', 'modules', 'project', 'data', fileName),
    join(cwd, 'dist', 'modules', 'project', 'data', fileName),
    join(cwd, 'src', 'modules', 'project', 'data', fileName),
  ];

  const packageRoot = join(cwd, 'apps', 'backend');
  candidates.push(...tryPaths);
  if (existsSync(packageRoot)) {
    candidates.push(
      join(packageRoot, 'dist', 'modules', 'project', 'data', fileName),
      join(packageRoot, 'src', 'modules', 'project', 'data', fileName),
    );
  }

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};

const loadTaxonomyJson = (fileName: string): TaxonomyNode[] => {
  const filePath = resolveDataFile(fileName);
  if (!filePath) {
    throw new Error(`无法找到分类配置文件: ${fileName}`);
  }
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content) as TaxonomyNode[];
};

const collectChildrenNames = (nodes?: TaxonomyNode[]): string[] => {
  if (!nodes) {
    return [];
  }
  const result = new Set<string>();
  nodes.forEach((node) => {
    const trimmed = node?.name?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  });
  return Array.from(result);
};

export const collectFirstLevelNames = (nodes: TaxonomyNode[]): string[] => {
  const result = new Set<string>();
  nodes?.forEach((node) => {
    const trimmed = node?.name?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  });
  return Array.from(result);
};

export const buildSecondLevelLookup = (
  nodes: TaxonomyNode[],
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
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

export const applicationTypeData = loadTaxonomyJson('application_type.json');
export const industrySectorData = loadTaxonomyJson('industry_sector.json');
