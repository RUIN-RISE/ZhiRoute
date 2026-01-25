# 职通车 JOB OS (Next-Gen) v2.0

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/React-19.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)

**JOB OS** 是一个基于 AI 的下一代招聘流程操作系统，旨在将非结构化的招聘需求转化为高精度的结构化匹配逻辑。

v2.0 版本带来了全新的 **"赛博专业 (Cyber-Professional)"** 视觉语言，结合了玻璃拟态、霓虹流光与高保真交互，为专业招聘人员提供沉浸式的工作台体验。

## 🌟 核心特性 (v2.0 Aesthetic Upgrade)

- **🚀 沉浸式启动引擎**: 动态粒子背景与全息指令输入，支持自然语言初始化岗位。
- **🎛️ 智能规格配置器**: 仪表盘级的高密度信息录入，实时 JSON 向量化预览。
- **🧠 深度推理仪表盘**:
    - 高保真候选人卡片
    - 可视化 AI 证据链 (Evidence Trace)
    - 沉浸式面试流程管理 (Email & Context)
- **🎨 极致工程美学**: 全局深色模式，不仅好看，更经得起高负载渲染考验。

## 🛠️ 技术栈

- **Core**: React 18+, TypeScript, Vite
- **Styling**: TailwindCSS (Custom Neon Tokens), Vanilla CSS Animations
- **Icons**: Lucide React

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
