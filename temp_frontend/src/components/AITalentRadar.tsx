import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { AIRadarData, CandidateRank } from '../api';
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	MessageSquare,
	Target,
	X,
	Zap,
} from 'lucide-react';

interface AITalentRadarProps {
	candidate: CandidateRank;
	onClose: () => void;
}

const DIMENSION_META: Array<{ key: string; label: string; max: number }> = [
	{ key: 'github_stars', label: 'GitHub 影响力', max: 20 },
	{ key: 'github_commits', label: 'GitHub 活跃度', max: 15 },
	{ key: 'github_prs', label: 'GitHub PR 贡献', max: 15 },
	{ key: 'modelscope_contributions', label: '魔搭社区贡献', max: 20 },
	{ key: 'arxiv_papers', label: '论文公开发表', max: 15 },
];

function prettifyRadarError(error: string): string {
	if (!error) return '外部数据源暂时不可用。';
	if (error.includes('Timeout')) return '外部数据源请求超时，仅返回部分结果。';
	if (error.includes('404 Not Found')) return '未找到对应的魔搭用户，请填写准确的魔搭用户名或个人主页链接。';
	return error
		.replace('GITHUB Error:', 'GitHub：')
		.replace('ModelScope:', '魔搭：')
		.replace('ARXIV Error:', 'arXiv：');
}

function prettifyDimensionName(name: string): string {
	const map: Record<string, string> = {
		github_stars: 'GitHub 影响力',
		github_commits: 'GitHub 活跃度',
		github_prs: 'GitHub PR 贡献',
		modelscope_contributions: '魔搭社区贡献',
		arxiv_papers: '论文公开发表',
	};
	return map[name] || name;
}

export const AITalentRadar: React.FC<AITalentRadarProps> = ({ candidate, onClose }) => {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<AIRadarData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [github, setGithub] = useState('');
	const [modelscope, setModelscope] = useState('');
	const [arxiv, setArxiv] = useState('');
	const [generatingQs, setGeneratingQs] = useState(false);
	const [questions, setQuestions] = useState<string[]>([]);
	const [qsError, setQsError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(false);
		setData(null);
		setError(null);
		setQuestions([]);
		setQsError(null);
		setGithub('');
		setModelscope('');
		setArxiv('');
	}, [candidate.resume_id]);

	const displayErrors = useMemo(() => (data?.errors || []).map(prettifyRadarError), [data]);

	const fetchRadarData = async (gh: string = '', ms: string = '', arx: string = '') => {
		const ghUsername = gh.trim();
		const modelscopeUsername = ms.trim();
		const arxName = arx.trim();

		if (!ghUsername && !modelscopeUsername && !arxName) {
			setData(null);
			setError('请至少填写一个公开标识后再分析。');
			setQuestions([]);
			setQsError(null);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			setQuestions([]);
			setQsError(null);
			const result = await api.analyzeAiRadar(candidate.resume_id, ghUsername, modelscopeUsername, arxName);
			setData(result);
		} catch (err: any) {
			setError(err.message || 'AI 人才雷达分析失败。');
		} finally {
			setLoading(false);
		}
	};

	const handleManualSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		fetchRadarData(github, modelscope, arxiv);
	};

	const handleGenerateQuestions = async () => {
		if (!data) return;
		try {
			setGeneratingQs(true);
			setQsError(null);
			const generated = await api.generateAiRadarQuestions(candidate.resume_id, data);
			setQuestions(generated);
		} catch (err: any) {
			setQsError(err.message || 'AI 面试题生成失败');
		} finally {
			setGeneratingQs(false);
		}
	};

	const renderDimension = (label: string, score: number = 0, max: number = 20) => {
		const percentage = Math.min(100, Math.max(0, (score / max) * 100));
		return (
			<div className="mb-4">
				<div className="flex justify-between text-xs mb-1.5">
					<span className="font-medium text-zinc-200">{label}</span>
					<span className="text-zinc-500">{score}/{max}</span>
				</div>
				<div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
			<div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090B] text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)] flex flex-col">
				<div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
							<Zap className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-lg font-semibold tracking-tight">AI 人才雷达</h3>
							<p className="text-xs text-zinc-500">候选人：{candidate.name}</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="px-6 pt-5">
					<div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100 flex items-start gap-3">
						<AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
						<div className="space-y-1">
							<p>这个雷达基于公开资料做交叉验证，请优先填写准确的公开标识。</p>
							<p className="text-xs text-amber-200/80">
								GitHub 填用户名；魔搭建议填用户名或个人主页链接；arXiv 填作者英文名。
							</p>
						</div>
					</div>
				</div>

				{(error || (data?.degraded && displayErrors.length > 0)) && (
					<div className="px-6 pt-4">
						<div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
							{error ? error : `仅返回部分结果：${displayErrors.join(' ｜ ')}`}
						</div>
					</div>
				)}

				<div className="flex-1 overflow-y-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
					<div className="space-y-5">
						<form onSubmit={handleManualSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
							<div className="mb-4">
								<h4 className="text-sm font-semibold text-zinc-100">公开标识</h4>
								<p className="mt-1 text-xs text-zinc-500">建议至少填写 1 项；如果你知道准确的用户名，优先用用户名而不是姓名。</p>
							</div>
							<div className="space-y-3">
								<input
									type="text"
									placeholder="GitHub 用户名，例如：torvalds"
									value={github}
									onChange={(event) => setGithub(event.target.value)}
									className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
								/>
								<input
									type="text"
									placeholder="魔搭用户名或个人主页链接"
									value={modelscope}
									onChange={(event) => setModelscope(event.target.value)}
									className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
								/>
								<input
									type="text"
									placeholder="arXiv 作者英文名，例如：Yoshua Bengio"
									value={arxiv}
									onChange={(event) => setArxiv(event.target.value)}
									className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
								/>
								<button
									type="submit"
									disabled={loading}
									className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors shadow-[0_0_24px_rgba(79,70,229,0.35)]"
								>
									{loading ? '分析中...' : '分析公开资料'}
								</button>
							</div>
						</form>

						<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
							<div className="flex items-center gap-4 mb-6">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-2xl font-black text-white shadow-[0_0_30px_rgba(79,70,229,0.35)]">
									{data?.total_score ?? '--'}
								</div>
								<div>
									<div className="text-base font-semibold text-white">综合公开资料得分</div>
									<div className="text-xs text-zinc-500">基于代码、魔搭社区与论文公开数据生成</div>
								</div>
							</div>

							{DIMENSION_META.map((item) =>
								renderDimension(item.label, data?.dimensions?.[item.key], item.max),
							)}
						</div>
					</div>

					<div className="space-y-6">
						<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] overflow-hidden">
							<div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
								<Target className="w-4 h-4 text-indigo-300" />
								<h4 className="text-sm font-semibold text-white">证据链</h4>
							</div>

							<div className="max-h-[430px] overflow-auto">
								{loading ? (
									<div className="py-16 flex flex-col items-center justify-center text-zinc-500">
										<Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
										<p className="text-sm">正在抓取公开资料并生成评分...</p>
									</div>
								) : !data ? (
									<div className="py-16 flex flex-col items-center justify-center text-zinc-500">
										<AlertCircle className="w-10 h-10 mb-4 text-zinc-700" />
										<p className="text-sm">填写公开标识后即可开始分析。</p>
									</div>
								) : data.evidence.length === 0 ? (
									<div className="py-16 flex flex-col items-center justify-center text-zinc-500">
										<CheckCircle2 className="w-10 h-10 mb-4 text-zinc-700" />
										<p className="text-sm">未发现足够强的公开证据。</p>
									</div>
								) : (
									<table className="w-full text-left text-sm">
										<thead className="sticky top-0 bg-[#111114] text-zinc-500 text-xs">
											<tr>
												<th className="px-5 py-3 font-medium">维度</th>
												<th className="px-5 py-3 font-medium">来源与证据</th>
												<th className="px-5 py-3 font-medium">自动分析</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-white/5">
											{data.evidence.map((ev, index) => (
												<tr key={index} className="hover:bg-white/[0.02] transition-colors">
													<td className="px-5 py-4 align-top">
														<span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200 whitespace-nowrap">
															{prettifyDimensionName(ev.dimension)}
														</span>
													</td>
													<td className="px-5 py-4 align-top">
														<div className="text-zinc-100 leading-relaxed">{ev.original_text}</div>
														<a
															href={ev.source_link}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-300 hover:text-cyan-200"
														>
															查看来源 ↗
														</a>
													</td>
													<td className="px-5 py-4 align-top text-zinc-400 leading-relaxed max-w-sm">
														{ev.analysis}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</div>
						</div>

						<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] overflow-hidden">
							<div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
								<div className="flex items-center gap-2">
									<MessageSquare className="w-4 h-4 text-violet-300" />
									<h4 className="text-sm font-semibold text-white">AI 专属面试题</h4>
								</div>
								{!questions.length && (
									<button
										onClick={handleGenerateQuestions}
										disabled={loading || generatingQs || !data?.evidence?.length}
										className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
									>
										{generatingQs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
										生成定制题目
									</button>
								)}
							</div>
							<div className="p-5 min-h-[130px]">
								{qsError && <div className="mb-3 text-xs text-red-300">{qsError}</div>}
								{questions.length > 0 ? (
									<ul className="space-y-4">
										{questions.map((question, index) => (
											<li key={index} className="flex gap-3">
												<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-200 text-xs font-semibold">
													{index + 1}
												</span>
												<p className="text-sm text-zinc-200 leading-relaxed">{question}</p>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-zinc-500 text-center py-6">
										分析完成后，可基于公开证据自动生成更有针对性的 AI 面试题。
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
