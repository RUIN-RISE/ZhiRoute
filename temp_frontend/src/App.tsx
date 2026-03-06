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
import { mockHistory } from './components/JDHistoryLibrary';
import type { StructuredJD } from './types';
import { INITIAL_JD } from './types';
import type { CandidateRank } from './api';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);

  // 历史库状态
  const [showHistoryLib, setShowHistoryLib] = useState(false);
  // 公司画像引导
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);

  const handleLogin = async (code: string) => {
    // 模拟后端验证延迟
    await new Promise((resolve) => setTimeout(resolve, 800));
    // 简单的内测码校验逻辑（此处可根据需求修改）
    if (code.length < 4) throw new Error('请输入正确的内测码');

    setIsLoggedIn(true);
    setUserCode(code);
    localStorage.setItem('jobos_beta_code', code);
    // 首次登录：若无公司画像则触发引导
    if (!localStorage.getItem('company_profile')) {
      setShowCompanyProfile(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserCode(null);
    localStorage.removeItem('jobos_beta_code');
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('jobos_beta_code');
    if (savedCode) {
      setIsLoggedIn(true);
      setUserCode(savedCode);
    }
  }, []);

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

  const handleJdConfirmed = (confirmedJd: StructuredJD) => {
    setJdData(confirmedJd);
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
          {/* 顶栏独立的历史资产按钮 */}
          {isLoggedIn && (
            <button
              onClick={() => setShowHistoryLib(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              资产库
            </button>
          )}

          <UserProfilePanel
            isLoggedIn={isLoggedIn}
            userCode={userCode}
            onLogout={handleLogout}
            onLoginClick={() => setShowLoginModal(true)}
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
            onClose={() => setShowHistoryLib(false)}
            onSelectJD={(jdId) => {
              console.log('Selected history JD:', jdId);
              setShowHistoryLib(false);
              const historyTarget = mockHistory.find(h => h.id === jdId);
              const roleName = historyTarget ? historyTarget.roleName : '未知项目';
              setJdData({ ...INITIAL_JD, role: `恢复项目归档：${roleName}` });
              setStep('JD_REVIEW');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
