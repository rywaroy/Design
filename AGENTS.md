# Repository Guidelines

## 项目结构与模块组织
- 仓库由 pnpm workspace 管理 `apps/*` 与 `packages/*`；`apps/frontend` 负责 React + Vite 前端，静态资源与样式保存在 `src` 与 `index.css`。
- `apps/backend` 采用 NestJS，`src/common` 存放通用管道、过滤器与拦截器，运行期输出在 `logs`，临时文件在 `uploads`。
- `packages/shared-types/src` 存放跨端 TypeScript 类型，发布前请先确保接口定义同步更新。

## 构建、测试与开发命令
- 安装依赖使用 `pnpm install`，全局开发模式运行 `pnpm dev`。
- 仅启动前端：`pnpm --filter design-frontend dev`；构建：`pnpm --filter design-frontend build`；预览：`pnpm --filter design-frontend preview`。
- 仅启动后端：`pnpm --filter design-backend start:dev`；生产构建运行 `pnpm --filter design-backend build && pnpm --filter design-backend start:prod`。
- 更新共享类型请执行 `pnpm --filter @design/shared-types build` 以刷新编译产物。

## 编码风格与命名约定
- 全仓库使用 TypeScript，统一两空格缩进；React 组件、Nest 模块文件以 PascalCase 命名，实例与变量使用 camelCase。
- 后端启用 ESLint + Prettier，可运行 `pnpm --filter design-backend lint`、`pnpm --filter design-backend format`；前端遵循 Vite 默认格式，建议在保存时触发自动格式化。
- API、DTO 与共享类型从 `packages/shared-types` 统一导出，命名以业务域作为前缀，例如 `UserProfileDto`。

## 测试规范
- 前端使用 Vitest，命名 `*.test.tsx` 或 `*.test.ts`，命令：`pnpm --filter design-frontend test`；持续集成使用 `pnpm --filter design-frontend test:run`。
- 后端使用 Jest，单测文件命名 `*.spec.ts`，覆盖率命令 `pnpm --filter design-backend test:cov`；端到端测试使用 `pnpm --filter design-backend test:e2e`。
- 在提交前至少运行受影响模块的单测，并确认生成的覆盖率保持在团队基线（当前建议 80% 以上，如有调整请在 PR 中说明）。

## 提交与拉取请求
- Git 历史遵循 Conventional Commits（如 `feat:`, `fix:`, `chore:`）；消息首行控制在 72 字符以内，正文补充动机与影响。
- 提交前请确保工作区干净、锁文件未被误改；涉及数据库或配置更新时附带 `CONFIG_MIGRATION.md` 的修改说明。
- 创建 PR 时附上变更摘要、相关 issue 链接、截图或 API 响应示例，并列出已执行的验证命令清单。
