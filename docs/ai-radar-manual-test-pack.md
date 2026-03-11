# AI 人才雷达手测资料包

## 当前状态

- **能用**：接口和前端入口都可正常打开，AI 雷达弹层可用。
- **已修复**：
  - 不再把降级结果缓存 7 天
  - 模型社区信号已从 Hugging Face 切换为魔搭
  - 前端不再用候选人姓名乱猜 GitHub / 魔搭 / arXiv 账号
  - 结果会带 `degraded` / `errors`，便于定位外部源异常
- **仍有波动**：
  - GitHub / 魔搭 / arXiv 属于外部实时依赖，可能受限流或临时超时影响
  - 所以“能不能用”的答案是：**能用，但需要接受外部源偶发降级**

## 建议手测入口

- 前端页面：`http://127.0.0.1:7860`
- 健康检查：`http://127.0.0.1:7860/api/health`

## 推荐测试样例

### 样例 A：全链路公开资料较丰富

- `github_username`: `torvalds`
- `modelscope_username`: `YuyaoGe`
- `arxiv_name`: `Yoshua Bengio`
- 目标：
  - 验证多源聚合
  - 验证 evidence 列表
  - 验证 `degraded=false` 的理想路径
- 参考来源：
  - GitHub: `https://github.com/torvalds?tab=repositories`
  - 魔搭: `https://modelscope.cn/profile/YuyaoGe`
  - arXiv 作者检索：`https://export.arxiv.org/api/query?search_query=au:%22Yoshua%20Bengio%22&max_results=3&sortBy=submittedDate&sortOrder=descending`

### 样例 B：只测魔搭

- `github_username`: 留空
- `modelscope_username`: `YuyaoGe`
- `arxiv_name`: 留空
- 目标：
  - 验证魔搭单源不会报错
  - 验证个人主页类账号可正常返回 0 分或有效分数

### 样例 C：只测 arXiv

- `github_username`: 留空
- `modelscope_username`: 留空
- `arxiv_name`: `Yoshua Bengio`
- 目标：
  - 验证 arXiv 单源可返回论文类 evidence

### 样例 D：降级路径

- `github_username`: `this-user-should-not-exist-12345`
- `modelscope_username`: `this-user-should-not-exist-12345`
- `arxiv_name`: `Definitely Not A Real Author Name`
- 目标：
  - 验证系统在空结果或异常结果时不会崩
  - 验证 `errors` / `degraded` 行为

## 页面手测建议

1. 打开首页
2. 完成登录或直接进入可用流程
3. 进入候选人列表
4. 点击 `AI人才雷达`
5. 手动填入上面的公开标识
6. 点击 `Analyze Public Profile`
7. 检查：
   - 是否出现总分
   - 是否出现 evidence
   - 是否出现 `Partial data only` 提示
   - 是否能生成 AI 面试题

## 接口手测示例

### 雷达分析

```bash
curl -X POST "http://127.0.0.1:7860/api/analyze/ai-radar" ^
  -H "Content-Type: application/json" ^
  -H "X-Session-ID: manual-test-session-001" ^
  -d "{\"resume_id\":\"manual-a\",\"github_username\":\"YuyaoGe\",\"modelscope_username\":\"YuyaoGe\",\"arxiv_name\":\"Yoshua Bengio\"}"
```

### 生成雷达面试题

先拿到上一接口返回的 `dimensions/evidence`，再调用：

```bash
curl -X POST "http://127.0.0.1:7860/api/analyze/ai-radar-questions" ^
  -H "Content-Type: application/json" ^
  -H "X-Session-ID: manual-test-session-001" ^
  -d "{\"resume_id\":\"manual-a\",\"radar_data\":{\"total_score\":47,\"dimensions\":{\"github_stars\":20,\"github_prs\":5,\"modelscope_contributions\":0,\"arxiv_papers\":15},\"evidence\":[]}}"
```

## 我本地观察到的现象

- 组合样例在理想情况下可以返回正常总分和证据链。
- 当 GitHub 限流时，系统会走降级返回，不再把错误结果永久缓存。
- UI 已经能正常打开首页和“导入外部 JD”弹层，适合你直接人工回归。
