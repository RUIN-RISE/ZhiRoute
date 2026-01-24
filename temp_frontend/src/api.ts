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
		'X-Session-ID': getSessionId()
	};
}

// API Functions
export const api = {
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
		const allResumes: Resume[] = [];

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
				const resumes = await res.json();
				allResumes.push(...resumes);
			}
		}

		return allResumes;
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
	}
};

export default api;
