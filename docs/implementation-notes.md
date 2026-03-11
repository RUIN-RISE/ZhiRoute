# AI Talent Radar 实施细节说明 (Implementation Notes)

本说明覆盖 2026-03-11 的核心改动、证据链口径及指标策略。

## 1. 异步与 SLA 保护
- `radar_service.analyze_ai_talent` 采用 `asyncio.wait(..., timeout=6.0)` 保留已完成结果。
- 超时任务先 `cancel` 再 `gather` 清理，避免悬挂协程与资源泄露。
- **认证增强**: `github_analyzer.py` 支持 `GITHUB_TOKEN`，自动在请求头中注入 `Authorization: token <token>`，解决未授权请求的 60次/小时 限流问题（提升至 5000次/小时）。
- 降级路径通过 `errors` 与 `degraded` 返回给前端。

## 2. 面试题生成可靠性
- LLM 调用使用 `asyncio.to_thread` 并加 `asyncio.wait_for(timeout=6.0)`。
- **多模型冗余**: 全面支持 **OpenRouter**, **SiliconFlow (GLM-5)**, **ModelScope** 和 **StepFun 官方**。
- **优先级策略**: 系统首选 OpenRouter 的 `stepfun/step-3.5-flash:free`。紧接其后的是 SiliconFlow 的 `Pro/zai-org/GLM-5`。若两者均不可用，会自动回退至官方 API 或魔搭。
- **认证鲁棒性**: 配置文件已持久化 `GITHUB_TOKEN` 和多个 LLM 密钥，确保生产环境无缝调用。
- 超时或异常时返回 3 条高质量兜底问题。

## 3. 证据链口径 (Evidence Specification)
- **定义**: `original_text` 必须为 API 的原始字段值或纯客观事实描述，严禁包含主观推断（如 "Experienced", "Excellent"）。
- **示例展示**:
    - **GitHub Stars**: `Top public repositories: linux (150000 stars), git (40000 stars)`
    - **GitHub Commits**: `GitHub Commit Activity: 125 total commits`
    - **GitHub PRs**: `Has 45 Pull Requests created.`
    - **GitHub Warning**: `GitHub stats may be incomplete (only first 200 repos scanned for stars due to SLA).`
    - **Hugging Face**: `Hugging Face Model: google/gemma-2b`
    - **ArXiv**: `ArXiv Paper: Attention Is All You Need`

## 4. 指标可靠性与降级策略
- **GitHub Stars**: 仅统计用户前 200 个公开仓库。若超出，在 `errors` 中记录且在 `evidence` 中显示警告。
- **GitHub Commits**: 使用 Search API 搜索。若触发 403/429 限流，分数计 0 并记录错误提示。
- **降级逻辑**: 任何维度失败均不阻塞整体，保持“部分数据可用”语义。

## 5. 最终验收清单 (Checklist)
- [x] **成功路径**: 已通过本地实测，dimensions/evidence 数据填充结构正常。
- [x] **降级路径**: 已通过 `verify_fixes.py` 验证超时与报错捕获。
- [x] **资源回收**: 确认 `pending` 任务在超时后被 `cancel` 且 `gather`。
- [x] **证据口径**: 实施了客观描述规范，杜绝主观表述，与代码输出一致。
- [x] **DB 迁移**: 确认 `PRAGMA` 检查逻辑支持重复执行。
