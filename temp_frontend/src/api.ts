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
	salary: SalaryConfig;
	work_location: string;
	bonus_skills: string[];
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
	async saveWorkspace(jdData: any, candidates: any[], interviewCache: any): Promise<void> {
		const res = await fetch(`${API_BASE}/save_workspace`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({
				jd_data: jdData,
				candidates: candidates,
				interview_cache: interviewCache
			})
		});
		if (!res.ok) throw new Error(`Save workspace failed: ${res.status}`);
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
		if (!res.ok) throw new Error(`Generate JD failed: ${res.status}`);
		return res.json();
	},

	// Push JD context directly to Session (for History Restoration)
	async setCurrentJd(jd: JobDefinition): Promise<void> {
		const res = await fetch(`${API_BASE}/set_current_jd`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(jd)
		});
		if (!res.ok) throw new Error(`Set current JD failed: ${res.status}`);
	},

	// 删除单条历史记录
	async deleteHistory(recordId: number): Promise<void> {
		const res = await fetch(`${API_BASE}/delete_history/${recordId}`, {
			method: 'DELETE',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Delete history failed: ${res.status}`);
	},

	// 通过 LLM 生成适合对外发布的完整 JD Markdown 文档
	async generateJdMarkdown(): Promise<{ markdown: string }> {
		const res = await fetch(`${API_BASE}/generate_jd_markdown`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Generate JD markdown failed: ${res.status}`);
		return res.json();
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
		if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
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
				console.error(`Upload failed for ${file.name}`);
			}
		}

		return latestResumes;
	},

	// Generate fake resumes for testing
	async generateFakeResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/generate_fake_resumes`, {
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Generate fake resumes failed: ${res.status}`);
		return res.json();
	},

	// Analyze and rank resumes
	async analyzeResumes(): Promise<CandidateRank[]> {
		const res = await fetch(`${API_BASE}/analyze_resumes`, {
			method: 'POST',
			headers: getHeaders()
		});
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

	// Fetch history records from cloud node
	async getAccountHistory(recordType?: string): Promise<any[]> {
		const url = recordType ? `${API_BASE}/account_history?record_type=${recordType}` : `${API_BASE}/account_history`;
		const res = await fetch(url, {
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Fetch history failed: ${res.status}`);
		return res.json();
	},

	// Upload a private resume zip to cloud node
	async uploadPrivateResume(file: File): Promise<any> {
		const formData = new FormData();
		formData.append('file', file);
		const headers: any = { 'X-Session-ID': getSessionId() };

		const res = await fetch(`${API_BASE}/upload_private_resume`, {
			method: 'POST',
			headers: headers,
			body: formData
		});
		if (!res.ok) throw new Error(`Upload private resume failed: ${res.status}`);
		return res.json();
	},

	// Trigger pulling private resumes from cloud and parsing them
	async fetchPrivateResumes(filename: string): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_private_resumes?filename=${encodeURIComponent(filename)}`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Fetch private resumes failed: ${res.status}`);
		return res.json();
	},

	// Fetch the shared/public 'output_resume.zip' from cloud
	async fetchPublicResumes(): Promise<Resume[]> {
		const res = await fetch(`${API_BASE}/fetch_resumes_from_cloud`, {
			method: 'POST',
			headers: getHeaders()
		});
		if (!res.ok) throw new Error(`Fetch public resumes failed: ${res.status}`);
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
