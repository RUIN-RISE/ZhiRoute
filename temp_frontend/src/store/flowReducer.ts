import { useReducer } from 'react';
import type { CandidateRank, JobDefinition } from '../api';

export type FlowStep = 'IDLE' | 'BRIEFING' | 'JD_REVIEW' | 'DEPLOYED' | 'INTERVIEW_PREP';
export type DashboardPhase = 'INGEST' | 'PROCESSING' | 'RESULTS';

export interface FlowState {
	step: FlowStep;
	jdData: JobDefinition;
	shortlistedCandidates: CandidateRank[];
	dashboardPhase: DashboardPhase;
	dashboardFiles: File[];
	dashboardLogs: string[];
	dashboardCandidates: CandidateRank[];
	dashboardProcessedCount: number;
	interviewCache: Record<string, any>;
}

type Action =
	| { type: 'START_BRIEFING'; roleName: string }
	| { type: 'FINISH_BRIEFING'; jd: JobDefinition }
	| { type: 'CONFIRM_JD'; jd: JobDefinition }
	| { type: 'START_INTERVIEW'; candidate: CandidateRank }
	| { type: 'NAV_BACK' }
	| { type: 'LOAD_HISTORY_RECORD'; jd: JobDefinition, isWorkspace: boolean, payload?: any }
	| { type: 'RESET_ALL'; initialJd: JobDefinition }
	// Field updates
	| { type: 'SET_JD_DATA'; jd: JobDefinition | ((prev: JobDefinition) => JobDefinition) }
	| { type: 'SET_DASHBOARD_PHASE'; phase: DashboardPhase }
	| { type: 'SET_DASHBOARD_FILES'; files: File[] | ((prev: File[]) => File[]) }
	| { type: 'SET_DASHBOARD_LOGS'; logs: string[] | ((prev: string[]) => string[]) }
	| { type: 'SET_DASHBOARD_CANDIDATES'; candidates: CandidateRank[] | ((prev: CandidateRank[]) => CandidateRank[]) }
	| { type: 'SET_DASHBOARD_PROCESSED_COUNT'; count: number | ((prev: number) => number) }
	| { type: 'SET_INTERVIEW_CACHE'; cache: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>) };

export const INITIAL_JD: JobDefinition = {
	title: "",
	key_responsibilities: [],
	required_skills: [],
	experience_level: "未指定",
	education: "未指定",
	bonus_skills: [],
	culture_fit: [],
	work_location: "杭州",
	salary: { range: "面议", tax_type: "税前", has_bonus: false, description: "" }
};

const initialState: FlowState = {
	step: 'IDLE',
	jdData: INITIAL_JD,
	shortlistedCandidates: [],
	dashboardPhase: 'INGEST',
	dashboardFiles: [],
	dashboardLogs: [],
	dashboardCandidates: [],
	dashboardProcessedCount: 0,
	interviewCache: {}
};

function flowReducer(state: FlowState, action: Action): FlowState {
	switch (action.type) {
		case 'START_BRIEFING':
			return { ...state, jdData: { ...state.jdData, title: action.roleName }, step: 'BRIEFING' };
		case 'FINISH_BRIEFING':
			return { ...state, jdData: action.jd, step: 'JD_REVIEW' };
		case 'CONFIRM_JD':
			return { ...state, jdData: action.jd, step: 'DEPLOYED' };
		case 'START_INTERVIEW':
			if (state.shortlistedCandidates.find(c => c.resume_id === action.candidate.resume_id)) {
				return { ...state, step: 'INTERVIEW_PREP' };
			}
			return {
				...state,
				shortlistedCandidates: [...state.shortlistedCandidates, action.candidate],
				step: 'INTERVIEW_PREP'
			};
		case 'NAV_BACK':
			if (state.step === 'BRIEFING') return { ...state, step: 'IDLE' };
			if (state.step === 'JD_REVIEW') return { ...state, step: 'BRIEFING' };
			if (state.step === 'DEPLOYED') {
				return { ...state, dashboardPhase: 'INGEST', dashboardFiles: [], dashboardCandidates: [], step: 'JD_REVIEW' };
			}
			if (state.step === 'INTERVIEW_PREP') return { ...state, step: 'DEPLOYED' };
			return state;
		case 'LOAD_HISTORY_RECORD':
			if (action.isWorkspace) {
				return {
					...state,
					jdData: action.jd,
					dashboardCandidates: action.payload?.candidates || [],
					interviewCache: action.payload?.interviewCache || {},
					dashboardProcessedCount: action.payload?.processedCount || (action.payload?.candidates?.length || 0),
					step: 'DEPLOYED',
					dashboardPhase: 'RESULTS'
				};
			}
			return { ...state, jdData: action.jd, step: 'JD_REVIEW' };
		case 'RESET_ALL':
			return { ...initialState, jdData: action.initialJd };

		// Setters
		case 'SET_JD_DATA':
			return { ...state, jdData: typeof action.jd === 'function' ? action.jd(state.jdData) : action.jd };
		case 'SET_DASHBOARD_PHASE':
			return { ...state, dashboardPhase: action.phase };
		case 'SET_DASHBOARD_FILES':
			return { ...state, dashboardFiles: typeof action.files === 'function' ? action.files(state.dashboardFiles) : action.files };
		case 'SET_DASHBOARD_LOGS':
			return { ...state, dashboardLogs: typeof action.logs === 'function' ? action.logs(state.dashboardLogs) : action.logs };
		case 'SET_DASHBOARD_CANDIDATES':
			return { ...state, dashboardCandidates: typeof action.candidates === 'function' ? action.candidates(state.dashboardCandidates) : action.candidates };
		case 'SET_DASHBOARD_PROCESSED_COUNT':
			return { ...state, dashboardProcessedCount: typeof action.count === 'function' ? action.count(state.dashboardProcessedCount) : action.count };
		case 'SET_INTERVIEW_CACHE':
			return { ...state, interviewCache: typeof action.cache === 'function' ? action.cache(state.interviewCache) : action.cache };
		default:
			return state;
	}
}

export function useFlowReducer() {
	return useReducer(flowReducer, initialState);
}
