# 职通车交付说明（CTO 接手版）

## 1. 本次交付范围

本轮工作主要覆盖以下 4 类内容：

1. **AI 人才雷达主链路修复与增强**
   - 修复外部源超时后错误缓存的问题
   - 调整 GitHub / arXiv / 模型社区信号的编排与降级
   - 将模型社区信号从 Hugging Face 切换为 **魔搭（ModelScope）**
   - 补齐人工手测资料

2. **前端中文化与产品化**
   - AI 雷达弹层改成中文深色风格
   - 候选人详情区的“机器结构化字段”改成中文展示
   - Landing / 导入 JD 等核心入口做了可读性与一致性修整

3. **后端安全与稳健性护栏**
   - 增加会话 ID 格式校验
   - 增加上传文件类型 / 大小 / ZIP 成员数 / 解压总量限制
   - CORS 从危险配置改为白名单配置

4. **交付文档**
   - 安全审查报告
   - threat model
   - 项目质量作战手册
   - AI 雷达手测资料包

## 2. 关键修改文件

### 后端

- `main.py`
- `services/radar_service.py`
- `services/github_analyzer.py`
- `services/modelscope_analyzer.py`
- `services/arxiv_analyzer.py`
- `services/radar_db.py`

### 前端

- `temp_frontend/src/App.tsx`
- `temp_frontend/src/components/AITalentRadar.tsx`
- `temp_frontend/src/api.ts`
- `temp_frontend/src/resumePresentation.ts`
- `temp_frontend/src/utils.ts`
- `temp_frontend/vite.config.ts`

### 文档

- `docs/ai-radar-manual-test-pack.md`
- `docs/project-quality-playbook.md`
- `security_best_practices_report.md`
- `职通车-threat-model.md`

## 3. 已验证项

### 构建

- `temp_frontend` 前端构建通过：`npm run build`

### 后端冒烟

- `GET /api/health` 返回正常
- 未命中 API 路由返回真实 `404`
- 非法上传扩展名会被拒绝

### AI 雷达

- GitHub + arXiv 组合可正常返回
- 模型社区字段已切换为 `modelscope_contributions`
- 旧字段 `hf_username` 在后端仍保留兼容映射，不会直接打断旧调用

## 4. 交付评估结论

### 结论：**可以作为“集成候选版本”递交给 CTO，但不建议原样直接并入主线作为最终生产版**

这版不是“屎山”，因为本轮改动本身是**有边界、可验证、可回滚**的：

- 新增逻辑主要集中在 AI 雷达和展示层
- 风险点有明确文档记录
- 基础构建与接口回归已经通过
- 交付材料相对完整

但它仍**不是**“可以无条件直接并入 `main` 然后上线”的状态，原因主要在于**历史遗留编码债和旧逻辑污染仍在主仓里**，不是这轮新增内容的问题。

## 5. 当前不建议直接整分支并主线的原因

### A. 历史编码债仍明显存在

以下文件仍有明显 mojibake / 历史乱码：

- `services/llm.py`
- `services/models.py`

这会带来两个风险：

1. LLM 提示词质量不稳定
2. 某些默认字段/回退文案表现不专业，后续会继续污染体验

### B. AI 雷达的“模型社区信号”仍属于弱信号

魔搭替代是可行的，但有边界：

- 个人主页用户名：可用
- 组织/品牌名：不稳定
- 不应该把它视为强身份源或硬筛选条件

建议 CTO 在整合时将其视为：

- **加分项**
- **补充证据**
- **非硬性过滤指标**

### C. 仓库里仍有较多历史性草稿/验证脚本/说明文件

这些内容对研发排障有价值，但对主线整洁度不友好。
建议 CTO 集成时按“功能代码 / 验证脚本 / 过程文档”分层挑选，不要把所有文件一股脑并入。

## 6. 推荐 CTO 集成策略

### 推荐：**按功能文件有选择地吸收**

优先吸收：

- `main.py`
- `services/radar_service.py`
- `services/github_analyzer.py`
- `services/modelscope_analyzer.py`
- `services/arxiv_analyzer.py`
- `services/radar_db.py`
- `temp_frontend/src/App.tsx`
- `temp_frontend/src/components/AITalentRadar.tsx`
- `temp_frontend/src/api.ts`
- `temp_frontend/src/resumePresentation.ts`
- `temp_frontend/src/utils.ts`
- `temp_frontend/vite.config.ts`

文档可按需吸收：

- `docs/ai-radar-manual-test-pack.md`
- `docs/project-quality-playbook.md`
- `security_best_practices_report.md`
- `职通车-threat-model.md`

建议暂不直接带入主线的内容：

- 纯过程性草稿
- 临时验证脚本
- 本地产物 / 截图 / 数据库缓存

## 7. 如果要达到“可直接并主线”的标准，还建议补这两步

### Step 1：单独做一轮编码清洗

目标文件：

- `services/llm.py`
- `services/models.py`

目标：

- 全量 UTF-8 中文恢复
- 提示词与默认文案统一
- 避免继续出现 `Hard_Skills / Exp_Years` 类中间格式向 UI 外泄

### Step 2：补一轮主流程端到端回归

至少覆盖：

- 登录
- 导入 JD
- 本地上传简历
- 排名
- 打开 AI 雷达
- 生成 AI 面试题
- 私有简历上传 / 拉取

## 8. 建议的合并判定

### 如果 CTO 要“尽快集成”

可以按上面的**推荐文件列表**选择性吸收，本轮内容适合作为候选版本进入集成分支。

### 如果 CTO 要“直接进 main 并作为稳定基线”

**不建议现在直接整仓并入。**

建议先完成：

1. `services/llm.py` / `services/models.py` 编码清理
2. 主流程端到端回归
3. 对文档与验证脚本做一次整理瘦身

## 9. 一句话结论

**这版已经达到“可交给 CTO 集成评审”的水平，但还没达到“可以无顾虑直接合入 main 作为稳定生产主线”的水平。**
