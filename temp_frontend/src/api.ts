// API Service Layer for FastAPI Backend
// Base URL is proxied by Vite to http://localhost:7860

const API_BASE = '/api';

// --- 会话管理工具函数 ---
let _sessionId: string = (() => {
	const saved = localStorage.getItem('jobos_session_id');
	if (saved) return saved;
	const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
	localStorage.setItem('jobos_session_id', id);
	return id;
})();

export function getSessionId(): string { return _sessionId; }
export function setSessionId(id: string) {
	_sessionId = id;
	localStorage.setItem('jobos_session_id', id);
}

function getHeaders(): Record<string, string> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Session-ID': _sessionId };
	const accountName = localStorage.getItem('jobos_account_name');
	if (accountName) {
		headers['X-Account-Name'] = accountName;
	}
	return headers;
}

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
	salary: SalaryConfig;
	work_location: string;
	bonus_skills: string[];
	education?: string;
	culture_fit?: string[];
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

// API Functions
export const api = {
	// --- 账号认证 ---
	async login(inviteCode: string): Promise<{ account_name: string }> {
		const res = await fetch(`${API_BASE}/login`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ invite_code: inviteCode, session_id: _sessionId })
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ detail: '登录失败' }));
			throw new Error(err.detail || `Login failed: ${res.status}`);
		}
		const data = await res.json();
		localStorage.setItem('jobos_account_name', data.account_name);
		return data;
	},

	async logout(): Promise<void> {
		await fetch(`${API_BASE}/logout`, { method: 'POST', headers: getHeaders() });
		localStorage.removeItem('jobos_account_name');
	},

	async heartbeat(): Promise<void> {
		const res = await fetch(`${API_BASE}/heartbeat`, { method: 'POST', headers: getHeaders() });
		if (!res.ok) throw new Error(`Heartbeat failed: ${res.status}`);
	},

	// --- 云端历史记录 ---
	async getAccountHistory(): Promise<any[]> {
		const res = await fetch(`${API_BASE}/account_history`, { headers: getHeaders() });
		if (!res.ok) return [];
		return res.json();
	},

	async deleteHistory(recordId: number): Promise<void> {
		const res = await fetch(`${API_BASE}/delete_history/${recordId}`, {
			method: 'DELETE',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Delete history failed: ${res.status}`);
	},

	// Multi-turn chat for requirement clarification
	async chat(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
		const res = await fetch(`${API_BASE}/chat`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ message, history })
		});
		if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
		return res.json();
	},

	// Reset chat history
	async resetChat(): Promise<void> {
		await fetch(`${API_BASE}/reset_chat`, { method: 'POST', headers: getHeaders() });
	},

	// Generate JD from collected info
	async generateJd(answers: ClarificationAnswer[], rawReq: string): Promise<JobDefinition> {
		const res = await fetch(`${API_BASE}/generate_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ answers, raw_req: rawReq })
		});
		if (!res.ok) throw new Error(`Generate JD failed: ${res.status}`);
		return res.json();
	},

	async setCurrentJd(jd: JobDefinition): Promise<void> {
		const res = await fetch(`${API_BASE}/set_current_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(jd)
		});
		if (!res.ok) throw new Error(`Set current JD failed: ${res.status}`);
	},

	// 通过 LLM 生成适合对外发布的完整 JD Markdown 文档
	async generateJdMarkdown(jd: JobDefinition): Promise<{ markdown: string }> {
		const res = await fetch(`${API_BASE}/generate_jd_markdown`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(jd)
		});
		if (!res.ok) throw new Error(`Generate JD markdown failed: ${res.status}`);
		return res.json();
	},

	// Upload resumes (zip/txt/pdf)
	async uploadResumes(file: File): Promise<Resume[]> {
		const formData = new FormData();
		formData.append('file', file);

		const res = await fetch(`${API_BASE}/upload_resumes`, {
			method: 'POST',
			headers: { 'X-Session-ID': _sessionId },
			body: formData
		});
		if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
		return res.json();
	},

	// Upload multiple files as FormData
	async uploadMultipleResumes(files: File[]): Promise<Resume[]> {
		// Backend expects a single file (zip)
		// For multiple PDFs, we need to handle differently or upload one by one
		const allResumes: Resume[] = [];

		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch(`${API_BASE}/upload_resumes`, {
				method: 'POST',
				headers: { 'X-Session-ID': _sessionId },
				body: formData
			});
			if (res.ok) {
				const resumes = await res.json();
				allResumes.push(...resumes);
			}
		}

		return allResumes;
	},

	// Generate fake resumes for testing
	async generateFakeResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/generate_fake_resumes`, { headers: getHeaders() });
		if (!res.ok) throw new Error(`Generate fake resumes failed: ${res.status}`);
		return res.json();
	},

	async fetchPublicResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_public_resumes`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Fetch public resumes failed: ${res.status}`);
		return res.json();
	},

	async fetchPrivateResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_private_resumes`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Fetch private resumes failed: ${res.status}`);
		return res.json();
	},

	// Analyze and rank resumes
	async analyzeResumes(): Promise<CandidateRank[]> {
		const res = await fetch(`${API_BASE}/analyze_resumes`, { method: 'POST', headers: getHeaders() });
		if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
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
		if (!res.ok) throw new Error(`Generate action failed: ${res.status}`);
		return res.json();
	},

	// --- 工作区云端同步 ---
	async saveWorkspace(jdData: any, candidates: any[], interviewCache: any): Promise<void> {
		const res = await fetch(`${API_BASE}/save_workspace`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ jd_data: jdData, candidates, interview_cache: interviewCache })
		});
		if (!res.ok) throw new Error(`Save workspace failed: ${res.status}`);
	},

	// --- 私有简历上传 ---
	async uploadPrivateResume(file: File): Promise<void> {
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch(`${API_BASE}/upload_private_resume`, {
			method: 'POST',
			headers: { 'X-Session-ID': _sessionId },
			body: formData
		});
		if (!res.ok) throw new Error(`Private upload failed: ${res.status}`);
	}
};

export default api;
