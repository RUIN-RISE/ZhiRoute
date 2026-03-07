import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { CandidateRank, JobDefinition } from '../api';

export function useWorkspace() {
	const [inviteCode, setInviteCode] = useState<string>('');
	const [accountName, setAccountName] = useState<string>(localStorage.getItem('jobos_account_name') || '');
	const [accountHistory, setAccountHistory] = useState<any[]>([]);
	const [isLogged, setIsLogged] = useState(!!localStorage.getItem('jobos_account_name'));

	const loadHistory = useCallback(async () => {
		try {
			const hist = await api.getAccountHistory();
			const parsedHist = hist.reduce((acc: any[], r: any) => {
				try {
					acc.push({
						...r,
						content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content
					});
				} catch (err) {
					console.warn('Skipping corrupted history record:', r.id);
				}
				return acc;
			}, []);
			setAccountHistory(parsedHist);
		} catch (e) {
			console.error(e);
		}
	}, []);

	// Heartbeat & initial load
	useEffect(() => {
		let interval: any;
		if (isLogged) {
			loadHistory();
			api.heartbeat().catch(() => performLogout(false));
			interval = setInterval(() => {
				api.heartbeat().catch((e) => {
					console.error(e);
					alert("您的账号在别处登录或遇到错误被迫下线。");
					performLogout(false);
				});
			}, 60000); // beating every minute
		}
		return () => { if (interval) clearInterval(interval); };
	}, [isLogged, loadHistory]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteCode.trim()) return false;
		try {
			const data = await api.login(inviteCode.trim());
			setAccountName(data.account_name);
			setIsLogged(true);
			return true;
		} catch (err: any) {
			alert(err.message || '登录异常');
			return false;
		}
	};

	const performLogout = async (callApi = true) => {
		if (callApi) {
			try { await api.logout(); } catch (e) { }
		}
		setIsLogged(false);
		setAccountName('');
		setInviteCode('');
		setAccountHistory([]);
		api.setSessionId('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		})); // Force new session uuid assignment
	};

	// Debounced Auto-save workspace
	useEffect(() => {
		// This part runs via the parent component passing data, 
		// but to cleanly decouple, we will expose autoSaveWorkspace 
		// for App.tsx to call within its own useEffect.
	}, []);

	const autoSaveWorkspace = useCallback((jdData: JobDefinition, candidates: CandidateRank[], cache: Record<string, any>, processedCount: number) => {
		if (!isLogged || candidates.length === 0) return;
		api.saveWorkspace(jdData, candidates, cache, processedCount).catch(console.error);
	}, [isLogged]);

	const deleteHistoryRecord = async (id: number) => {
		await api.deleteHistory(id);
		await loadHistory();
	};

	return {
		isLogged,
		accountName,
		inviteCode,
		accountHistory,
		setInviteCode,
		handleLogin,
		performLogout,
		loadHistory,
		deleteHistoryRecord,
		autoSaveWorkspace
	};
}
