import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  UploadCloud,
  XCircle,
  ChevronDown,
  Mail,
  ArrowRight,
  Code2,
  Loader2,
  Activity,
  Cpu,
  Zap,
  CheckCircle2,
  ListFilter,
  ShieldCheck,
  Radar,
  Vote,
  Target,
  ChevronLeft,
  FileText,
  User,
  Terminal as BotIcon,
  LogOut,
  History,
  Lock,
  Unlock,
  Archive,
  RefreshCw,
  Trash2,
  Copy,
  CheckCheck,
  Check,
  CheckCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import logoW from './assets/logo_w.png';
// --- API CLIENT ---
import api from './api';
import type { ChatMessage, CandidateRank, JobDefinition } from './api';
import { useFlowReducer, INITIAL_JD } from './store/flowReducer';
import { useWorkspace } from './hooks/useWorkspace';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---

const START_SUGGESTIONS = [
  "寻找一位拥有5年经验的 React 架构师...",
  "招募一名 Python 后端专家...",
  "急需一位增长黑客..."
];

// --- APP COMPONENT ---
export default function JobOSCmdDeck() {
  const [state, dispatch] = useFlowReducer();
  const { step, jdData, shortlistedCandidates, dashboardPhase, dashboardFiles, dashboardLogs, dashboardCandidates, dashboardProcessedCount, interviewCache } = state;

  const {
    isLogged, accountName, inviteCode, accountHistory,
    setInviteCode, handleLogin, performLogout, loadHistory,
    autoSaveWorkspace
  } = useWorkspace();

  // 关联工作区自动更新
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSaveWorkspace(jdData, dashboardCandidates, interviewCache, dashboardProcessedCount);
    }, 2000);
    return () => clearTimeout(timer);
  }, [dashboardCandidates, interviewCache, isLogged, jdData, dashboardProcessedCount, autoSaveWorkspace]);

  const handleLoadHistoryRecord = async (record: any) => {
    let rawJd = null;
    let isWorkspace = false;

    if (record.record_type === 'jd') {
      rawJd = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
    } else if (record.record_type === 'workspace') {
      isWorkspace = true;
      const wObj = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
      rawJd = wObj.jd_data || {};

      // We process the rest downstream with the payload
    } else {
      return;
    }

    const finalJd: JobDefinition = {
      title: rawJd.title || rawJd.role || "",
      key_responsibilities: rawJd.key_responsibilities || [],
      required_skills: rawJd.required_skills || rawJd.stack || [],
      experience_level: rawJd.experience_level || rawJd.exp_level || "未指定",
      culture_fit: rawJd.culture_fit || [],
      education: rawJd.education || "未指定",
      bonus_skills: rawJd.bonus_skills || rawJd.plus_points || [],
      salary: {
        range: rawJd.salary?.range || "面议",
        tax_type: rawJd.salary?.tax_type || "税前",
        has_bonus: rawJd.salary?.has_bonus || false,
        description: rawJd.salary?.description || rawJd.remarks || ""
      },
      work_location: rawJd.work_location || "杭州"
    };

    try {
      await api.setCurrentJd(finalJd);
    } catch (e) { console.error("Sync JD error", e); }

    const payload = isWorkspace ? {
      candidates: (typeof record.content === 'string' ? JSON.parse(record.content) : record.content).candidates || [],
      interviewCache: (typeof record.content === 'string' ? JSON.parse(record.content) : record.content).interview_cache || {},
      processedCount: (typeof record.content === 'string' ? JSON.parse(record.content) : record.content).processed_count || 0
    } : undefined;

    dispatch({ type: 'LOAD_HISTORY_RECORD', jd: finalJd, isWorkspace, payload });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Motion: Mouse Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handlers
  const handleStart = (roleName: string) => dispatch({ type: 'START_BRIEFING', roleName });
  const handleBriefComplete = (finalJd: JobDefinition) => dispatch({ type: 'FINISH_BRIEFING', jd: finalJd });
  const handleJdConfirmed = async (confirmedJd: JobDefinition) => {
    try { await api.setCurrentJd(confirmedJd); } catch (e) { console.error("Sync JD error", e); }
    dispatch({ type: 'CONFIRM_JD', jd: confirmedJd });
  };

  const handleStartInterviewFlow = (candidate: CandidateRank) => dispatch({ type: 'START_INTERVIEW', candidate });
  const handleBack = () => dispatch({ type: 'NAV_BACK' });

  const handleLogoutFull = async () => {
    await performLogout();
    dispatch({ type: 'RESET_ALL', initialJd: INITIAL_JD });
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/80"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-0 z-30 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(29, 78, 216, 0.15), transparent 40%)` }} />
      </div>

      <header className="fixed top-0 w-full z-50 h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl transition-all duration-500">
        <div className="flex items-center gap-4">
          {step !== 'IDLE' && (
            <button onClick={handleBack} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group">
              <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            </button>
          )}
          <div className="flex items-center gap-3 select-none pointer-events-none">
            <img src={logoW} alt="JobOS Logo" className="h-8 object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <div className={cn("w-1.5 h-1.5 rounded-full", step === 'IDLE' ? "bg-zinc-600" : "bg-emerald-500")}></div>
            {step === 'IDLE' ? 'System Ready' : 'Pipeline Active'}
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>

          {/* Account Area */}
          {!isLogged ? (
            <form onSubmit={handleLogin} className="flex items-center gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入内测码..."
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 w-40 placeholder:text-zinc-600 transition-colors uppercase"
              />
              <button type="submit" className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-500 transition-colors">
                <Lock className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
              >
                <History className="w-4 h-4" />
                历史记录 ({accountHistory.length})
              </button>

              <div className="h-4 w-[1px] bg-white/10"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{accountName}</div>
                  <div className="text-[10px] text-zinc-500">Cloud Synced</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                  <Unlock className="w-4 h-4" />
                </div>
                <button onClick={handleLogoutFull} className="ml-1 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 transition-colors" title="注销登录">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 pt-20 min-h-screen flex flex-col">
        {/* --- History Sidebar Drawer --- */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-96 bg-[#0A0A0B] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Archive className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-none">账号时间线</h3>
                      <p className="text-xs text-zinc-500 mt-1">云端同步的最近 10 条记录</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={loadHistory} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors" title="刷新历史">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="mx-2 p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {accountHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                      <Archive className="w-12 h-12 opacity-20" />
                      <p className="text-sm">暂无云端历史记录</p>
                    </div>
                  ) : (
                    accountHistory.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider", rec?.record_type === 'jd' ? "bg-indigo-500/20 text-indigo-300" : "bg-emerald-500/20 text-emerald-300")}>
                            {rec?.record_type || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">{rec?.created_at ? rec.created_at : (rec?.timestamp ? new Date(rec.timestamp * 1000).toLocaleString() : '')}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); api.deleteHistory(rec.id).then(loadHistory).catch(console.error); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="删除此条记录"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-zinc-300 font-medium line-clamp-2 cursor-pointer group-hover:text-indigo-300 transition-colors" onClick={() => handleLoadHistoryRecord(rec)}>
                          {rec?.record_type === 'jd' ?
                            (rec?.content?.title || rec?.content?.role || "未命名职位") :
                            rec?.record_type === 'workspace' ?
                              <div className="flex flex-col gap-1">
                                <span>工作区: {rec?.content?.jd_data?.title || rec?.content?.jd_data?.role || '未命名'}</span>
                                <span className="text-xs text-zinc-500">
                                  包含 {rec?.content?.candidates?.length || 0} 份简历解析记录
                                </span>
                              </div> :
                              `${rec?.content?.content?.substring(0, 30) || '...'}...`
                          }
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence mode='wait'>
          {step === 'IDLE' && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }} transition={{ duration: 0.5 }} className="flex-1 flex flex-col">
              <LandingPage onStart={handleStart} isLogged={isLogged} onSkipToDashboard={() => {
                dispatch({ type: 'SET_DASHBOARD_PHASE', phase: 'INGEST' });
                dispatch({ type: 'SET_JD_DATA', jd: INITIAL_JD }); // or keep current
                dispatch({ type: 'CONFIRM_JD', jd: jdData }); // essentially SET_STEP to DEPLOYED
              }} onImportJd={(jd) => {
                dispatch({ type: 'FINISH_BRIEFING', jd });
              }} />
            </motion.div>
          )}
          {step === 'BRIEFING' && (
            <motion.div key="briefing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col items-center justify-center p-2 w-full h-full">
              <SpecConfigurator initialUserInput={jdData.title || ''} onComplete={handleBriefComplete} />
            </motion.div>
          )}
          {step === 'JD_REVIEW' && (
            <motion.div key="jd_review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col items-center justify-center p-4">
              <JdReviewPanel jd={jdData} onConfirm={handleJdConfirmed} />
            </motion.div>
          )}
          {step === 'DEPLOYED' && (
            <motion.div key="execution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="flex-1 overflow-hidden">
              <ExecutionDashboard
                onStartInterview={handleStartInterviewFlow}
                jdData={jdData}
                // Lifted Props
                phase={dashboardPhase}
                setPhase={(phase) => dispatch({ type: 'SET_DASHBOARD_PHASE', phase })}
                files={dashboardFiles}
                setFiles={(files) => dispatch({ type: 'SET_DASHBOARD_FILES', files })}
                logs={dashboardLogs}
                setLogs={(logs) => dispatch({ type: 'SET_DASHBOARD_LOGS', logs })}
                candidates={dashboardCandidates}
                setCandidates={(candidates) => dispatch({ type: 'SET_DASHBOARD_CANDIDATES', candidates })}
                processedCount={dashboardProcessedCount}
                setProcessedCount={(count) => dispatch({ type: 'SET_DASHBOARD_PROCESSED_COUNT', count })}
              />
            </motion.div>
          )}
          {step === 'INTERVIEW_PREP' && (
            <motion.div key="interview" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="flex-1 overflow-hidden h-full">
              <InterviewPanel candidates={shortlistedCandidates} cache={interviewCache} setCache={(cache) => dispatch({ type: 'SET_INTERVIEW_CACHE', cache })} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
// --- 2.5 JD REVIEW PANEL ---
function JdReviewPanel({ jd, onConfirm }: { jd: JobDefinition, onConfirm: (jd: JobDefinition) => void }) {
  const [editedJd, setEditedJd] = useState(jd);

  useEffect(() => {
    setEditedJd(jd);
  }, [jd]);

  const handleChange = (field: keyof JobDefinition, value: any) => {
    setEditedJd(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-4xl bg-[#0A0A0B] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">确认职位描述 (JD)</h2>
              <p className="text-zinc-500 text-sm">请检查并完善生成的 JD，这决定了简历匹配的精准度</p>
            </div>
          </div>
          <MagneticButton onClick={() => onConfirm(editedJd)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500">
            确认并继续 <ArrowRight className="w-4 h-4" />
          </MagneticButton>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label icon={<User className="w-4 h-4" />} text="职位名称" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={editedJd.title || ''} onChange={e => handleChange('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label icon={<Activity className="w-4 h-4" />} text="经验要求" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={editedJd.experience_level} onChange={e => handleChange('experience_level', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label icon={<Code2 className="w-4 h-4" />} text="核心技能 (逗号分隔)" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={(editedJd.required_skills || []).join(', ')} onChange={e => handleChange('required_skills', e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean))} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label icon={<Target className="w-4 h-4" />} text="加分项 (逗号分隔)" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={(editedJd.bonus_skills || []).join(', ')} onChange={e => handleChange('bonus_skills', e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean))} />
          </div>
          <div className="space-y-2">
            <Label icon={<ShieldCheck className="w-4 h-4" />} text="学历要求" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={editedJd.education || ''} onChange={e => handleChange('education', e.target.value)} />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label icon={<Activity className="w-4 h-4" />} text="薪资范围" />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={editedJd.salary?.range || ''} onChange={e => handleChange('salary', { ...(editedJd.salary || {}), range: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label icon={<Activity className="w-4 h-4" />} text="补充说明" />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={editedJd.salary?.description || ''} onChange={e => handleChange('salary', { ...(editedJd.salary || {}), description: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label icon={<Vote className="w-4 h-4" />} text="软技能" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors" value={(editedJd.culture_fit || []).join(', ')} onChange={e => handleChange('culture_fit', e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean))} />
          </div>
        </div>

        {/* Markdown 导出区域 */}
        <JdMarkdownExport jd={editedJd} />

      </div>
    </div>
  );
}

function JdMarkdownExport({ jd }: { jd: JobDefinition }) {
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 先把当前 JD 同步到后端 session
      await api.setCurrentJd(jd);
      const res = await api.generateJdMarkdown();
      setMarkdown(res.markdown);
    } catch (e: any) {
      setError('生成失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="mt-4 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-zinc-300">AI 生成招聘文档</span>
          <span className="text-xs text-zinc-600">· 可直接发布到招聘平台</span>
        </div>
        <div className="flex items-center gap-2">
          {markdown && (
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10"
              )}
            >
              {copied ? <><CheckCheck className="w-3.5 h-3.5" /> 已复制！</> : <><Copy className="w-3.5 h-3.5" /> 复制全文</>}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成中…</> : <><Zap className="w-3.5 h-3.5" /> {markdown ? '重新生成' : '生成 JD 文档'}</>}
          </button>
        </div>
      </div>

      {!markdown && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-600 gap-3">
          <FileText className="w-8 h-8 opacity-30" />
          <p className="text-sm">点击「生成 JD 文档」，AI 将根据岗位信息撰写完整的职位描述与要求</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-sm">正在调用 AI 撰写完整 JD 文档…</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 text-sm text-red-400 text-center">{error}</div>
      )}

      {markdown && !loading && (
        <pre className="text-sm text-zinc-300 font-sans leading-relaxed p-5 bg-black/20 whitespace-pre-wrap max-h-72 overflow-y-auto">{markdown}</pre>
      )}
    </div>
  );
}

// ... (Rest of existing components: LandingPage, SpecConfigurator)


// --- 1. LANDING PAGE ---
function LandingPage({ onStart, isLogged, onSkipToDashboard, onImportJd }: { onStart: (role: string) => void, isLogged?: boolean, onSkipToDashboard?: () => void, onImportJd?: (jd: JobDefinition) => void }) {
  const [input, setInput] = useState('');
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportSubmit = async () => {
    if (!importText.trim() || isImporting || !onImportJd) return;
    setIsImporting(true);
    try {
      const jd = await api.parseJd(importText);
      onImportJd(jd);
    } catch (e: any) {
      alert("解析失败: " + e.message);
    } finally {
      setIsImporting(false);
      setShowImportModal(false);
      setImportText('');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIdx(prev => (prev + 1) % START_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="relative mb-20 group">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="relative w-40 h-40 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_60px_rgba(99,102,241,0.2)]">
          <Radar className="w-16 h-16 text-indigo-400 animate-spin-slow duration-[10s]" />
          <div className="absolute inset-0 rounded-full border border-indigo-500/30 border-t-transparent animate-spin duration-[4s]"></div>
        </div>
      </div>

      <div className="text-center max-w-6xl space-y-12 mb-24 relative z-10">
        <h1 className="text-7xl md:text-8xl font-black text-white tracking-[-0.05em] leading-[1.1] drop-shadow-2xl">
          简历筛选<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400 animate-gradient-x">从未如此智能</span>
        </h1>
        <p className="text-xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
          将繁琐的初筛工作交给 AI。<br />
          <span className="text-zinc-500 text-base mt-2 block">自动化流水线：岗位澄清 → 简历解析 → 智能排序 → 面试邀约</span>
        </p>
      </div>

      <div className="w-full max-w-3xl relative z-20">
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) onStart(input); }} className="relative bg-white/5 border border-white/20 rounded-3xl p-5 flex items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:bg-black/80 focus-within:border-indigo-500/50 group hover:border-indigo-500/30 hover:shadow-[0_0_80px_rgba(99,102,241,0.15)]">
          <div className="pl-6 pr-6 text-indigo-400">
            <Terminal className="w-10 h-10" />
          </div>
          <input autoFocus className="flex-1 bg-transparent border-none text-white text-3xl h-20 outline-none placeholder:text-zinc-700 font-mono font-bold tracking-tight caret-white" value={input} onChange={e => setInput(e.target.value)} placeholder="" />
          {!input && (
            <div className="absolute left-28 top-1/2 -translate-y-1/2 text-zinc-600 text-lg pointer-events-none flex items-center font-mono opacity-50">

              <AnimatePresence mode="wait">
                <motion.span key={suggestionIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}>
                  {START_SUGGESTIONS[suggestionIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
          <div className="flex gap-4">
            <MagneticButton type="submit" className="bg-white text-black hover:bg-indigo-50 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] px-12 h-20 rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3 whitespace-nowrap active:scale-95 uppercase">
              开始筛选
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
          </div>
        </form>

        {/* Secondary Action: Skip to Dashboard and Import */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <button type="button" onClick={() => setShowImportModal(true)} className="px-8 py-3 rounded-xl border border-white/10 text-zinc-400 bg-white/5 hover:bg-white/10 transition-all text-sm font-bold flex items-center justify-center whitespace-nowrap backdrop-blur-md">
            导入外部 JD (跳过对话)
          </button>

          {isLogged && (
            <button type="button" onClick={onSkipToDashboard} className="px-8 py-3 rounded-xl border border-indigo-500/30 text-indigo-300 bg-black/40 hover:bg-indigo-500/10 transition-all text-sm font-bold flex items-center justify-center whitespace-nowrap backdrop-blur-md hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              直接进入简历库
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isImporting && setShowImportModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0A0A0B] border border-white/10 shadow-2xl rounded-3xl p-8 z-50 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><FileText className="w-5 h-5" /></div>
                  <h3 className="text-xl font-bold tracking-tight text-white">直接导入 JD 文本</h3>
                </div>
                <button onClick={() => !isImporting && setShowImportModal(false)} className="text-zinc-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
              </div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="请将完整的招聘需求贴在此处，AI将自动提取关键信息并构造数字画像..."
                className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                disabled={isImporting}
              />
              <div className="mt-6 flex justify-end">
                <MagneticButton disabled={isImporting || !importText.trim()} onClick={handleImportSubmit} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                  {isImporting ? <><Loader2 className="w-4 h-4 animate-spin" /> 解析提取中...</> : <><CheckCircle className="w-4 h-4" /> 确认导入</>}
                </MagneticButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- 2. SPEC CONFIGURATOR: CHAT TO JD ---
function SpecConfigurator({ initialUserInput, onComplete }: { initialUserInput: string, onComplete: (jd: JobDefinition) => void }) {
  // Fix: remarks should be empty for Salary, not the initial prompt.
  // We use a separate state 'requestContext' to keep the original prompt for JD generation.
  const [formData, setFormData] = useState<JobDefinition>({ ...INITIAL_JD, title: initialUserInput });
  const [requestContext] = useState(initialUserInput);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [apiHistory, setApiHistory] = useState<ChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    let mounted = true;

    // Reset backend chat session
    api.resetChat().then(() => {
      if (!mounted) return;
      setIsAiThinking(true);
      // Start with initial user input if present
      api.chat(initialUserInput).then(res => {
        if (!mounted) return;
        setIsAiThinking(false);
        setMessages([
          { role: 'user', content: initialUserInput },
          { role: 'assistant', content: res.reply }
        ]);
        setApiHistory([
          { role: 'user', content: initialUserInput },
          { role: 'assistant', content: res.reply }
        ]);
        setQuickReplies(res.quick_replies || []);

        if (res.collected_info) {
          updateFormData(res.collected_info);
        }
      }).catch(err => {
        console.error("Chat init error", err);
        setIsAiThinking(false);
      });
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateFormData = (info: any) => {
    // Helper to ensure array
    const toArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? val.split(/[,，]/) : []);

    setFormData(prev => ({
      ...prev,
      title: info.title || prev.title,
      required_skills: info.core_skills ? toArray(info.core_skills) : prev.required_skills,
      experience_level: info.exp_years || prev.experience_level,
      // Map 'soft_skills' or 'culture_fit' from backend to frontend 'culture_fit'
      culture_fit: (info.soft_skills || info.culture_fit) ? toArray(info.soft_skills || info.culture_fit) : prev.culture_fit,
      education: info.education || prev.education,
      // Map 'bonus' or 'plus_points' from backend to frontend 'plus_points'
      bonus_skills: (info.bonus || info.bonus_skills) ? toArray(info.bonus || info.bonus_skills) : prev.bonus_skills,
      // Map 'salary' from backend to frontend 'salary.description'
      salary: {
        ...(prev.salary || {}),
        description: info.salary || prev.salary?.description || "面议"
      }
    }));
  };

  const handleChatSubmit = async (e?: React.FormEvent, msgOverride?: string) => {
    e?.preventDefault();
    const txt = msgOverride || chatInput.trim();
    if (!txt || isAiThinking) return;

    setChatInput('');
    setQuickReplies([]); // clear buttons on send
    setMessages(prev => [...prev, { role: 'user', content: txt }]);
    setIsAiThinking(true);

    try {
      const res = await api.chat(txt, apiHistory); // Send history to keep context sync if needed, though backend handles it

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      setApiHistory(prev => [...prev, { role: 'user', content: txt }, { role: 'assistant', content: res.reply }]);

      if (res.quick_replies) setQuickReplies(res.quick_replies);
      if (res.collected_info) updateFormData(res.collected_info);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "抱歉，网络连接似乎有点问题，请重试。" }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Convert collected data to answers format for generate_jd
  const handleGenerate = async () => {
    setIsAiThinking(true);
    // Prepare answers for generate_jd
    const answers = [
      { question_id: 'role', answer: formData.title || "" },
      { question_id: 'stack', answer: formData.required_skills.join(',') },
      { question_id: 'exp', answer: formData.experience_level || "" },
      { question_id: 'soft', answer: formData.culture_fit.join(',') },
      { question_id: 'edu', answer: formData.education || "" },
      { question_id: 'bonus', answer: formData.bonus_skills.join(',') },
      { question_id: 'salary', answer: [formData.salary?.range, formData.salary?.description].filter(Boolean).join(' ') || "" }
    ];

    try {
      // Use requestContext (original prompt) as the raw requirement base
      const jd = await api.generateJd(answers, requestContext);
      // Map backend JD to frontend structure
      const finalJd: JobDefinition = {
        title: jd.title,
        key_responsibilities: jd.key_responsibilities,
        required_skills: jd.required_skills,
        experience_level: jd.experience_level,
        culture_fit: (jd.culture_fit && jd.culture_fit.length > 0) ? jd.culture_fit : formData.culture_fit,
        education: jd.education && jd.education !== "未指定" ? jd.education : formData.education,
        bonus_skills: (jd.bonus_skills && jd.bonus_skills.length > 0) ? jd.bonus_skills : formData.bonus_skills,
        work_location: jd.work_location,
        salary: jd.salary
      };
      onComplete(finalJd);
    } catch (e) {
      console.error(e);
      alert("JD 生成失败");
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="w-[98%] h-[92vh] max-w-[1900px] relative animate-in fade-in zoom-in-95 duration-500 flex flex-col">
      <div className="glass-dark border border-white/10 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden ring-1 ring-white/5 transition-all duration-500 flex-1 flex flex-col bg-black/80 backdrop-blur-3xl">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">定义目标画像</h2>
              <p className="text-sm text-zinc-500 font-medium mt-1">与 AI 助理对话以明确需求</p>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="col-span-3 flex flex-col bg-white/[0.02] rounded-3xl border border-white/10 overflow-hidden relative shadow-inner">
              <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none"></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-4 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10", msg.role === 'assistant' ? "bg-indigo-600 text-white" : "bg-white text-black")}>
                      {msg.role === 'assistant' ? <BotIcon className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div className={cn("p-6 rounded-3xl text-lg font-medium leading-relaxed max-w-[80%] shadow-2xl", msg.role === 'assistant' ? "bg-[#0A0A0B] border border-indigo-500/30 text-indigo-50 rounded-tl-none" : "bg-white text-zinc-900 rounded-tr-none")}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isAiThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[90%]">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0"><BotIcon className="w-4 h-4 text-white" /></div>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-indigo-500/10 text-indigo-100"><Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">AI 正在思考...</span></div>
                  </motion.div>
                )}
                {/* Quick Replies */}
                {quickReplies.length > 0 && !isAiThinking && (
                  <div className="flex flex-wrap gap-2 ml-16">
                    {quickReplies.map((qr, i) => (
                      <button key={i} onClick={() => setChatInput(prev => prev ? prev + " " + qr : qr)} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm transition-all">{qr}</button>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="relative">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="输入您的回答..." className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl pl-6 pr-16 py-5 text-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner placeholder:text-zinc-600 transition-all font-medium" autoFocus disabled={isAiThinking} />
                  <button type="submit" disabled={isAiThinking} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="col-span-1 bg-[#050505] border-l border-white/10 p-8 text-sm overflow-y-auto relative backdrop-blur-md">
              <div className="absolute top-6 right-6 text-indigo-500 animate-pulse"><Activity className="w-5 h-5" /></div>
              <h3 className="text-zinc-500 font-bold uppercase tracking-[0.2em] mb-8 text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>实时岗位画像</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">目标岗位</span>
                  <span className="text-white block bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-base font-bold shadow-sm">{formData.title || '—'}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">核心技能</span>
                  <div className="flex flex-wrap gap-2">{formData.required_skills.length > 0 ? formData.required_skills.map(s => <span key={s} className="text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]">{s}</span>) : <span className="text-zinc-700 italic"> 等待输入...</span>}</div>
                </div>
                <div className="space-y-2"><span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">经验要求</span><span className={cn("block text-base font-medium", formData.experience_level !== '未指定' ? "text-emerald-400" : "text-zinc-500")}>{formData.experience_level}</span></div>
                <div className="space-y-2"><span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">学历要求</span><span className={cn("block text-base font-medium", formData.education !== '未指定' ? "text-emerald-400" : "text-zinc-500")}>{formData.education}</span></div>
                <div className="space-y-2"><span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">薪资待遇</span><span className={cn("block text-base font-medium", formData.salary.description && formData.salary.description !== formData.title ? "text-emerald-400" : "text-zinc-500")}>{formData.salary.description === formData.title ? "等待输入..." : formData.salary.description}</span></div>
                <div className="space-y-2"><span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">软技能</span><div className="flex flex-wrap gap-2">{formData.culture_fit.length > 0 ? formData.culture_fit.map(s => <span key={s} className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 text-xs">{s}</span>) : <span className="text-zinc-700 italic">...</span>}</div></div>
                <div className="space-y-2"><span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">加分项</span><div className="flex flex-wrap gap-2">{formData.bonus_skills.length > 0 ? formData.bonus_skills.map(s => <span key={s} className="text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 text-xs">{s}</span>) : <span className="text-zinc-700 italic">...</span>}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-white/5 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono tracking-wider"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>AGENTS STANDBY</div>

          <MagneticButton onClick={handleGenerate} disabled={isAiThinking} className="group bg-white text-black px-10 py-4 rounded-xl font-bold text-base hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95">
            {isAiThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <>启动筛选引擎<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
          </MagneticButton>

        </div>
      </div>
    </div>
  );
}

// --- 3. EXECUTION DASHBOARD ---
interface DashboardProps {
  onStartInterview: (c: CandidateRank) => void;
  jdData: JobDefinition;
  // Lifted Props
  phase: 'INGEST' | 'PROCESSING' | 'RESULTS';
  setPhase: (p: 'INGEST' | 'PROCESSING' | 'RESULTS') => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  candidates: CandidateRank[];
  setCandidates: React.Dispatch<React.SetStateAction<CandidateRank[]>>;
  processedCount: number;
  setProcessedCount: React.Dispatch<React.SetStateAction<number>>;
}

function ExecutionDashboard({
  onStartInterview,
  jdData,
  phase, setPhase,
  files: uploadedFiles, setFiles: setUploadedFiles,
  logs, setLogs,
  candidates, setCandidates,
  processedCount, setProcessedCount
}: DashboardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // processedCount is now a prop
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPrivateSelectorOpen, setIsPrivateSelectorOpen] = useState(false);
  const [privateResumes, setPrivateResumes] = useState<{ filename: string, size: number, created_at: number }[]>([]);
  const [isLoadingPrivateList, setIsLoadingPrivateList] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.txt') || f.name.endsWith('.md') || f.name.endsWith('.zip'));
    if (files.length > 0) setUploadedFiles(prev => [...prev, ...files].slice(0, 50));
  };

  const [usePublicCloud, setUsePublicCloud] = useState(false);
  const [selectedPrivateFiles, setSelectedPrivateFiles] = useState<string[]>([]);

  const startProcessing = async () => {
    if (uploadedFiles.length === 0 && !usePublicCloud && selectedPrivateFiles.length === 0) return;
    if (!jdData || !jdData.title) {
      alert("请先创建新需求或从右上角载入一份生效的历史职位描述 (JD)，再启动简历分析匹配！");
      return;
    }

    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      setPhase('PROCESSING');

      // Step 1: Sync JD & Clean Pool
      try {
        await api.setCurrentJd(jdData);
        await api.clearResumes();
      } catch (err) {
        console.warn("Could not sync JD data to backend or clear cache", err);
      }

      // Step 2: Ingest
      let resultResumes: any[] = [];

      if (uploadedFiles.length > 0) {
        setLogs(prev => [...prev, "[INFO] 本地上传简历中..."]);
        const localResumes = await api.uploadMultipleResumes(uploadedFiles);
        if (localResumes.length === 0) {
          throw new Error("无可用且解析成功的本地简历。");
        } else if (localResumes.length < uploadedFiles.length) {
          setLogs(prev => [...prev, `[WARNING] 部分本地简历失败。仅成功 ${localResumes.length} 份。`]);
        }
        resultResumes = localResumes;
      }

      if (usePublicCloud) {
        setLogs(prev => [...prev, "[INFO] 从云端拉取公有简历集..."]);
        const pubResumes = await api.fetchPublicResumes();
        resultResumes = pubResumes;
      }

      if (selectedPrivateFiles.length > 0) {
        setLogs(prev => [...prev, `[INFO] 从云端拉取已选的 ${selectedPrivateFiles.length} 个私有简历文件...`]);
        for (const fname of selectedPrivateFiles) {
          try {
            const privResumes = await api.fetchPrivateResumes(fname);
            resultResumes = privResumes;
          } catch (err) {
            setLogs(prev => [...prev, `[ERROR] 拉取私有文件 ${fname} 失败`]);
          }
        }
      }

      setProcessedCount(resultResumes.length);
      setLogs(prev => [...prev, `[SUCCESS] 简历准备完成，本次分析池共就绪 ${resultResumes.length} 份...`]);

      // Step 3: Analyze
      setLogs(prev => [...prev, "[ANALYSIS] 正在进行多维能力画像匹配... (可能需要1-2分钟)"]);
      setUploadProgress(100);
      clearInterval(progressInterval);

      const ranks = await api.analyzeResumes();
      setLogs(prev => [...prev, `[RESULT] 完成分析，发现 ${ranks.length} 位高潜力候选人。`]);

      setTimeout(() => {
        setCandidates(ranks);
        setPhase('RESULTS');
      }, 1000);
    } catch (e) {
      clearInterval(progressInterval);
      setLogs(prev => [...prev, `[ERROR] 处理失败: ${e}`]);
      alert("处理失败，请重试");
      setPhase('INGEST');
    }
  };

  const handleSelectCloudSource = (type: 'public' | 'private') => {
    if (type === 'public') {
      setUsePublicCloud(!usePublicCloud);
    } else {
      setIsPrivateSelectorOpen(true);
      setIsLoadingPrivateList(true);
      api.listPrivateResumes()
        .then(setPrivateResumes)
        .catch(e => alert(e.message))
        .finally(() => setIsLoadingPrivateList(false));
    }
  };

  const togglePrivateFile = (filename: string) => {
    setSelectedPrivateFiles(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const handleDeletePrivateFile = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (!confirm(`确定要从云端永久删除私有文件 [${filename}] 吗？\n删除后不可恢复。`)) return;
    try {
      await api.deletePrivateResume(filename);
      setSelectedPrivateFiles(prev => prev.filter(f => f !== filename));
      setPrivateResumes(prev => prev.filter(f => f.filename !== filename));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadToPrivateCloud = async () => {
    if (uploadedFiles.length === 0) return;
    const names = uploadedFiles.map(f => f.name).join(', ');
    if (!confirm(`即将把 ${uploadedFiles.length} 个文件上传至您的专属云端，请确认？\n\n${names}`)) return;

    try {
      await api.uploadPrivateResumes(uploadedFiles);
      alert("上传云端成功！您之后可以通过'拉取账号私有'随时调取这些文件。");
      setUploadedFiles([]);
    } catch (e) {
      console.error(e);
      alert("上传失败");
    }
  };

  if (phase === 'INGEST') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl space-y-6 flex flex-col items-center">

          {/* Main Dropzone for Local Processing */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn("w-full aspect-[2.5/1] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300", isDragOver ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-white/10 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-white/[0.04]")}
          >
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.zip" onChange={e => { if (e.target.files?.length) { setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]); } }} className="hidden" />
            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300", isDragOver ? "bg-indigo-600 scale-110" : "bg-black border border-white/10")}><UploadCloud className={cn("w-8 h-8", isDragOver ? "text-white" : "text-indigo-400")} /></div>
            <h3 className="text-2xl font-bold text-white mb-2">{isDragOver ? "释放以上传文件" : "拖拽本地简历到这里"}</h3>
            <p className="text-zinc-500 text-sm text-center mb-4">或者 <span className="text-indigo-400 hover:underline">点击选择本地文件</span></p>
          </div>

          <div className="flex gap-4 w-full justify-center mt-2">
            <button onClick={() => handleSelectCloudSource('public')} className={cn("px-6 py-3 border border-white/10 rounded-xl transition-colors text-sm font-bold flex items-center gap-2", usePublicCloud ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-white/5 text-white hover:bg-white/10")}>
              <UploadCloud className={cn("w-4 h-4", usePublicCloud ? "text-emerald-400" : "text-white/50")} /> {usePublicCloud ? "已选定：公有简历池" : "包含公有简历池"}
            </button>
            <button onClick={() => handleSelectCloudSource('private')} className={cn("px-6 py-3 border border-white/10 rounded-xl transition-colors text-sm font-bold flex items-center gap-2", selectedPrivateFiles.length > 0 ? "bg-purple-500/20 text-purple-300 border-purple-500/50" : "bg-white/5 text-white hover:bg-white/10")}>
              <UploadCloud className={cn("w-4 h-4", selectedPrivateFiles.length > 0 ? "text-purple-400" : "text-white/50")} /> {selectedPrivateFiles.length > 0 ? `已选定 ${selectedPrivateFiles.length} 份账号私有简历` : "选择账号私有简历"}
            </button>
          </div>

          <AnimatePresence>
            {isPrivateSelectorOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPrivateSelectorOpen(false)} />
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><UploadCloud className="w-5 h-5 text-purple-400" /> 选择云端私有简历</h3>
                    <button onClick={() => setIsPrivateSelectorOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
                  </div>

                  {isLoadingPrivateList ? (
                    <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-500" />
                      <p>正在扫描账号目录...</p>
                    </div>
                  ) : privateResumes.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {privateResumes.map(r => {
                        const isSelected = selectedPrivateFiles.includes(r.filename);
                        return (
                          <div key={r.filename} onClick={() => togglePrivateFile(r.filename)} className={cn("flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group", isSelected ? "bg-purple-500/10 border-purple-500/50" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30")}>
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isSelected ? "bg-purple-500/20" : "bg-white/5 group-hover:bg-purple-500/10")}>
                                <FileText className={cn("w-5 h-5", isSelected ? "text-purple-400" : "text-zinc-500 group-hover:text-purple-400")} />
                              </div>
                              <div>
                                <div className={cn("text-sm font-bold transition-colors", isSelected ? "text-purple-300" : "text-white group-hover:text-purple-300")}>{r.filename}</div>
                                <div className="text-xs text-zinc-500 mt-1 flex gap-3">
                                  <span>{(r.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <span>{new Date(r.created_at * 1000).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected && <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0"><Check className="w-4 h-4 text-white" /></div>}
                              <button onClick={(e) => handleDeletePrivateFile(e, r.filename)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="删除此云端简历">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                      <Archive className="w-8 h-8 mb-4 opacity-50" />
                      <p>未发现任何云端私有简历 (请先上传 .zip)</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {uploadedFiles.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mt-4 w-full">
              <div className="flex justify-between items-center mb-4"><h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" />已选择本地文件</h4><button onClick={(e) => { e.stopPropagation(); setUploadedFiles([]) }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">清空</button></div>
              <div className="space-y-2 max-h-48 overflow-y-auto">{uploadedFiles.map((file, i) => (<div key={i} className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg group"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center"><FileText className="w-4 h-4 text-indigo-400" /></div><div><div className="text-sm text-white truncate max-w-[200px]">{file.name}</div><div className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</div></div></div><button onClick={(e) => { e.stopPropagation(); setUploadedFiles(prev => prev.filter((_, idx) => idx !== i)) }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"><XCircle className="w-4 h-4" /></button></div>))}</div>
              {uploadProgress > 0 && <div className="mt-4"><div className="h-2 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${uploadProgress}%` }} /></div></div>}
            </motion.div>
          )}

          <div className="flex justify-center gap-4 mt-4">
            <button onClick={startProcessing} disabled={uploadedFiles.length === 0 && !usePublicCloud && selectedPrivateFiles.length === 0} className={cn("px-12 py-4 rounded-2xl font-bold text-base transition-all flex items-center gap-3", (uploadedFiles.length > 0 || usePublicCloud || selectedPrivateFiles.length > 0) ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] active:scale-95" : "bg-white/5 text-zinc-600 cursor-not-allowed")}><Cpu className="w-5 h-5" />提析与匹配</button>
            <button onClick={handleUploadToPrivateCloud} disabled={uploadedFiles.length === 0} className={cn("px-6 py-4 rounded-2xl font-bold text-base transition-all flex items-center", uploadedFiles.length > 0 ? "bg-[#0A0A0B] border border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.1)] active:scale-95 cursor-pointer" : "bg-white/5 text-zinc-600 hidden")}>仅上传至私有库</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'PROCESSING') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-full max-w-3xl bg-black rounded-3xl border border-white/10 p-2 font-mono text-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center rounded-t-2xl"><span className="text-zinc-400 font-bold tracking-wider">AI_PROCESS_LOG</span><div className="flex gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500/20"></span><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></span><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span></div></div>
          <div className="p-8 h-[500px] flex flex-col justify-end items-start space-y-3">{logs.map((log, i) => (<motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-indigo-300/80 flex items-center gap-4"><span className="opacity-30 font-thin text-xs">{(new Date()).toLocaleTimeString()}</span>{log}</motion.div>))}<motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-5 bg-indigo-500 ml-1 rounded-sm" /></div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length)
    : '-';

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-8 relative z-20 overflow-y-auto">
      <div className="grid grid-cols-4 gap-6 mb-12 shrink-0">
        <StatCard label="总简历数" value={processedCount > 0 ? processedCount.toString() : uploadedFiles.length.toString()} icon={<ListFilter className="w-5 h-5 text-zinc-500" />} />
        <StatCard label="AI 面试官" value="Active" icon={<Activity className="w-5 h-5 text-green-500" />} highlight />
        <StatCard label="平均匹配度" value={avgScore.toString()} icon={<Target className="w-5 h-5 text-indigo-500" />} />
      </div>
      <div className="space-y-4 flex-1">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 mb-6 flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>候选人匹配列表 (AI 推荐)</h3>
        {candidates.length > 0 ? (
          candidates.map((c, i) => {
            const isExpanded = expandedId === c.resume_id;
            return (
              <motion.div key={c.resume_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <SpotlightCard className="group rounded-[2rem]">
                  <div onClick={() => setExpandedId(isExpanded ? null : c.resume_id)} className={cn("p-8 cursor-pointer transition-all duration-300 relative z-10", isExpanded ? "bg-white/[0.06] border-b border-white/5" : "hover:bg-white/[0.02]")}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl"></div>
                    <div className="flex gap-10 items-start">
                      <div className="w-28 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-10 py-2"><div className="text-5xl font-black text-white tracking-tighter shadow-indigo-500/50 drop-shadow-lg">{c.score}</div><div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-2 font-bold">Match Score</div></div>
                      <div className="flex-1 space-y-5">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-4"><h4 className="text-3xl font-bold text-white tracking-tight">{c.name}</h4><ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform duration-300", isExpanded && "rotate-180")} /></div></div>
                        <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden group-hover:bg-indigo-500/10 transition-colors"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/30 to-transparent"></div><div className="flex items-center gap-3 text-xs font-black text-indigo-400 uppercase tracking-widest mb-2"><Zap className="w-4 h-4" /> AI 推荐理由</div><p className="text-base text-indigo-100/90 leading-relaxed font-medium font-sans">{c.summary}</p></div>
                        {!isExpanded && <div className="pt-2 pl-2"><div className="text-xs text-zinc-500 font-mono flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-emerald-400/80">原文证据:</span><span className="text-zinc-400 italic">"{c.top_evidence[0]?.quote || 'N/A'}"</span></div></div>}
                      </div>
                      <div className="w-40 shrink-0 flex flex-col gap-3 justify-center border-l border-white/5 pl-10 h-full py-4">
                        <button onClick={(e) => { e.stopPropagation(); onStartInterview(c); }} className="w-full py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg active:scale-95">生成操作</button>
                        <button onClick={(e) => { e.stopPropagation(); setCandidates(prev => prev.filter(x => x.resume_id !== c.resume_id)); }} className="w-full py-3 bg-transparent border border-white/10 text-zinc-400 text-sm font-bold rounded-xl hover:bg-white/5 hover:text-red-400 hover:border-red-500/30 transition-colors active:scale-95">忽略</button>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-6 p-8 bg-black/20 border-t border-white/5">
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> 简历关键信息</h5>
                            <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4 font-sans text-sm">
                              <div className="space-y-1"><span className="text-zinc-600 text-xs">简历原文片段</span><div className="text-zinc-300 leading-relaxed">{c.evidence_quotes.join(' ... ')}</div></div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 完整证据链</h5>
                            <div className="space-y-3 font-sans">
                              {c.top_evidence.map((ev, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                                  <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-indigo-400 uppercase">{ev.criteria}</span></div>
                                  <p className="text-zinc-400 text-xs mb-3 italic">"{ev.quote}"</p>
                                  <p className="text-indigo-200 text-sm">{ev.reasoning}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SpotlightCard>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-zinc-600 py-20">暂无匹配结果</div>
        )}
      </div>
    </div>
  );
}

// --- 4. INTERVIEW PANEL (ACTION GEN) ---
function InterviewPanel({ candidates, cache, setCache }: { candidates: CandidateRank[], cache: Record<string, any>, setCache: React.Dispatch<React.SetStateAction<Record<string, any>>> }) {
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);
  const [actionType, setActionType] = useState<'interview' | 'offer' | 'reject'>('interview');
  // const [contentCache, setContentCache] = useState<Record<string, any>>({}); // Lifted
  const [isLoading, setIsLoading] = useState(false);

  const cacheKey = selectedCandidate ? `${selectedCandidate.resume_id}-${actionType}` : '';
  const generatedContent = cacheKey ? cache[cacheKey] : null;

  useEffect(() => {
    if (candidates.length > 0) setSelectedCandidate(candidates[0]);
  }, [candidates]);

  const handleGenerate = async () => {
    if (!selectedCandidate) return;
    setIsLoading(true);
    try {
      // Need job title from context, mostly passed in or we use placeholder
      const res = await api.generateAction(selectedCandidate.name, actionType, "目标岗位");
      setCache(prev => ({ ...prev, [cacheKey]: res }));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="h-full flex gap-8 p-8 min-h-[600px]">
      {/* Sidebar List */}
      <div className="w-64 shrink-0 border-r border-white/10 pr-6 space-y-4 h-full overflow-y-auto">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">待处理候选人</h3>
        {candidates.map(c => (
          <div key={c.resume_id} onClick={() => setSelectedCandidate(c)} className={cn("p-4 rounded-xl cursor-pointer border transition-all", selectedCandidate?.resume_id === c.resume_id ? "bg-indigo-600 border-indigo-500/50 shadow-lg text-white" : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400")}>
            <div className="font-bold">{c.name}</div>
            <div className="text-xs opacity-70 mt-1">Score: {c.score}</div>
          </div>
        ))}
      </div>

      {/* Action Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex gap-4 mb-8">
          {[{ id: 'interview', label: '面试邀请' }, { id: 'offer', label: 'Offer录用' }, { id: 'reject', label: '遗憾婉拒' }].map(t => (
            <button key={t.id} onClick={() => setActionType(t.id as any)} className={cn("px-6 py-3 rounded-xl font-bold text-sm transition-all border", actionType === t.id ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-2xl p-8 overflow-y-auto shadow-inner relative">
          {!generatedContent && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-600 gap-4">
              <Mail className="w-12 h-12 opacity-20" />
              <p>点击生成以撰写邮件</p>
              <MagneticButton onClick={handleGenerate} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">生成 {actionType.toUpperCase()} 邮件</MagneticButton>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-indigo-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="animate-pulse">AI 正在撰写...</p>
            </div>
          )}

          {generatedContent && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Mail className="w-4 h-4" /> 邮件正文</h4>
                <div className="whitespace-pre-wrap leading-relaxed text-zinc-300 font-serif">{generatedContent.content}</div>
              </div>

              {generatedContent.interview_questions && generatedContent.interview_questions.length > 0 && (
                <div className="bg-indigo-900/10 p-6 rounded-xl border border-indigo-500/20">
                  <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4" /> 建议面试题</h4>
                  <ul className="space-y-3">
                    {generatedContent.interview_questions.map((q: string, i: number) => (
                      <li key={i} className="flex gap-3 text-zinc-300">
                        <span className="text-indigo-500 font-mono text-sm">0{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- UTILS COMPONENTS & HELPERS ---
function MagneticButton({ children, className, ...props }: any) {
  return <button className={className} {...props}>{children}</button>;
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`relative overflow-hidden ${className}`}>{children}</div>;
}

function Label({ icon, text }: { icon: any, text: string }) {
  return <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">{icon}{text}</div>;
}

function StatCard({ label, value, icon, highlight = false }: { label: string, value: string, icon: any, highlight?: boolean }) {
  return (
    <div className={cn("p-6 rounded-2xl border flex items-center gap-4 transition-all hover:scale-105", highlight ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5")}>
      <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black text-white mt-1">{value}</div>
      </div>
    </div>
  );
}
