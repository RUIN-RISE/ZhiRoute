import { useState, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LandingPage,
  SpecConfigurator,
  JdReviewPanel,
  ExecutionDashboard,
  InterviewPanel,
  LoginModal,
  UserProfilePanel,
  ResumeExplorer,
  ResumeUpload,
  JDHistoryLibrary,
} from './components';
import { CompanyProfileSetup } from './components/CompanyProfile';
import type { StructuredJD } from './types';
import { INITIAL_JD } from './types';
import type { CandidateRank } from './api';
// --- 数据格式强兼容转换防御 ---
const parseLegacyJd = (raw: any): StructuredJD => {
  if (!raw) return INITIAL_JD;

  // 处理旧版可能为纯字符串或对象的薪资
  let remarks = raw.remarks || '';
  if (remarks && typeof remarks === 'string' && remarks.startsWith('{')) {
    try {
      const salaryObj = JSON.parse(remarks);
      const parts: string[] = [];
      if (salaryObj.range && salaryObj.range !== '面议') parts.push(`薪资范围：${salaryObj.range}`);
      if (salaryObj.description) parts.push(salaryObj.description);
      if (salaryObj.tax_type) parts.push(salaryObj.tax_type);
      if (salaryObj.has_bonus) parts.push('含绩效奖金');
      remarks = parts.filter(Boolean).join('，') || '面议';
    } catch { /* 不是 JSON，保持原样 */ }
  }
  if (!remarks && raw.salary) {
    if (typeof raw.salary === 'string') {
      remarks = raw.salary;
    } else if (typeof raw.salary === 'object') {
      const parts: string[] = [];
      if (raw.salary.range && raw.salary.range !== '面议') parts.push(`薪资范围：${raw.salary.range}`);
      if (raw.salary.description) parts.push(raw.salary.description);
      if (raw.salary.tax_type) parts.push(raw.salary.tax_type);
      if (raw.salary.has_bonus) parts.push('含绩效奖金');
      remarks = parts.filter(Boolean).join('，') || '面议';
    }
  }

  return {
    role: raw.role || raw.title || '',
    exp_level: raw.exp_level || raw.experience_level || '',
    education: raw.education || '',
    stack: Array.isArray(raw.stack) ? raw.stack : (Array.isArray(raw.required_skills) ? raw.required_skills : []),
    plus_points: Array.isArray(raw.plus_points) ? raw.plus_points : (Array.isArray(raw.bonus_skills) ? raw.bonus_skills : []),
    culture_fit: Array.isArray(raw.culture_fit) ? raw.culture_fit : [],
    remarks: remarks,
  };
};
import api, { setSessionId } from './api';

/**
 * 应用主入口：负责步骤流转与全局布局
 */
export default function JobOSCmdDeck() {
  const [step, setStep] = useState<'IDLE' | 'RESUME_UPLOAD' | 'RESUME_DB' | 'BRIEFING' | 'JD_REVIEW' | 'DEPLOYED' | 'INTERVIEW_PREP'>('IDLE');
  const [jdData, setJdData] = useState<StructuredJD>(INITIAL_JD);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<CandidateRank[]>([]);

  const [dashboardPhase, setDashboardPhase] = useState<'INGEST' | 'PROCESSING' | 'RESULTS'>('INGEST');
  const [dashboardFiles, setDashboardFiles] = useState<File[]>([]);
  const [dashboardLogs, setDashboardLogs] = useState<string[]>([]);
  const [dashboardCandidates, setDashboardCandidates] = useState<CandidateRank[]>([]);

  // 登录状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jobos_account_name'));
  const [userCode, setUserCode] = useState<string | null>(localStorage.getItem('jobos_account_name'));

  // 历史库状态
  const [showHistoryLib, setShowHistoryLib] = useState(false);
  const [accountHistory, setAccountHistory] = useState<any[]>([]);
  // 公司画像引导
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);

  const loadHistory = async () => {
    try {
      const hist = await api.getAccountHistory();
      setAccountHistory(hist.map((r: any) => ({
        ...r,
        content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content
      })));
    } catch (e) { console.error(e); }
  };

  const handleLogin = async (code: string) => {
    // 调用真实后端验证内测码
    const data = await api.login(code);
    setIsLoggedIn(true);
    setUserCode(data.account_name);
    // 首次登录：若无公司画像则触发引导
    if (!localStorage.getItem('company_profile')) {
      setShowCompanyProfile(true);
    }
    loadHistory();
  };

  const handleDeleteHistory = async (id: string | number) => {
    try {
      await api.deleteHistory(Number(id));
      await loadHistory();
    } catch (e) {
      console.error("Failed to delete history", e);
      alert("删除失败，请重试");
    }
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch (e) { }
    setIsLoggedIn(false);
    setUserCode(null);
    setAccountHistory([]);
    setStep('IDLE');
    setJdData(INITIAL_JD);
    setDashboardCandidates([]);
    setDashboardPhase('INGEST');
    setDashboardFiles([]);
    setDashboardLogs([]);
    setShortlistedCandidates([]);
    localStorage.removeItem('jobos_account_name');
    // 重置 sessionId 以防止会话复用
    setSessionId('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));
  };

  // 登录后启动心跳 + 拉取历史
  useEffect(() => {
    let interval: any;
    if (isLoggedIn) {
      loadHistory();
      api.heartbeat().catch(() => handleLogout());
      interval = setInterval(() => {
        api.heartbeat().catch((e) => {
          console.error(e);
          alert('您的账号在别处登录或遇到错误被迫下线。');
          handleLogout();
        });
      }, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    const savedCode = localStorage.getItem('jobos_account_name');
    if (savedCode) {
      setIsLoggedIn(true);
      setUserCode(savedCode);
    }
  }, []);

  // 自动触发工作区切片存盘 (Debounced)
  useEffect(() => {
    if (!isLoggedIn || dashboardCandidates.length === 0) return;

    const timer = setTimeout(() => {
      api.saveWorkspace(jdData, dashboardCandidates, {}).catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, [dashboardCandidates, isLoggedIn, jdData]);

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    // 外环使用 requestAnimationFrame 做平滑跟随
    let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // CSS 变量供光晕背景使用
      document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
      // 圆点即时跟随
      if (dot) {
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
      }
    };

    // 外环延迟跟随动画
    let raf: number;
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ring) {
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
      }
      raf = requestAnimationFrame(animateRing);
    };
    raf = requestAnimationFrame(animateRing);

    // 悬停可交互元素时放大光标
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, textarea, select, [role="button"], label')) {
        dot?.classList.add('hovering');
        ring?.classList.add('hovering');
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, textarea, select, [role="button"], label')) {
        dot?.classList.remove('hovering');
        ring?.classList.remove('hovering');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleStart = (roleName: string) => {
    setJdData((prev) => ({ ...prev, role: roleName }));
    setStep('BRIEFING');
  };

  const handleBriefComplete = (finalJd: StructuredJD) => {
    setJdData(finalJd);
    setStep('JD_REVIEW');
  };

  const handleJdConfirmed = async (confirmedJd: StructuredJD) => {
    setJdData(confirmedJd);
    try {
      await api.setCurrentJd({
        title: confirmedJd.role || "未命名职位",
        key_responsibilities: [],
        required_skills: confirmedJd.stack || [],
        experience_level: confirmedJd.exp_level || "未指定",
        salary: { range: "", tax_type: "税前", has_bonus: false, description: confirmedJd.remarks || "" },
        work_location: "不限",
        bonus_skills: confirmedJd.plus_points || [],
        education: confirmedJd.education || "未指定",
        culture_fit: confirmedJd.culture_fit || []
      });
    } catch (e) { console.error("Sync JD error", e); }
    setStep('DEPLOYED');
  };

  const handleStartInterviewFlow = (candidate: CandidateRank) => {
    setShortlistedCandidates((prev) => {
      if (prev.find((c) => c.resume_id === candidate.resume_id)) return prev;
      return [...prev, candidate];
    });
    setStep('INTERVIEW_PREP');
  };

  const handleBack = () => {
    if (step === 'RESUME_DB') setStep('IDLE');
    if (step === 'BRIEFING') setStep('IDLE');
    if (step === 'JD_REVIEW') setStep('BRIEFING');
    if (step === 'DEPLOYED') setStep('JD_REVIEW');
    if (step === 'INTERVIEW_PREP') setStep('DEPLOYED');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative">
      {/* 鼠标跟随光晕 */}
      <div className="mouse-glow" />
      {/* 自定义光标 */}
      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorRingRef} className="cursor-ring" />

      {/* 极简导航栏 */}
      <header className="fixed top-0 w-full z-50 h-20 px-10 flex items-center justify-between transition-all duration-500">
        <div className="flex items-center gap-4">
          {step !== 'IDLE' && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors text-zinc-500 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="JobOS" className="w-8 h-8 object-contain" />
            <div className="tracking-tight leading-tight">
              <div className="font-semibold text-white text-[22px] tracking-tight">JobOS</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 relative">
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs text-zinc-400 font-medium">System Ready</span>
            </div>
          )}

          {isLoggedIn && <div className="hidden md:block w-px h-5 bg-white/10" />}

          {/* 顶栏独立的历史资产按钮 */}
          {isLoggedIn && (
            <button
              onClick={() => setShowHistoryLib(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              候选人资产库
            </button>
          )}

          {isLoggedIn && <div className="hidden md:block w-px h-5 bg-white/10" />}

          <UserProfilePanel
            isLoggedIn={isLoggedIn}
            userCode={userCode}
            onLogout={handleLogout}
            onLoginClick={() => setShowLoginModal(true)}
            jdHistory={accountHistory.filter(r => r.record_type === 'jd')}
            onDeleteHistory={handleDeleteHistory}
            onSelectJD={(id) => {
              const hit = accountHistory.find(r => r.id === id);
              if (hit) {
                const raw = typeof hit.content === 'string' ? JSON.parse(hit.content) : hit.content;
                setJdData(parseLegacyJd(raw));
                // 强制触发一次重渲染，避免同页面组件在 HMR 或深比较下无法挂载新内容
                setStep('IDLE');
                setTimeout(() => setStep('JD_REVIEW'), 10);
              }
            }}
          />
        </div>
      </header>

      {/* 主内容区 */}
      <main className="relative z-10 pt-20 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'IDLE' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col"
            >
              <LandingPage onStart={handleStart} onOpenResumes={() => setStep('RESUME_UPLOAD')} isLoggedIn={isLoggedIn} />
            </motion.div>
          )}
          {step === 'RESUME_UPLOAD' && (
            <motion.div
              key="resume_upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 w-full"
            >
              <ResumeUpload
                onComplete={() => setStep('RESUME_DB')}
              />
            </motion.div>
          )}
          {step === 'RESUME_DB' && (
            <ResumeExplorer
              key="resume_db"
              onBack={handleBack}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => setShowLoginModal(true)}
              onStartJobFlow={(hint) => {
                if (hint) setJdData(prev => ({ ...prev, role: hint }));
                setStep('BRIEFING');
              }}
              resumes={dashboardCandidates.map(c => ({
                id: c.resume_id || String(Math.random()),
                name: c.name || "未知候选人",
                title: jdData.role || "匹配候选人",
                match: c.score || 0,
                exp: "见简历详情",
                edu: "见简历详情",
                location: "未提供",
                skills: c.top_evidence ? c.top_evidence.map((e: any) => e.criteria) : [],
                summary: c.summary || "暂无摘要",
                evidence: c.top_evidence || []
              }))}
            />
          )}
          {step === 'BRIEFING' && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center p-2 w-full h-full"
            >
              <SpecConfigurator initialUserInput={jdData.role || ''} onComplete={handleBriefComplete} />
            </motion.div>
          )}
          {step === 'JD_REVIEW' && (
            <motion.div
              key="jd_review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col items-center justify-center p-4"
            >
              <JdReviewPanel jd={jdData} onConfirm={handleJdConfirmed} />
            </motion.div>
          )}
          {step === 'DEPLOYED' && (
            <motion.div
              key="execution"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 overflow-hidden"
            >
              <ExecutionDashboard
                jd={jdData}
                onStartInterview={handleStartInterviewFlow}
                phase={dashboardPhase}
                setPhase={setDashboardPhase}
                files={dashboardFiles}
                setFiles={setDashboardFiles}
                logs={dashboardLogs}
                setLogs={setDashboardLogs}
                candidates={dashboardCandidates}
                setCandidates={setDashboardCandidates}
              />
            </motion.div>
          )}
          {step === 'INTERVIEW_PREP' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="flex-1 overflow-hidden h-full"
            >
              <InterviewPanel candidates={shortlistedCandidates} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* 首次登录公司画像引导 */}
      {showCompanyProfile && (
        <CompanyProfileSetup
          onComplete={() => setShowCompanyProfile(false)}
        />
      )}

      <AnimatePresence>
        {showHistoryLib && (
          <JDHistoryLibrary
            history={accountHistory.filter(r => r.record_type === 'workspace')}
            onClose={() => setShowHistoryLib(false)}
            onDelete={handleDeleteHistory}
            onSelectJD={(id) => {
              const hit = accountHistory.find(r => r.id === id);
              if (hit) {
                const raw = typeof hit.content === 'string' ? JSON.parse(hit.content) : hit.content;
                const jdRaw = hit.record_type === 'workspace' ? (raw?.jd_data ?? raw) : raw;
                const cands = raw?.candidates || [];
                setJdData(parseLegacyJd(jdRaw));
                setDashboardCandidates(cands);
                setStep('RESUME_DB');
                setShowHistoryLib(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
