// API Service Layer for FastAPI Backend
// Base URL is proxied by Vite to http://localhost:7860

const API_BASE = '/api';

// Types matching FastAPI backend
export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatRequest {
	message: string;
	history: ChatMessage[];
}

export interface ChatResponse {
	reply: string;
	is_complete: boolean;
	collected_info: Record<string, any>;
	quick_replies: string[];
}

export interface ClarificationAnswer {
	question_id: string;
	answer: string;
}

export interface SalaryConfig {
	range: string;
	tax_type: string;
	has_bonus: boolean;
	description?: string;
}

export interface JobDefinition {
	title: string;
	key_responsibilities: string[];
	required_skills: string[];
	experience_level: string;
	education: string;
	salary: SalaryConfig;
	work_location: string;
	bonus_skills: string[];
	culture_fit: string[];
}

export interface Resume {
	id: string;
	name: string;
	content: string;
	parsed_skills: string[];
	years_experience: number;
}

export interface Evidence {
	criteria: string;
	quote: string;
	reasoning: string;
}

export interface CandidateRank {
	resume_id: string;
	name: string;
	rank: number;
	score: number;
	summary: string;
	top_evidence: Evidence[];
	evidence_quotes: string[];
}

export interface ActionResponse {
	content: string;
	interview_questions: string[];
}

// --- AI Talent Radar Types ---
export interface AIRadarDimensions {
	github_stars?: number;
	github_commits?: number;
	github_prs?: number;
	modelscope_contributions?: number;
	arxiv_papers?: number;
	[key: string]: number | undefined;
}

export interface AIRadarEvidence {
	dimension: string;
	original_text: string;
	source_link: string;
	analysis: string;
}

export interface AIRadarData {
	total_score: number;
	dimensions: AIRadarDimensions;
	evidence: AIRadarEvidence[];
	errors?: string[];
	degraded?: boolean;
}

export interface AIRadarQuestionsResponse {
	questions: string[];
}

// Session Management
const SESSION_KEY = 'jobos_session_id';
const ACCOUNT_KEY = 'jobos_account_name';

function getSessionId(): string {
	let sid = localStorage.getItem(SESSION_KEY);
	if (!sid) {
		// Simple UUID v4 generator
		sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
		localStorage.setItem(SESSION_KEY, sid);
	}
	return sid;
}

function getHeaders(contentType = 'application/json'): HeadersInit {
	return {
		'Content-Type': contentType,
		'X-Session-ID': getSessionId(),
		'X-Account-Name': localStorage.getItem(ACCOUNT_KEY) || ''
	};
}

async function handleResError(res: Response, defaultMsg: string): Promise<never> {
	let detail = '';
	try {
		const data = await res.json();
		detail = data?.detail || data?.message || data?.error || '';
	} catch (e) {
		// Ignore json parse error if response is not JSON
	}
	throw new Error(`${defaultMsg}${detail ? `: ${detail}` : ` (HTTP ${res.status})`}`);
}

// API Functions
export const api = {
	// Auth
	async login(inviteCode: string): Promise<{ status: string, account_name: string }> {
		const res = await fetch(`${API_BASE}/login`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ invite_code: inviteCode })
		});
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.detail || `Login failed: ${res.status}`);
		}
		const data = await res.json();
		localStorage.setItem(ACCOUNT_KEY, data.account_name);
		return data;
	},

	async logout(): Promise<void> {
		try {
			await fetch(`${API_BASE}/logout`, {
				method: 'POST',
				headers: getHeaders()
			});
		} catch (e) {
			console.error("Logout error", e);
		}
		localStorage.removeItem(ACCOUNT_KEY);
	},

	async heartbeat(): Promise<void> {
		const res = await fetch(`${API_BASE}/heartbeat`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.detail || `Heartbeat failed`);
		}
	},

	// Workspace snapshot
	async saveWorkspace(jdData: any, candidates: any[], interviewCache: any, processedCount: number = 0): Promise<void> {
		const res = await fetch(`${API_BASE}/save_workspace`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({
				jd_data: jdData,
				candidates: candidates,
				interview_cache: interviewCache,
				processed_count: processedCount
			})
		});
		if (!res.ok) await handleResError(res, '保存工作区快照失败');
	},

	// Multi-turn chat for requirement clarification
	async chat(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
		const res = await fetch(`${API_BASE}/chat`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ message, history })
		});
		if (!res.ok) await handleResError(res, '发起聊天请求失败');
		return res.json();
	},

	// Reset chat history
	async resetChat(): Promise<void> {
		await fetch(`${API_BASE}/reset_chat`, {
			method: 'POST',
			headers: getHeaders()
		});
	},

	// Generate JD from collected info
	async generateJd(answers: ClarificationAnswer[], rawReq: string): Promise<JobDefinition> {
		const res = await fetch(`${API_BASE}/generate_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ answers, raw_req: rawReq })
		});
		if (!res.ok) await handleResError(res, '生成职位描述 (JD) 失败');
		return res.json();
	},

	// Parse Raw JD text directly
	async parseJd(text: string): Promise<JobDefinition> {
		const res = await fetch(`${API_BASE}/parse_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ text })
		});
		if (!res.ok) await handleResError(res, '解析导入简历 (JD) 失败');
		return res.json();
	},

	// Push JD context directly to Session (for History Restoration)
	async setCurrentJd(jd: JobDefinition): Promise<void> {
		const res = await fetch(`${API_BASE}/set_current_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(jd)
		});
		if (!res.ok) await handleResError(res, '同步云端JD状态失败');
	},

	// 删除单条历史记录
	async deleteHistory(recordId: number): Promise<void> {
		const res = await fetch(`${API_BASE}/delete_history/${recordId}`, {
			method: 'DELETE',
			headers: getHeaders()
		});
		if (!res.ok) return handleResError(res, '无法发送反馈记录');
	},

	// --- AI Talent Radar ---
	analyzeAiRadar: async (
		resumeId: string,
		githubUsername: string = "",
		modelscopeUsername: string = "",
		arxivName: string = ""
	): Promise<AIRadarData> => {
		const res = await fetch(`${API_BASE}/analyze/ai-radar`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({
				resume_id: resumeId,
				github_username: githubUsername,
				modelscope_username: modelscopeUsername,
				arxiv_name: arxivName,
			}),
		});
		if (res.ok) return res.json();
		return handleResError(res, 'AI人才雷达分析失败');
	},

	generateAiRadarQuestions: async (resumeId: string, radarData: AIRadarData): Promise<string[]> => {
		const res = await fetch(`${API_BASE}/analyze/ai-radar-questions`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({
				resume_id: resumeId,
				radar_data: radarData,
			}),
		});
		if (res.ok) {
			const data: AIRadarQuestionsResponse = await res.json();
			return data.questions;
		}
		return handleResError(res, 'AI专属面试题生成失败');
	},
	// 通过 LLM 生成适合对外发布的完整 JD Markdown 文档
	async generateJdMarkdown(): Promise<{ markdown: string }> {
		const res = await fetch(`${API_BASE}/generate_jd_markdown`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, 'AI 排版 Markdown 失败');
		return res.json();
	},

	// Clear accumulated resumes in current session
	async clearResumes(): Promise<void> {
		const res = await fetch(`${API_BASE}/clear_resumes`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '清空简历缓存失败');
	},

	// Upload resumes (zip/txt/pdf)
	async uploadResumes(file: File): Promise<Resume[]> {
		const formData = new FormData();
		formData.append('file', file);

		// Content-Type is auto-set by fetch for FormData, so we only need X-Session-ID
		const headers: any = { 'X-Session-ID': getSessionId() };

		const res = await fetch(`${API_BASE}/upload_resumes`, {
			method: 'POST',
			headers: headers,
			body: formData
		});
		if (!res.ok) await handleResError(res, '上传合并简历失败');
		return res.json();
	},

	// Upload multiple files as FormData
	async uploadMultipleResumes(files: File[]): Promise<Resume[]> {
		// Backend expects a single file (zip)
		// For multiple PDFs, we need to handle differently or upload one by one
		let latestResumes: Resume[] = [];

		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);

			const headers: any = { 'X-Session-ID': getSessionId() };

			const res = await fetch(`${API_BASE}/upload_resumes`, {
				method: 'POST',
				headers: headers,
				body: formData
			});
			if (res.ok) {
				// The backend returns the cumulative amount of resumes for the user in the session
				latestResumes = await res.json();
			} else {
				await handleResError(res, `批量上传失败，问题文件：${file.name}`);
			}
		}

		return latestResumes;
	},

	// Generate fake resumes for testing
	async generateFakeResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/generate_fake_resumes`, {
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '注入模拟简历集合请求失败');
		return res.json();
	},

	// Analyze and rank resumes
	async analyzeResumes(): Promise<CandidateRank[]> {
		const res = await fetch(`${API_BASE}/analyze_resumes`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '简历打分排行榜请求失败');
		return res.json();
	},

	// Generate action (offer/reject/interview)
	async generateAction(candidateName: string, actionType: 'offer' | 'reject' | 'interview', jobTitle: string): Promise<ActionResponse> {
		const res = await fetch(`${API_BASE}/generate_action`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({
				candidate_name: candidateName,
				action_type: actionType,
				job_title: jobTitle
			})
		});
		if (!res.ok) await handleResError(res, 'AI 动作生成与发信配置失败');
		return res.json();
	},

	// Fetch history records from cloud node
	async getAccountHistory(recordType?: string): Promise<any[]> {
		const url = recordType ? `${API_BASE}/account_history?record_type=${recordType}` : `${API_BASE}/account_history`;
		const res = await fetch(url, {
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '获取云端历史状态切片失败');
		return res.json();
	},

	// Delete private resume from cloud
	async deletePrivateResume(filename: string): Promise<void> {
		const res = await fetch(`${API_BASE}/delete_private_resume/${encodeURIComponent(filename)}`, {
			method: 'DELETE',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '彻底删除私有云简历实体失败');
	},

	// Upload private resumes (multiple files) to cloud node
	async uploadPrivateResumes(files: File[]): Promise<any[]> {
		const results = [];
		const headers: any = { 'X-Session-ID': getSessionId() };

		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);
			try {
				const res = await fetch(`${API_BASE}/upload_private_resume`, {
					method: 'POST',
					headers: headers,
					body: formData
				});
				if (!res.ok) await handleResError(res, `上传私有简历 ${file.name} 失败`);
				const data = await res.json();
				results.push(data);
			} catch (e) {
				console.error(`Failed to upload ${file.name}`, e);
				throw e;
			}
		}
		return results;
	},

	// List private resumes for the account
	async listPrivateResumes(): Promise<{ filename: string, size: number, created_at: number }[]> {
		const res = await fetch(`${API_BASE}/list_private_resumes`, {
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '列出云端私有简历失败');
		return res.json();
	},

	// Trigger pulling private resumes from cloud and parsing them
	async fetchPrivateResumes(filename: string): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_private_resumes?filename=${encodeURIComponent(filename)}`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '拉取私有简历进行热处理失败');
		return res.json();
	},

	// Fetch the shared/public 'output_resume.zip' from cloud
	async fetchPublicResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_resumes_from_cloud`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) await handleResError(res, '拉取内测公共库进行热处理失败');
		return res.json();
	},

	setSessionId(newId: string) {
		localStorage.setItem(SESSION_KEY, newId);
	},

	getSessionId() {
		return getSessionId();
	}
};

export default api;
