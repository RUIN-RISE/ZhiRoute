# 硅基流动（SiliconFlow）API 配置指南

## 简介

硅基流动提供的高性能推理平台，支持主流大模型，兼容 OpenAI 接口格式。

- **官网**：https://siliconflow.cn
- **控制台**：https://cloud.siliconflow.cn
- **API 文档**：https://docs.siliconflow.cn

---

## 接入配置

### Base URL

```
https://api.siliconflow.cn/v1
```

### 认证方式

HTTP Header:
```
Authorization: Bearer YOUR_API_KEY
```

### 本项目配置位置

`.env` 文件（项目根目录）：
```env
SF_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx   # 填入你的硅基流动 API Key
```

---

## 使用的模型

| 模型 ID | 描述 | 适用场景 |
|---|---|---|
| `Pro/zai-org/GLM-5` | GLM-5 Pro 版本，高质量推理 | JD 生成、简历匹配、邮件生成 |

### 调用示例（OpenAI SDK 兼容）

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.siliconflow.cn/v1",
    api_key="sk-xxxxxxxxxxxxxxxx"
)

response = client.chat.completions.create(
    model="Pro/zai-org/GLM-5",
    messages=[
        {"role": "system", "content": "你是招聘助手"},
        {"role": "user", "content": "招一个 Python 工程师"}
    ]
)
print(response.choices[0].message.content)
```

---

## 价格参考

硅基流动按 token 计费，Pro 模型价格请查阅：
https://siliconflow.cn/zh-cn/pricing

---

## 注意事项

1. API Key 以 `sk-` 开头，从控制台「API密钥」页面创建
2. 免费额度用完后需充值，账单在控制台「费用」页查看
3. 如需切换其他模型，修改 `services/llm.py` 中的 `MODEL_CONFIGS`
