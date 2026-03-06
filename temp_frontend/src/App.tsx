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
} from './components';
import type { StructuredJD } from './types';
import { INITIAL_JD } from './types';
import type { CandidateRank } from './api';

/**
 * 应用主入口：负责步骤流转与全局布局
 */
export default function JobOSCmdDeck() {
  const [step, setStep] = useState<'IDLE' | 'BRIEFING' | 'JD_REVIEW' | 'DEPLOYED' | 'INTERVIEW_PREP'>('IDLE');
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

  const handleLogin = async (code: string) => {
    // 模拟后端验证延迟
    await new Promise((resolve) => setTimeout(resolve, 800));
    // 简单的内测码校验逻辑（此处可根据需求修改）
    if (code.length < 4) throw new Error('请输入正确的内测码');

    setIsLoggedIn(true);
    setUserCode(code);
    localStorage.setItem('jobos_beta_code', code);
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
    if (step === 'BRIEFING') setStep('IDLE');
    if (step === 'JD_REVIEW') setStep('BRIEFING');
    if (step === 'DEPLOYED') setStep('JD_REVIEW');
    if (step === 'INTERVIEW_PREP') setStep('DEPLOYED');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative">
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
              <LandingPage onStart={handleStart} />
            </motion.div>
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
    </div>
  );
}
