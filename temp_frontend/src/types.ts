/**
 * 结构化岗位描述
 */
export interface StructuredJD {
    role: string | null;
    stack: string[];
    exp_level: string;
    culture_fit: string[];
    education: string;
    plus_points: string[];
    remarks: string;
}

export const INITIAL_JD: StructuredJD = {
    role: null,
    stack: [],
    exp_level: "未指定",
    culture_fit: [],
    education: "未指定",
    plus_points: [],
    remarks: ""
};

/**
 * 首页建议文案（轮播）
 */
export const START_SUGGESTIONS = [
    "寻找一位拥有5年经验的 React 架构师...",
    "招募一名 Python 后端专家...",
    "急需一位增长黑客..."
];
