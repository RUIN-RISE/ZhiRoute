# AI Talent Radar 测试验证报告 (Test Report)

本报告基于 2026-03-11 的本地运行记录。

## 1. 测试环境
- 测试脚本: `verify_fixes.py` (使用 `uuid` 绕开缓存)
- 网络条件: GitHub/HuggingFace/多模型服务连接失败（All connection attempts failed / Connection error）

## 2. 成功路径验证 (Success Path)
- 本次环境未覆盖成功路径（外网/模型服务不可用）。
- 待补充: 在可用网络与 API Key 环境下重新运行 `verify_fixes.py`，记录完整成功路径日志。

## 3. 降级路径验证 (Degraded Path)
### 3.1 外部 API 失败 (GitHub/HF)
- 结果摘要:
```text
Cache miss for test_resume_b37c1161. Fetching fresh data...
GitHub User API failed for torvalds: All connection attempts failed
HF Analyzer Error for osanseviero: All connection attempts failed
Total Score: 0
Dimensions: {'github_stars': 0, 'github_commits': 0, 'github_prs': 0, 'hf_contributions': 0, 'arxiv_papers': 0}
Errors: ['GitHub Profile: All connection attempts failed', 'HuggingFace: All connection attempts failed']
Degraded: True
PASS: System correctly identified degradation.
```
- 验证点: 未抛 500，返回结构化结果并标记 `degraded`。

## 4. 异步面试题生成验证
- 结果摘要:
```text
[LLM] Using Step-3.5-Flash (OpenRouter) (timeout=6.0s)...
[LLM] Step-3.5-Flash (OpenRouter) Error: Connection error.
[LLM] Switching to next model...
[LLM] Using GLM-5 (SiliconFlow) (timeout=6.0s)...
LLM Timeout generating questions for test_resume
Generated Questions: ['Could you explain your recent AI open-source contributions?', 'What was the most challenging part of your published research?', 'How do you evaluate and optimize the performance of the AI models you work with?']
PASS: Questions generated successfully (Async).
```
- 验证点: LLM 不可达时走超时兜底，接口仍返回有效问题列表。

## 5. 数据库模式一致性
- 命令: `init_db()`
- 结果: `Database initialized and robustly migrated.`
- 验证点: `ai_radar_cache_v2` 包含 `errors_json` 与 `degraded` 字段，二次初始化无异常。
