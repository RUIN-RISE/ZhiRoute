#!/usr/bin/env python3
"""
Generate benchmark resumes for agent evaluation.

Features:
- Multiple target roles, each with configurable sample count.
- Tries to fetch real-world keywords from public job pages first.
- Generates normal resumes and abnormal resumes in separate folders.
- Exports both TXT and PDF (PDF via `npx playwright pdf`).
"""

from __future__ import annotations

import argparse
import html
import json
import random
import re
import shutil
import subprocess
import time
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen


CURRENT_YEAR = date.today().year

ROLE_CONFIGS: Dict[str, Dict[str, object]] = {
    "backend_java_go": {
        "role_name": "Java/Go后端开发工程师",
        "job_titles": [
            "Java后端开发工程师",
            "Go后端开发工程师",
            "后端开发工程师",
            "高级后端开发工程师",
        ],
        "skills_must": [
            "Java",
            "Go",
            "Spring Boot",
            "Gin",
            "MySQL",
            "Redis",
            "Kafka",
            "Docker",
            "K8s",
            "Git",
            "Linux",
        ],
        "skills_nice": [
            "Elasticsearch",
            "gRPC",
            "消息队列",
            "高并发",
            "微服务",
            "分布式事务",
            "Prometheus",
            "CI/CD",
        ],
        "soft_skills": ["跨团队协作", "问题定位", "压测与优化", "技术方案评审", "业务理解"],
        "major_pool": ["计算机科学与技术", "软件工程", "信息与计算科学", "网络工程"],
        "company_pool": [
            "小米科技",
            "腾讯云",
            "字节跳动-电商研发部",
            "阿里云智能事业群",
            "京东科技",
            "美团",
            "滴滴出行",
            "快手",
            "携程技术中心",
            "哔哩哔哩",
        ],
    },
    "frontend_vue": {
        "role_name": "Vue前端开发工程师",
        "job_titles": [
            "Vue前端开发工程师",
            "前端开发工程师",
            "高级前端开发工程师",
            "Web前端开发工程师",
        ],
        "skills_must": [
            "Vue2",
            "Vue3",
            "TypeScript",
            "JavaScript",
            "HTML5",
            "CSS3",
            "Vite",
            "Webpack",
            "Pinia",
            "Element Plus",
            "Git",
        ],
        "skills_nice": [
            "React",
            "SSR",
            "前端性能优化",
            "ECharts",
            "微前端",
            "Node.js",
            "Jest",
            "Cypress",
        ],
        "soft_skills": ["沟通协作", "需求拆解", "组件抽象能力", "自驱学习", "用户体验意识"],
        "major_pool": ["计算机科学与技术", "软件工程", "数字媒体技术", "信息工程"],
        "company_pool": [
            "京东零售",
            "小红书",
            "得物",
            "美团",
            "字节跳动-商业化",
            "网易",
            "腾讯广告",
            "携程",
            "蚂蚁集团",
            "快手",
        ],
    },
    "new_media_ops": {
        "role_name": "新媒体运营/短视频运营",
        "job_titles": [
            "新媒体运营",
            "短视频运营",
            "内容运营",
            "新媒体高级运营",
        ],
        "skills_must": [
            "内容策划",
            "短视频运营",
            "抖音运营",
            "小红书运营",
            "数据分析",
            "选题策划",
            "后期剪辑",
            "用户增长",
            "活动策划",
        ],
        "skills_nice": [
            "账号矩阵",
            "直播运营",
            "A/B测试",
            "脚本撰写",
            "投流优化",
            "KOL合作",
            "热点追踪",
            "社群运营",
        ],
        "soft_skills": ["网感敏锐", "执行力", "复盘能力", "跨部门协同", "抗压能力"],
        "major_pool": ["新闻传播学", "市场营销", "广告学", "汉语言文学", "电子商务"],
        "company_pool": [
            "抖音电商",
            "小红书",
            "快手本地生活",
            "哔哩哔哩",
            "微博",
            "知乎",
            "网易传媒",
            "得物内容中心",
            "美团到店事业群",
            "腾讯视频号团队",
        ],
    },
    "ecommerce_ops": {
        "role_name": "电商运营",
        "job_titles": [
            "电商运营",
            "资深电商运营",
            "店铺运营",
            "平台运营",
        ],
        "skills_must": [
            "天猫运营",
            "京东运营",
            "拼多多运营",
            "活动策划",
            "数据复盘",
            "商品运营",
            "流量投放",
            "转化率优化",
            "ROI",
        ],
        "skills_nice": [
            "直通车",
            "淘宝客",
            "达人合作",
            "店铺诊断",
            "爆款打造",
            "供应链协同",
            "客服协同",
            "库存周转优化",
        ],
        "soft_skills": ["目标导向", "数据敏感", "资源整合", "项目推进", "沟通表达"],
        "major_pool": ["电子商务", "市场营销", "国际经济与贸易", "工商管理", "统计学"],
        "company_pool": [
            "京东零售",
            "天猫事业部",
            "拼多多",
            "唯品会",
            "苏宁易购",
            "抖音电商",
            "快手电商",
            "小红书电商",
            "得物",
            "国美在线",
        ],
    },
    "llm_nlp_algo": {
        "role_name": "大模型/NLP算法工程师",
        "job_titles": [
            "大模型算法工程师",
            "NLP算法工程师",
            "AIGC算法工程师",
            "算法工程师",
        ],
        "skills_must": [
            "Python",
            "PyTorch",
            "Transformer",
            "NLP",
            "LLM",
            "模型训练",
            "模型评估",
            "数据清洗",
            "Linux",
            "Git",
        ],
        "skills_nice": [
            "LoRA",
            "SFT",
            "RLHF",
            "RAG",
            "向量数据库",
            "Prompt Engineering",
            "分布式训练",
            "CUDA",
        ],
        "soft_skills": ["实验设计", "论文复现", "沟通协作", "问题定位", "结果导向"],
        "major_pool": ["计算机科学与技术", "人工智能", "软件工程", "数学与应用数学", "统计学"],
        "company_pool": [
            "百度",
            "腾讯AI Lab",
            "字节跳动",
            "阿里达摩院",
            "华为诺亚方舟实验室",
            "京东科技",
            "商汤科技",
            "旷视科技",
            "科大讯飞",
            "小米AI团队",
        ],
    },
    "fullstack_intern": {
        "role_name": "全栈工程师/实习生",
        "job_titles": [
            "全栈开发工程师",
            "全栈工程师（实习）",
            "Web全栈工程师",
            "软件开发实习生",
        ],
        "skills_must": [
            "JavaScript",
            "TypeScript",
            "Vue3",
            "Node.js",
            "Python",
            "MySQL",
            "Redis",
            "Git",
            "Linux",
        ],
        "skills_nice": [
            "React",
            "Java",
            "Spring Boot",
            "Docker",
            "API设计",
            "前端工程化",
            "测试用例",
            "云部署",
        ],
        "soft_skills": ["快速学习", "团队协作", "文档编写", "需求理解", "主动沟通"],
        "major_pool": ["计算机科学与技术", "软件工程", "信息工程", "网络工程", "人工智能"],
        "company_pool": [
            "美团",
            "字节跳动",
            "腾讯",
            "阿里云",
            "网易",
            "小米",
            "快手",
            "哔哩哔哩",
            "京东",
            "滴滴出行",
        ],
    },
    "ai_product_manager": {
        "role_name": "AI产品经理",
        "job_titles": [
            "AI产品经理",
            "AI平台产品经理",
            "AI数据产品经理",
            "产品经理（AI方向）",
        ],
        "skills_must": [
            "产品规划",
            "需求分析",
            "PRD",
            "原型设计",
            "用户研究",
            "竞品分析",
            "项目推进",
            "数据分析",
            "AI产品",
        ],
        "skills_nice": [
            "NLP",
            "推荐系统",
            "Prompt Engineering",
            "Agent",
            "工作流编排",
            "SQL",
            "指标体系",
            "AB测试",
        ],
        "soft_skills": ["沟通协调", "结构化思维", "业务理解", "结果导向", "跨团队协同"],
        "major_pool": ["管理科学与工程", "计算机科学与技术", "工业工程", "信息管理与信息系统", "市场营销"],
        "company_pool": [
            "百度",
            "腾讯云智能",
            "阿里云",
            "字节跳动",
            "美团",
            "京东科技",
            "小红书",
            "科大讯飞",
            "商汤科技",
            "华为云",
        ],
    },
    "uiux_designer": {
        "role_name": "UI/UX交互设计师",
        "job_titles": [
            "UI设计师",
            "UX交互设计师",
            "产品交互设计师",
            "UI/UX设计师",
        ],
        "skills_must": [
            "Figma",
            "Sketch",
            "Axure",
            "交互设计",
            "信息架构",
            "可用性测试",
            "原型设计",
            "视觉设计",
            "设计规范",
        ],
        "skills_nice": [
            "Design System",
            "动效设计",
            "用户访谈",
            "数据驱动设计",
            "前端基础",
            "插画",
            "3D",
            "A/B测试",
        ],
        "soft_skills": ["审美能力", "同理心", "沟通表达", "需求拆解", "跨团队协作"],
        "major_pool": ["视觉传达设计", "数字媒体艺术", "工业设计", "交互设计", "产品设计"],
        "company_pool": [
            "腾讯",
            "网易游戏",
            "字节跳动",
            "小红书",
            "哔哩哔哩",
            "美团",
            "京东",
            "携程",
            "完美世界",
            "OPPO",
        ],
    },
    "growth_intern": {
        "role_name": "用户增长实习生",
        "job_titles": [
            "用户增长实习生",
            "增长运营实习生",
            "用户运营实习生",
            "增长运营专员（实习）",
        ],
        "skills_must": [
            "用户增长",
            "活动运营",
            "数据分析",
            "社群运营",
            "裂变玩法",
            "文案策划",
            "渠道投放",
            "AB测试",
        ],
        "skills_nice": [
            "SQL",
            "Excel",
            "留存分析",
            "转化漏斗",
            "公众号运营",
            "视频号运营",
            "小红书运营",
            "私域运营",
        ],
        "soft_skills": ["执行力", "主动复盘", "沟通协调", "数据敏感", "目标导向"],
        "major_pool": ["市场营销", "电子商务", "新闻传播学", "统计学", "工商管理"],
        "company_pool": [
            "网易有道",
            "字节跳动",
            "小红书",
            "美团",
            "得物",
            "哔哩哔哩",
            "腾讯广告",
            "滴滴出行",
            "猿辅导",
            "作业帮",
        ],
    },
    "private_community_parttime": {
        "role_name": "兼职私域社群运营",
        "job_titles": [
            "兼职私域社群运营",
            "私域社群运营",
            "社群运营兼职",
            "私域运营专员（兼职）",
        ],
        "skills_must": [
            "私域运营",
            "社群运营",
            "用户维护",
            "内容发布",
            "活动执行",
            "话术优化",
            "转化跟进",
            "微信生态",
        ],
        "skills_nice": [
            "企微运营",
            "朋友圈运营",
            "裂变拉新",
            "客服协同",
            "SOP搭建",
            "表格统计",
            "短视频分发",
            "私域转化",
        ],
        "soft_skills": ["责任心", "沟通能力", "时间管理", "执行力", "服务意识"],
        "major_pool": ["电子商务", "市场营销", "工商管理", "新闻传播学", "不限专业"],
        "company_pool": [
            "知乎盐选",
            "得物",
            "小红书电商",
            "抖音电商",
            "快手电商",
            "丁香医生",
            "新东方在线",
            "猿辅导",
            "Keep",
            "美团到家",
        ],
    },
    "llm_data_engineer": {
        "role_name": "大模型训练数据工程师",
        "job_titles": [
            "大模型训练数据工程师",
            "数据工程师（大模型）",
            "AI训练数据工程师",
            "数据标注工程师",
        ],
        "skills_must": [
            "数据清洗",
            "数据标注",
            "标注质检",
            "Python",
            "SQL",
            "数据管道",
            "Prompt标注",
            "语料构建",
            "评测集构建",
            "Linux",
        ],
        "skills_nice": [
            "弱监督",
            "去重策略",
            "数据脱敏",
            "多模态标注",
            "标注平台",
            "Hive",
            "Spark",
            "Airflow",
        ],
        "soft_skills": ["细节敏感", "规范意识", "跨团队协作", "质量意识", "执行力"],
        "major_pool": ["计算机科学与技术", "软件工程", "统计学", "信息管理与信息系统", "数据科学与大数据技术"],
        "company_pool": [
            "百度",
            "阿里云",
            "字节跳动",
            "腾讯",
            "华为",
            "科大讯飞",
            "商汤科技",
            "旷视科技",
            "京东科技",
            "小米",
        ],
    },
}


ONLINE_SOURCE_URLS: Dict[str, List[str]] = {
    "backend_java_go": [
        "https://activity.zhipin.com/job_detail/68446e768f3365ca03R92dy7E1NR.html",
        "https://www.job5156.com/beijing/job_278430531",
    ],
    "frontend_vue": [
        "https://activity.zhipin.com/job_detail/5d04dbfd5f8f168803V7392-EVBT.html",
        "https://campus.niuqizp.com/job-vss5LtZZt.html",
    ],
    "new_media_ops": [
        "https://activity.zhipin.com/job_detail/0be1a91378d045bb1HB42dy_EFVQ.html",
        "https://www.zhipin.com/baike/b130111/17a8b78b8dc0e5b533d53t--EFI~.html",
        "https://www.zhipin.com/baike/b130111/7b284242fb4930da0nZy3d68Flo~.html",
    ],
    "ecommerce_ops": [
        "https://www.zhipin.com/baike/b130117/7e98673dfdaf8a2d1nR_0tS-FFRQ.html",
        "https://www.zhipin.com/baike/b130117/496e2f0738fe3d460XF_3ty1EFQ~.html",
    ],
    "llm_nlp_algo": [
        "https://www.zhipin.com/baike/b130105/2f1370ceefd84d0e1nN_2d2-E1RX.html",
        "https://www.zhipin.com/baike/b130105/5f853c952ce7d13b1nR-3du0EFM~.html",
        "https://www.zhipin.com/baike/b130105/ac6e564a7a6b001d03By09W6EFQ~.html",
    ],
    "fullstack_intern": [
        "https://www.zhipin.com/baike/b130102/a0b343f8324a07a71Xd629q_ElQ~.html",
        "https://www.zhipin.com/baike/b130102/69db21d65f6dc7d403Z53dW8EFM~.html",
        "https://www.zhipin.com/baike/b100123/6352aa549982f2b733x839y6ElQ~.html",
    ],
    "ai_product_manager": [
        "https://www.zhipin.com/baike/b130104/47cbe8af7d13ef350nRy3du8ElQ~.html",
        "https://www.zhipin.com/baike/b130104/e2f0cda0b35d289f1XN_2N--EFI~.html",
        "https://www.zhipin.com/baike/b130104/7f3d6b8a2efb53511HJ6292_GFFY.html",
    ],
    "uiux_designer": [
        "https://www.zhipin.com/baike/b130122/6dc035f07e50530f1nB-29u9EVs~.html",
        "https://www.zhipin.com/baike/b130122/451df736866b01091nN53dy9FVo~.html",
    ],
    "growth_intern": [
        "https://www.zhipin.com/baike/b130111/018f2c60e4e1e70f03d73Nm5EVRX.html",
        "https://www.zhipin.com/baike/b130111/533ad4bf2adf06f803By3du-FFJV.html",
        "https://www.zhipin.com/baike/b130111/e4d62fdf728f6e8403d53tu8ElFW.html",
    ],
    "private_community_parttime": [
        "https://www.zhipin.com/baike/b130111/0c5085bacaf95e0f03R53tu0E1A~.html",
        "https://www.zhipin.com/baike/b130111/2a8758cecf8cd72603B53dW8FlY~.html",
    ],
    "llm_data_engineer": [
        "https://www.zhipin.com/baike/b130101/e799a14f15e1a0fa1HB82N61EFQ~.html",
        "https://www.zhipin.com/baike/b130101/b4f938d7c71a095f03R63Ny5ElI~.html",
        "https://www.zhipin.com/baike/b130101/fd5b2178ca5de55e03R53Nm5EFQ~.html",
        "https://www.zhipin.com/baike/b130120/9751c2c6d45517201XN92d21FFI~.html",
    ],
}


ONLINE_HINT_TERMS: Dict[str, List[str]] = {
    "backend_java_go": [
        "Golang",
        "Java",
        "系统架构设计",
        "中大型项目开发经验",
        "高并发",
        "电商服务稳定性",
        "需求沟通",
        "技术方案设计",
        "大促",
        "秒杀",
    ],
    "frontend_vue": [
        "Vue",
        "TypeScript",
        "JavaScript",
        "HTML",
        "CSS",
        "前端工程化",
        "Webpack",
        "Vite",
        "组件封装",
        "性能优化",
    ],
    "new_media_ops": [
        "短视频运营",
        "内容策划",
        "抖音",
        "小红书",
        "数据分析",
        "用户增长",
        "活动策划",
        "视频剪辑",
        "平台算法",
        "竞品分析",
    ],
    "ecommerce_ops": [
        "天猫",
        "京东",
        "拼多多",
        "店铺运营",
        "活动报名",
        "直通车",
        "淘宝客",
        "流量与订单数据",
        "销售转化",
        "营销活动复盘",
    ],
    "llm_nlp_algo": [
        "大模型",
        "NLP",
        "LLM",
        "Transformer",
        "模型训练",
        "模型评估",
        "提示词",
        "RAG",
        "SFT",
        "推理优化",
    ],
    "fullstack_intern": [
        "全栈开发",
        "全栈工程师",
        "实习生",
        "Vue",
        "Node.js",
        "JavaScript",
        "API开发",
        "前后端联调",
        "数据库设计",
        "工程化",
    ],
    "ai_product_manager": [
        "AI产品经理",
        "需求分析",
        "PRD",
        "原型设计",
        "用户研究",
        "数据驱动",
        "模型能力",
        "业务闭环",
        "产品指标",
        "跨团队协作",
    ],
    "uiux_designer": [
        "UI设计",
        "UX设计",
        "交互设计",
        "Figma",
        "用户体验",
        "信息架构",
        "可用性测试",
        "设计系统",
        "原型",
        "视觉规范",
    ],
    "growth_intern": [
        "用户增长",
        "增长运营",
        "实习生",
        "拉新",
        "留存",
        "转化",
        "活动运营",
        "A/B测试",
        "数据分析",
        "漏斗分析",
    ],
    "private_community_parttime": [
        "私域",
        "社群运营",
        "兼职",
        "用户维护",
        "企微",
        "裂变",
        "活动执行",
        "转化跟进",
        "社群活跃",
        "复购",
    ],
    "llm_data_engineer": [
        "训练数据",
        "数据标注",
        "标注质检",
        "语料清洗",
        "数据工程",
        "评测集",
        "Prompt标注",
        "数据脱敏",
        "多模态",
        "一致性",
    ],
}


UNIVERSITIES = [
    "浙江大学",
    "上海交通大学",
    "华中科技大学",
    "武汉大学",
    "北京邮电大学",
    "电子科技大学",
    "北京理工大学",
    "同济大学",
    "中南大学",
    "华南理工大学",
    "南京大学",
    "西安电子科技大学",
    "北京交通大学",
    "厦门大学",
]


SURNAMES = list("赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦许何吕施张孔曹严华金魏陶姜谢邹喻柏苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳史唐薛雷贺倪汤殷罗毕郝邬安常乐于傅皮卞齐康伍余顾孟平黄穆萧尹姚邵汪祁毛狄米明计成戴宋庞熊纪舒屈项祝董梁杜阮蓝闵季强贾路江童颜郭梅盛林刁钟徐邱骆高夏蔡田胡凌霍虞万柯管卢莫房解应宗丁宣邓洪包诸左石崔吉钮龚程邢裴陆荣翁荀羊甄曲家封储靳焦巴牧隗车侯全班仰仲伊宫宁仇栾甘厉戎武符刘景詹束龙叶司韶黎蓟薄印宿白怀蒲鄂索赖卓蔺屠乔阴胥苍闻党翟谭贡姬申扶堵冉宰郦雍璩桑桂濮牛寿通边扈燕冀郏浦尚温庄晏柴瞿阎充慕连茹习艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东殳沃利蔚越夔隆师巩聂晁勾敖融辛阚简饶曾关蒯相查荆红游竺权盖益桓公")
GIVEN_CHARS = list("伟强磊洋勇艳杰娟涛明超秀霞平刚桂芳莉玲华慧丹静敏丽军鹏飞娜楠鑫欣倩雪婷玉璐佳颖凯斌晨宇浩博文轩思雨梓涵诗琪子涵依诺子轩俊豪思远若曦可欣雨桐语嫣嘉怡启航宏伟成龙建国志强国庆晓彤晓燕昊天天宇逸凡泽宇梦瑶欣怡子晴瑞雪佳宁泽楷沐宸安然嘉豪嘉瑞家豪亦凡安琪雨晨子墨景行梓轩若琳思琪梦洁宇航慕晴浩然浩宇嘉禾泽楠锦程天成嘉铭奕辰一诺子衿可可语桐芷若曼婷婧怡若萱诗涵雨菲雅雯书瑶泽霖承泽亦航嘉佑文博修远昕彤可心以沫初夏清妍子宁晨曦芮宁星辰欣悦彦霖远航云帆")


@dataclass
class ResumePackage:
    text: str
    role_slug: str
    role_name: str
    person_name: str
    file_stem: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate benchmark resumes for recruiting agent tests.")
    parser.add_argument("--per-role", type=int, default=30, help="Normal resume count per role.")
    parser.add_argument("--abnormal-per-role", type=int, default=6, help="Abnormal resume count per role.")
    parser.add_argument("--output-dir", type=str, default="generated_resumes", help="Output directory.")
    parser.add_argument("--seed", type=int, default=20260303, help="Random seed.")
    parser.add_argument("--skip-pdf", action="store_true", help="Skip PDF generation.")
    parser.add_argument(
        "--roles",
        nargs="*",
        default=list(ROLE_CONFIGS.keys()),
        choices=list(ROLE_CONFIGS.keys()),
        help="Roles to generate.",
    )
    return parser.parse_args()


def fetch_html(url: str, timeout_sec: int = 10) -> str:
    req = Request(
        url=url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    with urlopen(req, timeout=timeout_sec) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        body = resp.read()
        return body.decode(charset, errors="ignore")


def html_to_text(raw_html: str) -> str:
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", raw_html)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text


def collect_online_keywords(role_slug: str) -> Tuple[List[str], Dict[str, object]]:
    cfg = ROLE_CONFIGS[role_slug]
    candidates = list(dict.fromkeys(cfg["skills_must"] + cfg["skills_nice"] + ONLINE_HINT_TERMS[role_slug]))
    counter: Counter[str] = Counter()
    logs: List[Dict[str, str]] = []

    for url in ONLINE_SOURCE_URLS.get(role_slug, []):
        try:
            html_text = fetch_html(url)
            plain_text = html_to_text(html_text)
            for term in candidates:
                hits = plain_text.count(term)
                if hits:
                    counter[term] += hits
            logs.append({"url": url, "status": "ok"})
        except (URLError, HTTPError, TimeoutError, ValueError) as err:
            logs.append({"url": url, "status": f"failed: {err}"})
        except Exception as err:  # noqa: BLE001
            logs.append({"url": url, "status": f"failed: {err}"})

    ordered = [term for term, _ in counter.most_common(16)]
    if len(ordered) < 8:
        ordered.extend(ONLINE_HINT_TERMS[role_slug])
    merged = list(dict.fromkeys(ordered + cfg["skills_must"] + cfg["skills_nice"]))
    final_terms = merged[:20]
    meta = {"sources": logs, "keywords": final_terms}
    return final_terms, meta


def pick_name(rng: random.Random) -> str:
    surname = rng.choice(SURNAMES)
    given_len = 1 if rng.random() < 0.22 else 2
    given = "".join(rng.choice(GIVEN_CHARS) for _ in range(given_len))
    return f"{surname}{given}"


def pick_phone(rng: random.Random) -> str:
    prefix = rng.choice(["13", "15", "17", "18", "19"])
    return prefix + "".join(rng.choice("0123456789") for _ in range(9))


def pick_email(role_slug: str, idx: int, rng: random.Random) -> str:
    letters = "".join(rng.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(6))
    return f"{role_slug}.{idx:03d}.{letters}@example.com"


def pick_salary_k(role_slug: str, exp_years: int, rng: random.Random) -> int:
    ranges = {
        "backend_java_go": (16, 60),
        "frontend_vue": (13, 45),
        "new_media_ops": (8, 28),
        "ecommerce_ops": (8, 35),
        "llm_nlp_algo": (18, 70),
        "fullstack_intern": (4, 26),
        "ai_product_manager": (15, 55),
        "uiux_designer": (10, 40),
        "growth_intern": (4, 18),
        "private_community_parttime": (3, 12),
        "llm_data_engineer": (12, 50),
    }
    lo, hi = ranges[role_slug]
    baseline = lo + int((hi - lo) * min(exp_years, 10) / 10)
    swing = rng.randint(-4, 4)
    return max(lo, min(hi, baseline + swing))


def pick_exp_years(role_slug: str, rng: random.Random) -> int:
    if role_slug in {"fullstack_intern", "growth_intern", "private_community_parttime"}:
        return rng.choices([0, 1, 2, 3], weights=[25, 40, 25, 10], k=1)[0]
    if role_slug in {"llm_nlp_algo", "ai_product_manager", "llm_data_engineer"}:
        return rng.randint(1, 9)
    if role_slug == "uiux_designer":
        return rng.randint(1, 8)
    return rng.randint(1, 10)


def pick_education(exp_years: int, rng: random.Random) -> str:
    if exp_years <= 2:
        return rng.choices(["本科", "硕士", "大专"], weights=[65, 25, 10], k=1)[0]
    if exp_years <= 5:
        return rng.choices(["本科", "硕士", "大专"], weights=[62, 28, 10], k=1)[0]
    return rng.choices(["本科", "硕士", "大专"], weights=[60, 30, 10], k=1)[0]


def split_year_spans(total_years: int, jobs: int, rng: random.Random) -> List[Tuple[int, int]]:
    total_years = max(1, total_years)
    jobs = max(1, min(jobs, total_years))
    cuts = sorted(rng.sample(range(1, total_years), jobs - 1)) if jobs > 1 else []
    spans = []
    prev = 0
    for cut in cuts + [total_years]:
        spans.append(cut - prev)
        prev = cut

    start = CURRENT_YEAR - total_years
    result = []
    for years in spans:
        end = start + years
        result.append((start, end))
        start = end
    return result


def make_metric(role_slug: str, rng: random.Random) -> str:
    if role_slug == "backend_java_go":
        pool = [
            f"QPS提升至{rng.randint(3500, 12000)}+",
            f"接口TP99由{rng.randint(320, 780)}ms下降到{rng.randint(80, 220)}ms",
            f"故障恢复时间缩短{rng.randint(35, 78)}%",
            f"发布效率提升{rng.randint(25, 68)}%",
            "支撑大促期间零重大事故",
        ]
    elif role_slug == "frontend_vue":
        pool = [
            f"首屏加载耗时下降{rng.randint(25, 62)}%",
            f"LCP优化到{rng.uniform(1.8, 3.2):.1f}s",
            f"线上JS报错率下降{rng.randint(30, 73)}%",
            f"核心页面转化率提升{rng.randint(12, 39)}%",
            f"需求交付周期缩短{rng.randint(20, 50)}%",
        ]
    elif role_slug == "new_media_ops":
        pool = [
            f"单月新增粉丝{rng.randint(2, 20)}万+",
            f"账号矩阵月均曝光提升{rng.randint(35, 180)}%",
            f"完播率提升{rng.randint(18, 70)}%",
            f"互动率提升{rng.randint(22, 85)}%",
            f"线索成本下降{rng.randint(15, 48)}%",
        ]
    elif role_slug == "ecommerce_ops":
        pool = [
            f"店铺GMV同比增长{rng.randint(20, 150)}%",
            f"ROI稳定在{rng.uniform(2.0, 6.5):.1f}",
            f"活动期转化率提升{rng.randint(12, 55)}%",
            f"客单价提升{rng.randint(8, 35)}%",
            f"库存周转天数下降{rng.randint(10, 38)}%",
        ]
    elif role_slug == "llm_nlp_algo":
        pool = [
            f"离线评测指标提升{rng.randint(8, 32)}%",
            f"模型推理时延下降{rng.randint(15, 45)}%",
            f"训练成本降低{rng.randint(12, 40)}%",
            f"核心任务召回率提升{rng.randint(6, 22)}%",
            f"线上模型问题率下降{rng.randint(20, 55)}%",
        ]
    elif role_slug == "fullstack_intern":
        pool = [
            f"需求准时交付率提升{rng.randint(10, 38)}%",
            f"缺陷修复效率提升{rng.randint(12, 45)}%",
            f"页面加载耗时下降{rng.randint(15, 50)}%",
            f"联调问题定位时长缩短{rng.randint(20, 55)}%",
            f"测试通过率稳定在{rng.randint(92, 99)}%",
        ]
    elif role_slug == "ai_product_manager":
        pool = [
            f"需求上线周期缩短{rng.randint(15, 45)}%",
            f"核心功能渗透率提升{rng.randint(10, 35)}%",
            f"NPS提升{rng.randint(5, 18)}点",
            f"业务转化率提升{rng.randint(8, 30)}%",
            f"需求命中率提升{rng.randint(12, 40)}%",
        ]
    elif role_slug == "uiux_designer":
        pool = [
            f"可用性任务完成率提升{rng.randint(10, 35)}%",
            f"关键页面跳出率下降{rng.randint(8, 28)}%",
            f"设计交付效率提升{rng.randint(15, 40)}%",
            f"设计一致性问题减少{rng.randint(20, 60)}%",
            f"版本迭代周期缩短{rng.randint(10, 35)}%",
        ]
    elif role_slug == "growth_intern":
        pool = [
            f"拉新成本下降{rng.randint(8, 32)}%",
            f"次日留存提升{rng.randint(5, 22)}%",
            f"活动参与率提升{rng.randint(12, 45)}%",
            f"转化率提升{rng.randint(8, 28)}%",
            f"渠道ROI提升{rng.randint(10, 36)}%",
        ]
    elif role_slug == "private_community_parttime":
        pool = [
            f"社群活跃率提升{rng.randint(12, 45)}%",
            f"咨询转化率提升{rng.randint(8, 30)}%",
            f"私域复购率提升{rng.randint(6, 24)}%",
            f"触达响应时长缩短{rng.randint(20, 60)}%",
            f"活动到课/到店率提升{rng.randint(10, 35)}%",
        ]
    elif role_slug == "llm_data_engineer":
        pool = [
            f"高质量样本通过率提升{rng.randint(10, 40)}%",
            f"标注一致性提升至{rng.randint(90, 98)}%",
            f"数据生产效率提升{rng.randint(20, 65)}%",
            f"训练数据缺陷率下降{rng.randint(18, 55)}%",
            f"评测集覆盖率提升{rng.randint(10, 36)}%",
        ]
    else:
        pool = [
            f"关键指标提升{rng.randint(10, 35)}%",
            f"交付效率提升{rng.randint(12, 40)}%",
            f"质量问题下降{rng.randint(15, 45)}%",
        ]
    return rng.choice(pool)


def make_bullet(role_slug: str, skills: List[str], rng: random.Random) -> str:
    s1 = rng.choice(skills)
    s2 = rng.choice(skills)
    metric = make_metric(role_slug, rng)

    templates = {
        "backend_java_go": [
            "负责核心交易链路研发，基于{0}+{1}完成服务拆分和接口治理，{2}。",
            "主导高并发场景稳定性治理，引入压测与容量评估机制，{2}。",
            "推动后端工程化升级，优化CI/CD与灰度发布流程，{2}。",
        ],
        "frontend_vue": [
            "负责核心业务页面开发，基于{0}+{1}搭建可复用组件体系，{2}。",
            "推进前端工程化与构建优化，规范模块边界和发布流程，{2}。",
            "联合产品与设计完成复杂交互落地，持续优化体验与性能，{2}。",
        ],
        "new_media_ops": [
            "负责账号内容规划与选题拆解，结合{0}与{1}推动内容生产，{2}。",
            "围绕核心人群制定增长策略，联动投流和内容节奏，{2}。",
            "建立内容复盘机制并沉淀方法论，持续优化内容结构，{2}。",
        ],
        "ecommerce_ops": [
            "负责店铺日常运营和活动节奏规划，使用{0}+{1}优化流量结构，{2}。",
            "统筹平台活动报名与落地执行，联动商品与客服团队，{2}。",
            "基于数据看板做周/月度复盘，持续优化投放与转化策略，{2}。",
        ],
        "llm_nlp_algo": [
            "负责大模型算法方案迭代，围绕{0}+{1}优化训练与评测流程，{2}。",
            "参与NLP核心能力建设，完成数据处理、特征分析与实验设计，{2}。",
            "推动模型上线与回归评测闭环，持续优化线上效果与稳定性，{2}。",
        ],
        "fullstack_intern": [
            "参与前后端功能开发，基于{0}+{1}完成模块实现与联调，{2}。",
            "协助完成需求拆解与迭代交付，修复线上问题并补充测试，{2}。",
            "参与工程化建设与代码规范落地，提升团队协作效率，{2}。",
        ],
        "ai_product_manager": [
            "负责AI产品需求调研与方案设计，结合{0}+{1}推进功能落地，{2}。",
            "联动算法、研发与运营团队，推动产品版本迭代和数据复盘，{2}。",
            "搭建核心指标体系并跟踪效果，持续优化产品体验与业务价值，{2}。",
        ],
        "uiux_designer": [
            "负责核心流程的交互方案设计，基于{0}+{1}沉淀统一设计规范，{2}。",
            "结合用户研究与可用性测试优化界面体验，推动设计方案落地，{2}。",
            "协同产品与研发完成设计交付，提升跨端视觉一致性，{2}。",
        ],
        "growth_intern": [
            "参与增长活动策划与执行，围绕{0}+{1}迭代拉新与转化策略，{2}。",
            "负责渠道与内容数据跟踪，输出周报和复盘结论，{2}。",
            "协助搭建增长实验方案并推进AB测试，持续优化增长效率，{2}。",
        ],
        "private_community_parttime": [
            "负责私域社群日常维护，基于{0}+{1}执行触达和转化动作，{2}。",
            "策划并执行社群主题活动，优化用户活跃与复购路径，{2}。",
            "整理运营SOP并协同客服/销售跟进线索，提升服务效率，{2}。",
        ],
        "llm_data_engineer": [
            "负责训练语料构建与质检规则制定，使用{0}+{1}提升数据质量，{2}。",
            "参与标注规范设计与抽检流程搭建，保障数据一致性和可追溯性，{2}。",
            "协同算法团队完善评测集与数据闭环，支撑模型持续迭代，{2}。",
        ],
    }
    pool = templates.get(role_slug) or [
        "负责核心业务模块推进，使用{0}+{1}完成方案落地，{2}。",
        "协同跨团队推进项目交付，持续优化流程与质量，{2}。",
    ]
    return rng.choice(pool).format(s1, s2, metric)


def role_specific_skills(role_slug: str, online_terms: List[str], rng: random.Random) -> List[str]:
    cfg = ROLE_CONFIGS[role_slug]
    must = cfg["skills_must"]
    nice = cfg["skills_nice"]
    pool = list(dict.fromkeys(online_terms + must + nice))

    # Ensure role anchor words are always present
    anchors = {
        "backend_java_go": ["Java", "Go"],
        "frontend_vue": ["Vue3", "TypeScript"],
        "new_media_ops": ["短视频运营", "内容策划"],
        "ecommerce_ops": ["电商运营", "数据复盘"],
        "llm_nlp_algo": ["LLM", "NLP"],
        "fullstack_intern": ["Vue3", "Node.js"],
        "ai_product_manager": ["AI产品", "需求分析"],
        "uiux_designer": ["交互设计", "Figma"],
        "growth_intern": ["用户增长", "活动运营"],
        "private_community_parttime": ["私域运营", "社群运营"],
        "llm_data_engineer": ["数据标注", "数据清洗"],
    }

    base_anchor = anchors.get(role_slug, [])
    chosen = list(dict.fromkeys(base_anchor + rng.sample(pool, k=min(8, len(pool)))))
    return chosen[:8]


def make_self_summary(role_slug: str, exp_years: int, soft_skills: List[str], rng: random.Random) -> str:
    lines = {
        "backend_java_go": [
            f"{exp_years}年后端研发经验，熟悉Java/Go双栈与微服务架构，关注系统稳定性与可扩展性。",
            f"具备较强的{soft_skills[0]}与{soft_skills[1]}能力，能够在复杂业务中快速定位核心问题。",
            "习惯用数据驱动性能优化，强调工程质量、协作效率与长期可维护性。",
        ],
        "frontend_vue": [
            f"{exp_years}年前端开发经验，长期深耕Vue技术栈，兼顾工程效率与用户体验。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，能把抽象需求拆解为可落地的前端方案。",
            "关注性能、可测试性和组件复用，能够稳定推进中大型项目交付。",
        ],
        "new_media_ops": [
            f"{exp_years}年新媒体/短视频运营经验，擅长内容规划、数据复盘与增长策略迭代。",
            f"拥有较强的{soft_skills[0]}和{soft_skills[1]}能力，能在高节奏环境下推动结果落地。",
            "对平台机制和用户偏好敏感，能够持续放大内容价值与商业转化。",
        ],
        "ecommerce_ops": [
            f"{exp_years}年电商运营经验，熟悉平台规则、活动节奏和商品全链路运营。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，注重业务目标拆解和过程管理。",
            "善于通过数据洞察优化流量结构和转化漏斗，稳定驱动GMV增长。",
        ],
        "llm_nlp_algo": [
            f"{exp_years}年大模型/NLP算法经验，熟悉训练、评测与上线优化流程。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，能够高效推进实验迭代和问题定位。",
            "关注算法效果与工程效率平衡，重视数据质量、评测体系与落地价值。",
        ],
        "fullstack_intern": [
            f"{exp_years}年全栈方向实践经验，熟悉前后端协同开发与基础工程化流程。",
            f"具备{soft_skills[0]}和{soft_skills[1]}能力，能快速理解需求并推进实现。",
            "对代码质量和交付节奏有基本认知，愿意持续学习并承担更多业务责任。",
        ],
        "ai_product_manager": [
            f"{exp_years}年产品经验，聚焦AI产品规划、需求分析与跨团队协同落地。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，擅长在复杂场景中抽象问题并制定方案。",
            "重视数据反馈和用户价值验证，能够持续迭代产品并推动业务目标达成。",
        ],
        "uiux_designer": [
            f"{exp_years}年UI/UX设计经验，擅长从用户视角构建清晰易用的交互体验。",
            f"具备{soft_skills[0]}和{soft_skills[1]}能力，能高效协同产品与研发推进设计落地。",
            "关注设计规范、可用性和业务目标的一致性，持续优化体验细节与交付质量。",
        ],
        "growth_intern": [
            f"{exp_years}年增长方向实践经验，熟悉拉新、留存与转化的基础运营方法。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，能够快速执行活动并形成复盘闭环。",
            "对数据变化敏感，能在指导下持续优化策略并支持增长目标达成。",
        ],
        "private_community_parttime": [
            f"{exp_years}年私域/社群方向实践经验，熟悉社群日常维护与用户转化流程。",
            f"具备{soft_skills[0]}和{soft_skills[1]}能力，能在兼职节奏下稳定执行运营动作。",
            "重视服务体验和用户反馈，能够持续优化话术、SOP和社群活跃机制。",
        ],
        "llm_data_engineer": [
            f"{exp_years}年训练数据工程经验，熟悉语料构建、标注质检与数据闭环流程。",
            f"具备{soft_skills[0]}与{soft_skills[1]}能力，能够推动跨团队的数据规范落地。",
            "强调数据一致性和可追溯性，关注数据质量对模型效果的长期影响。",
        ],
    }
    if role_slug not in lines:
        return f"{exp_years}年相关经验，具备{soft_skills[0]}与{soft_skills[1]}能力，能够稳定推进业务目标达成。"
    return "".join(lines[role_slug])


def build_resume(role_slug: str, idx: int, online_terms: List[str], rng: random.Random) -> ResumePackage:
    cfg = ROLE_CONFIGS[role_slug]
    role_name = cfg["role_name"]
    name = pick_name(rng)
    exp_years = pick_exp_years(role_slug, rng)
    education = pick_education(exp_years, rng)
    soft_skills = rng.sample(cfg["soft_skills"], k=3)
    hard_skills = role_specific_skills(role_slug, online_terms, rng)
    phone = pick_phone(rng)
    email = pick_email(role_slug, idx, rng)
    salary_k = pick_salary_k(role_slug, exp_years, rng)

    jobs = 1 if exp_years <= 2 else (2 if exp_years <= 6 else rng.choice([2, 3]))
    spans = split_year_spans(exp_years, jobs, rng)

    company_pool = cfg["company_pool"]
    title_pool = cfg["job_titles"]
    major_pool = cfg["major_pool"]
    companies = rng.sample(company_pool, k=min(jobs, len(company_pool)))
    if len(companies) < jobs:
        companies += [rng.choice(company_pool) for _ in range(jobs - len(companies))]

    work_lines: List[str] = []
    for i, (start, end) in enumerate(spans):
        company = companies[i]
        title = rng.choice(title_pool)
        work_lines.append(f"{company} | {title} | {start}-{end}")
        bullet_1 = make_bullet(role_slug, hard_skills, rng)
        bullet_2 = make_bullet(role_slug, hard_skills, rng)
        retry = 0
        while bullet_2 == bullet_1 and retry < 4:
            bullet_2 = make_bullet(role_slug, hard_skills, rng)
            retry += 1
        work_lines.append(f"- {bullet_1}")
        work_lines.append(f"- {bullet_2}")
        work_lines.append("")

    grad_year = max(CURRENT_YEAR - exp_years - rng.randint(2, 6), CURRENT_YEAR - 12)
    university = rng.choice(UNIVERSITIES)
    major = rng.choice(major_pool)
    self_summary = make_self_summary(role_slug, exp_years, soft_skills, rng)

    text = "\n".join(
        [
            f"Role: {role_name}",
            f"Hard_Skills: {', '.join(hard_skills)}",
            f"Exp_Years: {exp_years}",
            f"Education: {education}",
            f"Soft_Skills: {', '.join(soft_skills)}",
            "",
            f"姓名: {name}",
            f"邮箱: {email}",
            f"电话: {phone}",
            f"期望薪资: {salary_k}k",
            "",
            "工作经历:",
            *work_lines,
            "教育背景:",
            f"{university} | {major} | {education} | {grad_year}",
            "",
            "自我评价:",
            self_summary,
        ]
    ).strip() + "\n"

    stem = f"{idx:03d}_{name}_{role_slug}"
    stem = re.sub(r"[^\w\u4e00-\u9fff\-]+", "_", stem)
    return ResumePackage(text=text, role_slug=role_slug, role_name=role_name, person_name=name, file_stem=stem)


def mutate_abnormal(text: str, rng: random.Random) -> str:
    mode = rng.choice(
        [
            "drop_field",
            "shuffle_sections",
            "wrong_delimiter",
            "broken_year",
            "mixed_header",
            "noise_append",
        ]
    )

    lines = text.splitlines()

    if mode == "drop_field":
        banned = {"Hard_Skills:", "电话:", "Education:", "Soft_Skills:"}
        filtered = []
        dropped = False
        for line in lines:
            if not dropped and any(line.startswith(prefix) for prefix in banned):
                dropped = True
                continue
            filtered.append(line)
        return "\n".join(filtered).strip() + "\n"

    if mode == "shuffle_sections":
        chunks = text.split("\n\n")
        rng.shuffle(chunks)
        return "\n\n".join(chunks).strip() + "\n"

    if mode == "wrong_delimiter":
        broken = text.replace(" | ", " / ").replace("Exp_Years:", "ExpYears:")
        broken = broken.replace("Hard_Skills:", "HardSkills:")
        return broken

    if mode == "broken_year":
        broken = re.sub(r"(\d{4})-(\d{4})", r"\1年至\2年底", text)
        broken = broken.replace("期望薪资:", "期望薪资区间:")
        return broken

    if mode == "mixed_header":
        mixed = text.replace("工作经历:", "WorkExperience:")
        mixed = mixed.replace("教育背景:", "Education_Background:")
        mixed = mixed.replace("自我评价:", "Summary:")
        return mixed

    # noise_append
    noisy = text + "\n备注: 可一周内到岗。偏好广州/深圳。历史项目文档可面试时补充。\n"
    noisy += "附加: ###TEMP### 简历导出版本v2，字段校验未完成。\n"
    return noisy


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def txt_to_html(txt: str, title: str) -> str:
    escaped = html.escape(txt)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>{html.escape(title)}</title>
  <style>
    body {{
      margin: 0;
      padding: 18mm 14mm;
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimSun", sans-serif;
      color: #111;
      background: #fff;
      line-height: 1.6;
      font-size: 13.5px;
    }}
    pre {{
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }}
  </style>
</head>
<body><pre>{escaped}</pre></body>
</html>
"""


def render_pdf_with_playwright(html_path: Path, pdf_path: Path) -> Tuple[bool, str]:
    cmd = get_npx_prefix() + [
        "playwright",
        "pdf",
        "--paper-format",
        "A4",
        html_path.resolve().as_uri(),
        str(pdf_path.resolve()),
    ]
    try:
        proc = subprocess.run(cmd, check=True, capture_output=True)
        stdout = decode_bytes(proc.stdout)
        return True, stdout.strip() or "ok"
    except subprocess.CalledProcessError as err:
        stderr = decode_bytes(err.stderr).strip()
        return False, stderr or str(err)


def maybe_install_chromium() -> Tuple[bool, str]:
    cmd = get_npx_prefix() + ["playwright", "install", "chromium"]
    try:
        proc = subprocess.run(cmd, check=True, capture_output=True)
        return True, decode_bytes(proc.stdout).strip()
    except subprocess.CalledProcessError as err:
        return False, decode_bytes(err.stderr).strip() or str(err)


def get_npx_prefix() -> List[str]:
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if npx:
        return [npx]
    # Windows fallback in case npx is not exported into Python subprocess PATH.
    return ["cmd", "/c", "npx"]


def decode_bytes(data: bytes | None) -> str:
    if not data:
        return ""
    return data.decode("utf-8", errors="ignore")


def generate_dataset(args: argparse.Namespace) -> Dict[str, object]:
    rng = random.Random(args.seed)
    output_root = Path(args.output_dir)

    normal_root = output_root / "normal"
    abnormal_root = output_root / "abnormal"
    html_root = output_root / "_html_cache"
    meta_root = output_root / "_meta"
    for p in [normal_root, abnormal_root, html_root, meta_root]:
        ensure_dir(p)

    online_meta: Dict[str, object] = {}
    role_terms: Dict[str, List[str]] = {}
    for role_slug in args.roles:
        terms, meta = collect_online_keywords(role_slug)
        role_terms[role_slug] = terms
        online_meta[role_slug] = meta

    # Probe PDF ability once before the heavy loop.
    pdf_enabled = not args.skip_pdf
    install_note = ""
    if pdf_enabled:
        ok, note = maybe_install_chromium()
        if not ok:
            pdf_enabled = False
            install_note = f"Playwright Chromium install failed, PDF disabled. {note}"
        else:
            install_note = "Playwright Chromium is ready."

    pdf_failures: List[Dict[str, str]] = []
    totals = {"normal_txt": 0, "normal_pdf": 0, "abnormal_txt": 0, "abnormal_pdf": 0}

    for role_slug in args.roles:
        role_name = ROLE_CONFIGS[role_slug]["role_name"]
        normal_txt_dir = normal_root / role_slug / "txt"
        normal_pdf_dir = normal_root / role_slug / "pdf"
        abnormal_txt_dir = abnormal_root / role_slug / "txt"
        abnormal_pdf_dir = abnormal_root / role_slug / "pdf"
        normal_html_dir = html_root / "normal" / role_slug
        abnormal_html_dir = html_root / "abnormal" / role_slug

        for p in [normal_txt_dir, normal_pdf_dir, abnormal_txt_dir, abnormal_pdf_dir, normal_html_dir, abnormal_html_dir]:
            ensure_dir(p)

        # Normal resumes
        for idx in range(1, args.per_role + 1):
            pkg = build_resume(role_slug=role_slug, idx=idx, online_terms=role_terms[role_slug], rng=rng)
            txt_path = normal_txt_dir / f"{pkg.file_stem}.txt"
            txt_path.write_text(pkg.text, encoding="utf-8")
            totals["normal_txt"] += 1

            if pdf_enabled:
                html_text = txt_to_html(pkg.text, title=f"{role_name}-{pkg.person_name}")
                html_path = normal_html_dir / f"{pkg.file_stem}.html"
                pdf_path = normal_pdf_dir / f"{pkg.file_stem}.pdf"
                html_path.write_text(html_text, encoding="utf-8")
                ok, msg = render_pdf_with_playwright(html_path, pdf_path)
                if ok:
                    totals["normal_pdf"] += 1
                else:
                    pdf_failures.append({"file": str(pdf_path), "error": msg})

        # Abnormal resumes
        for idx in range(1, args.abnormal_per_role + 1):
            base = build_resume(
                role_slug=role_slug,
                idx=1000 + idx,
                online_terms=role_terms[role_slug],
                rng=rng,
            )
            abnormal_text = mutate_abnormal(base.text, rng)
            file_stem = f"{idx:03d}_abnormal_{role_slug}"
            txt_path = abnormal_txt_dir / f"{file_stem}.txt"
            txt_path.write_text(abnormal_text, encoding="utf-8")
            totals["abnormal_txt"] += 1

            if pdf_enabled:
                html_text = txt_to_html(abnormal_text, title=f"abnormal-{role_name}-{idx}")
                html_path = abnormal_html_dir / f"{file_stem}.html"
                pdf_path = abnormal_pdf_dir / f"{file_stem}.pdf"
                html_path.write_text(html_text, encoding="utf-8")
                ok, msg = render_pdf_with_playwright(html_path, pdf_path)
                if ok:
                    totals["abnormal_pdf"] += 1
                else:
                    pdf_failures.append({"file": str(pdf_path), "error": msg})

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "seed": args.seed,
        "roles": args.roles,
        "per_role_normal": args.per_role,
        "per_role_abnormal": args.abnormal_per_role,
        "output_dir": str(output_root.resolve()),
        "pdf_enabled": pdf_enabled,
        "pdf_prepare_note": install_note,
        "totals": totals,
        "online_keywords": online_meta,
        "pdf_failures": pdf_failures[:50],
        "pdf_failure_count": len(pdf_failures),
    }

    (meta_root / "generation_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return summary


def main() -> None:
    args = parse_args()
    start = time.time()
    summary = generate_dataset(args)
    elapsed = time.time() - start
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Elapsed: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
