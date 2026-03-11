# 职通车安全最佳实践审查报告

## Executive Summary

本轮审查结合已安装的官方技能思路完成，重点参考了 `security-best-practices` 与 `security-threat-model` 的工作流。项目当前已经修复了几项阻塞性交付问题：前端可正常构建、AI 人才雷达不再错误缓存降级结果、Hugging Face 数据解析已对齐真实接口、CORS 不再是 `* + credentials` 的危险组合、SPA API 兜底 404 已修正。

当前仍建议在正式公网发布前继续处理以下高优先级问题：

1. 会话模型仍然过于信任前端传入的 `X-Session-ID`。
2. 若未显式配置环境变量，云端鉴权与私有简历同步默认仍会走硬编码云地址。
3. 高成本接口仍缺少速率限制与更细粒度的滥用防护。
4. 外部文件拉取与解析链路仍应增加更明确的大小、类型和解压保护。

## 已修复项

- `main.py:64` 将 CORS 改为明确白名单和域名正则，不再允许任意来源携带凭证。
- `main.py:703` 将 API 漏兜底改为真实 `404` JSON 响应。
- `services/huggingface_analyzer.py:22` 改为解析 Hugging Face `overview` 的真实计数字段。
- `services/radar_service.py:12` 与 `services/radar_service.py:127` 将 AI 雷达改为按来源独立超时，并跳过降级结果缓存。
- `services/radar_db.py:54` 旧的降级缓存命中时会被主动跳过，避免错误结果冻结。
- `temp_frontend/src/components/AITalentRadar.tsx:28` 不再用候选人姓名冒充 GitHub / Hugging Face / arXiv 标识。

## Findings

### 1. High - 客户端可控会话标识仍可直接驱动后端状态

- **Location**: `main.py:100`
- **Evidence**: `get_current_user` 直接信任 `X-Session-ID`，不存在签名、过期校验或服务端生成/校验的会话票据；当 session 不存在时还会自动创建 guest 会话。
- **Impact**: 任何能构造请求头的调用方都可以伪造或固定会话标识，造成会话固定、会话碰撞、状态污染，进一步影响云端数据绑定与私有资源操作。
- **Fix**: 改为服务端签发会话令牌，至少加入签名、过期时间、服务端存储校验与登出失效机制；guest 会话也应由服务端生成，而不是接受任意外部值。
- **Mitigation**: 在短期内至少增加 session TTL、随机长度校验、账户绑定校验与关键操作二次校验。

### 2. High - 云端服务默认地址硬编码且多处仍是 HTTP

- **Location**: `main.py:44`, `main.py:141`, `main.py:429`, `main.py:498`, `main.py:519`, `main.py:540`, `main.py:584`, `main.py:607`
- **Evidence**: 多处回退到 `http://163.7.10.125:8080`；登录还依赖额外 `Host` 头修正。
- **Impact**: 若生产环境漏配变量，鉴权、历史记录、私有简历等流量可能以明文 HTTP 走公网，带来敏感数据泄露与中间人攻击风险。
- **Fix**: 将云端地址收敛到单一配置入口；生产默认只允许 HTTPS 域名；若必须 IP 直连，需明确说明网络前提并加上传输层保护。
- **Mitigation**: 启动时检测非 HTTPS 默认值并显式告警，阻止生产模式启动。

### 3. Medium - 高成本接口缺少速率限制

- **Location**: `main.py:239`, `main.py:307`, `main.py:423`, `main.py:654`, `main.py:668`
- **Evidence**: 聊天、简历上传、云端拉取、AI 雷达分析、雷达面试题生成等接口均未见限流或配额控制。
- **Impact**: 容易被滥用造成模型费用放大、外部 API 限流、CPU/内存占用升高和可用性下降。
- **Fix**: 以 session/account/IP 为维度增加令牌桶或滑动窗口限流，并区分上传、LLM、外部抓取三类配额。
- **Mitigation**: 至少为 AI 雷达与题目生成增加低成本的本地限频与日志告警。

### 4. Medium - 远程文件拉取与本地解析需要更严格的输入护栏

- **Location**: `main.py:423`, `main.py:631`, `main.py:307`
- **Evidence**: 公共/私有简历会被拉回本地后直接进入 `process_resume_content` 解析链路；代码中未见统一的内容长度、ZIP 炸弹、文件数量和 MIME 白名单策略。
- **Impact**: 攻击者可构造超大文件、异常压缩包或解析边界样本，导致资源耗尽或解析异常。
- **Fix**: 在进入解析前统一校验 `Content-Length`、文件扩展名、MIME、ZIP 文件数量、单文件大小和总解压大小。
- **Mitigation**: 为 ZIP/PDF 解析增加超时、熔断与安全日志。

## Recommended Next Actions

1. 先重构会话与鉴权模型，替换前端自带 `X-Session-ID` 的信任链。
2. 收敛云端配置读取逻辑，并在生产模式强制 HTTPS。
3. 给 AI 与上传链路补最小可用限流。
4. 给远程文件解析补大小与压缩保护，再做一轮安全回归。
