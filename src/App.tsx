import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  UploadCloud,
  XCircle,
  ChevronRight,
  ChevronDown,
  Mail,
  ArrowRight,
  Code2,
  Loader2,
  Activity,
  GitPullRequest,
  Command,
  Cpu,
  Zap,
  CheckCircle2,
  ListFilter,
  ShieldCheck,
  Radar,
  Vote,
  Target,
  ChevronLeft,
  Calendar,
  Send,
  MessageSquare,
  FileText,
  User,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface StructuredJD {
  role: string | null;
  stack: string[];
  exp_level: string;
  culture_fit: string[];
  education: string;
  plus_points: string[];
  remarks: string;
}

interface Evidence {
  requirement: string;
  source_context: string;
  confidence: number;
  reasoning_trace: string;
}

interface Candidate {
  id: string;
  name: string;
  match_score: number;
  tags: string[];
  ai_analysis: string;
  evidence_logs: Evidence[];
  status: 'idle' | 'queued' | 'processed' | 'rejected' | 'interview';
  email: string;
  interview_questions?: string[];
}

// --- CONSTANTS ---
const START_SUGGESTIONS = [
  "寻找一位拥有5年经验的 React 架构师，熟悉 Next.js App Router...",
  "招募一名 Python 后端专家，需要有 LLM 微调和 RAG 实战经验...",
  "急需一位增长黑客，擅长数据分析和 A/B 测试框架搭建..."
];

const INITIAL_JD: StructuredJD = {
  role: null,
  stack: [],
  exp_level: "未指定",
  culture_fit: [],
  education: "未指定",
  plus_points: [],
  remarks: ""
};

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: "张伟",
    match_score: 94,
    tags: ["React核心", "性能优化", "全栈"],
    ai_analysis: "【高置信度】候选人展现了对React内部机制和协调器优化的深刻理解，与目标技术栈高度契合。",
    status: 'idle',
    email: "zhangwei@example.com",
    interview_questions: [
      "请详细描述你在重构遗留仪表盘时遇到的最大并发渲染挑战是什么？",
      "你是如何权衡 Zustand 和 Redux 在大型项目中的选型的？",
      "在 Web Workers 数据处理中，你是如何解决主线程通信开销问题的？"
    ],
    evidence_logs: [
      {
        requirement: "React生态精通",
        source_context: "使用React 18并发特性 + Zustand重构了遗留仪表盘，包体积减少40%。",
        confidence: 98,
        reasoning_trace: "明确提及了高级React 18特性和状态管理优化。"
      },
      {
        requirement: "性能工程",
        source_context: "实现了虚拟列表和Web Workers进行数据处理；TTI从2秒优化至0.8秒。",
        confidence: 92,
        reasoning_trace: "提供了可量化的指标(TTI)支撑优化声明。"
      }
    ]
  },
  {
    id: 'c2',
    name: "李娜",
    match_score: 78,
    tags: ["Vue转React", "高潜力", "代码规范"],
    ai_analysis: "【中等匹配】工程基础扎实，但React深度正在从Vue背景过渡中。「专家级」要求可能存在误判风险。",
    status: 'idle',
    email: "lina@example.com",
    interview_questions: [
      "作为一个Vue转React的开发者，你觉得React的Hooks机制和Vue的Composition API最大的区别是什么？",
      "在Next.js项目中，你是如何处理服务端组件和客户端组件的数据同步的？",
      "能否分享一个你通过改进代码规范显著提升团队效率的案例？"
    ],
    evidence_logs: [
      {
        requirement: "React生态精通",
        source_context: "3年Vue.js经验；使用Next.js/React搭建个人博客学习Hooks模式。",
        confidence: 65,
        reasoning_trace: "检测到迁移学习，但缺乏大规模生产环境React经验。"
      },
      {
        requirement: "计算机基础",
        source_context: "浙江大学计算机科学学士，GPA 3.8/4.0。",
        confidence: 99,
        reasoning_trace: "验证了顶尖教育背景。"
      }
    ]
  }
];

// --- APP COMPONENT ---
export default function JobOSCmdDeck() {
  const [step, setStep] = useState<'IDLE' | 'BRIEFING' | 'DEPLOYED' | 'INTERVIEW_PREP'>('IDLE');
  const [jdData, setJdData] = useState<StructuredJD>(INITIAL_JD);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<Candidate[]>([]);

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
  const handleStart = (roleName: string) => {
    setJdData(prev => ({ ...prev, role: roleName }));
    setStep('BRIEFING');
  };

  const handleBriefComplete = (finalJd: StructuredJD) => {
    setJdData(finalJd);
    setStep('DEPLOYED');
  };

  const handleStartInterviewFlow = (candidate: Candidate) => {
    setShortlistedCandidates(prev => {
      if (prev.find(c => c.id === candidate.id)) return prev;
      return [...prev, candidate];
    });
    setStep('INTERVIEW_PREP');
  };

  const handleBack = () => {
    if (step === 'BRIEFING') setStep('IDLE');
    if (step === 'DEPLOYED') setStep('BRIEFING');
    if (step === 'INTERVIEW_PREP') setStep('DEPLOYED');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/80"></div>
        {/* Ambient Glow */}
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Ambient Glow & Spotlight */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div
          className="absolute inset-0 z-30 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(29, 78, 216, 0.15), transparent 40%)`
          }}
        />
      </div>

      {/* Cyber Navbar */}
      <header className="fixed top-0 w-full z-50 h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl transition-all duration-500">
        <div className="flex items-center gap-4">
          {step !== 'IDLE' && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Command className="w-5 h-5 text-white" />
            </div>
            <div className="tracking-tight leading-tight">
              <div className="font-bold text-white text-lg tracking-tight">JOB OS</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <div className={cn("w-1.5 h-1.5 rounded-full", step === 'IDLE' ? "bg-zinc-600" : "bg-emerald-500")}></div>
            {step === 'IDLE' ? 'System Ready' : 'Pipeline Active'}
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">HR Admin</div>
              <div className="text-[10px] text-zinc-500">Enterprise Plan</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="relative z-10 pt-20 min-h-screen flex flex-col">
        <AnimatePresence mode='wait'>
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

          {step === 'DEPLOYED' && (
            <motion.div
              key="execution"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 overflow-hidden"
            >
              <ExecutionDashboard jd={jdData} onStartInterview={handleStartInterviewFlow} />
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
    </div>
  );
}

// --- 1. LANDING PAGE: THE COMMAND CENTER ---
function LandingPage({ onStart }: { onStart: (role: string) => void }) {
  const [input, setInput] = useState('');
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIdx(prev => (prev + 1) % START_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Central Visual Core */}
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
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400 animate-gradient-x">
            从未如此智能
          </span>
        </h1>
        <p className="text-xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
          将繁琐的初筛工作交给 AI。<br />
          <span className="text-zinc-500 text-base mt-2 block">自动化流水线：岗位澄清 → 简历解析 → 智能排序 → 面试邀约</span>
        </p>
      </div>

      {/* Command Input */}
      <div className="w-full max-w-3xl relative z-20">
        <form
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) onStart(input); }}
          className="relative bg-white/5 border border-white/20 rounded-3xl p-5 flex items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:bg-black/80 focus-within:border-indigo-500/50 group hover:border-indigo-500/30 hover:shadow-[0_0_80px_rgba(99,102,241,0.15)]"
        >
          <div className="pl-6 pr-6 text-indigo-400">
            <Terminal className="w-10 h-10" />
          </div>
          <input
            autoFocus
            className="flex-1 bg-transparent border-none text-white text-3xl h-20 outline-none placeholder:text-zinc-700 font-mono font-bold tracking-tight"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder=""
          />
          {/* Animated Placeholder */}
          {!input && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 text-zinc-600 text-lg pointer-events-none flex items-center font-mono opacity-50">
              <span className="animate-pulse mr-2">_</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={suggestionIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {START_SUGGESTIONS[suggestionIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          <MagneticButton
            type="submit"
            className="bg-white text-black hover:bg-indigo-50 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] px-12 h-20 rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3 whitespace-nowrap active:scale-95 uppercase"
          >
            开始筛选
            <ArrowRight className="w-5 h-5" />
          </MagneticButton>
        </form>

        {/* Agent Status Bar */}
        <div className="mt-10 flex justify-center gap-10 opacity-60">
          {['Resume Reviewer', 'Capability Matcher', 'HR Assistant'].map((agent, i) => (
            <div key={agent} className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-indigo-500/50"></div>
              {agent}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SOCRATIC AI INTERVIEWER ---
// 采用苏格拉底提问法：追问本质、挑战假设、场景化提问、反向验证
const SOCRATIC_INTERVIEW_FLOW = [
  {
    step: 1,
    field: 'role_clarification',
    question: (role: string) =>
      `很高兴为您服务。您提到想招一位 **${role}**，这是个很好的开始。\n\n` +
      `不过，让我先问一个关键问题：**这个人加入后，第一个月需要独立交付什么成果？**\n\n` +
      `请具体描述一个场景。比如：独立搭建后台管理系统、优化现有首页加载速度、接手并维护现有代码库等。`,
    followUp: (input: string) => {
      // 根据用户输入动态生成追问
      if (input.length < 15) {
        return `【追问】您的描述有点简略。请再想一想：如果这个人入职第一周就开始产出，具体会是做什么？这会帮助我精准定位候选人的能力侧重点。`;
      }
      return null; // 不需要追问，进入下一步
    },
    extract: (input: string): Partial<StructuredJD> => ({
      remarks: input // 暂存用户描述的场景
    })
  },
  {
    step: 2,
    field: 'hard_skills',
    question: (_role: string, prev: StructuredJD) =>
      `好的，交付目标是：「${prev.remarks?.slice(0, 50) || '完成核心功能'}」\n\n` +
      `那么问题来了：**要完成这个目标，候选人必须精通的 2-3 项核心技术是什么？**\n\n` +
      `注意：请只列出"没有就绝对不行"的技术，而不是"有了更好"的技术。\n` +
      `这两者的区别很重要 —— 前者是筛选门槛，后者是加分项。`,
    followUp: (input: string, prev: StructuredJD) => {
      const skills = input.split(/[,，、\s]+/).filter(s => s.length > 0);
      if (skills.length > 5) {
        return `【挑战】您列了 ${skills.length} 项技能。坦白说，同时精通这么多技术的候选人非常稀缺。\n\n` +
          `请问：如果只能选 **3 项**，您会保留哪些？哪些其实是"可以入职后再学"的？`;
      }
      if (skills.length === 1) {
        return `【追问】只有一项技术要求？这可能会导致匹配结果过于宽泛。\n\n` +
          `请再想想：完成「${prev.remarks?.slice(0, 30) || '目标任务'}」，还需要什么配套技能？比如框架、工具、或特定领域知识？`;
      }
      return null;
    },
    extract: (input: string): Partial<StructuredJD> => ({
      stack: input.split(/[,，、\s]+/).filter(s => s.length > 0).slice(0, 5)
    })
  },
  {
    step: 3,
    field: 'experience',
    question: (_role: string, prev: StructuredJD) => {
      const hasAdvancedTech = prev.stack.some(s =>
        ['架构', '微服务', 'k8s', 'kubernetes', '分布式', 'infra'].some(k => s.toLowerCase().includes(k))
      );

      if (hasAdvancedTech) {
        return `您提到的技术栈中包含一些高级技术（如 ${prev.stack.slice(0, 2).join('、')}），这通常需要较深的工程经验。\n\n` +
          `**这个岗位需要候选人独立做技术决策吗？还是主要执行已定方案？**\n\n` +
          `这会帮助我判断需要多少年实战经验。`;
      }

      return `技能清单已记录：${prev.stack.join('、')}\n\n` +
        `接下来是一个容易踩坑的问题：**经验年限**。\n\n` +
        `很多公司会机械地写"3-5年"，但其实应该想清楚：是需要有人**带团队/做架构**，还是**执行交付任务**？\n\n` +
        `请告诉我这个岗位的定位：\n` +
        `A. 独立负责模块，需要架构能力\n` +
        `B. 在资深工程师指导下完成任务\n` +
        `C. 纯执行，有人 Code Review`;
    },
    followUp: (input: string) => {
      const lower = input.toLowerCase();
      if (lower.includes('a') || lower.includes('独立') || lower.includes('架构')) {
        return `【反向验证】既然需要独立架构能力，请确认：如果遇到一个技术能力很强但只有 2 年经验的候选人，您会考虑吗？\n\n回答"会"或"不会"。`;
      }
      return null;
    },
    extract: (input: string): Partial<StructuredJD> => {
      const lower = input.toLowerCase();
      let level = "未指定";
      if (lower.includes('a') || lower.includes('独立') || lower.includes('架构') || lower.includes('不会')) {
        level = "高级 (3-5年+)";
      } else if (lower.includes('b') || lower.includes('指导')) {
        level = "中级 (2-3年)";
      } else if (lower.includes('c') || lower.includes('执行') || lower.includes('会')) {
        level = "初级 (1-2年)";
      } else if (lower.includes('实习') || lower.includes('应届')) {
        level = "实习/应届";
      }
      return { exp_level: level };
    }
  },
  {
    step: 4,
    field: 'soft_skills',
    question: (_role: string, prev: StructuredJD) =>
      `技术门槛定好了：${prev.stack.slice(0, 3).join(' + ')}，${prev.exp_level}\n\n` +
      `现在聊聊更难评估但同样重要的：**软技能**。\n\n` +
      `请想象一个场景：候选人入职 3 个月后，你希望同事们怎么评价 TA？\n` +
      `比如："这人沟通特别高效"、"特别能扛事"、"很有产品 sense"。\n\n` +
      `请给我 2-3 个这样的评价。`,
    followUp: (input: string) => {
      const keywords = input.split(/[,，、\s]+/).filter(s => s.length > 1);
      const vague = ['优秀', '厉害', '牛', '强', '好'];
      if (keywords.some(k => vague.includes(k))) {
        return `【挑战】"${keywords.find(k => vague.includes(k))}" 这个描述太模糊了。\n\n` +
          `请具体一点：比如"沟通效率高"、"抗压能力强"、"逻辑清晰"。\n` +
          `模糊的标准会导致面试时无法准确评估。`;
      }
      return null;
    },
    extract: (input: string): Partial<StructuredJD> => ({
      culture_fit: input.split(/[,，、\s]+/).filter(s => s.length > 1).slice(0, 4)
    })
  },
  {
    step: 5,
    field: 'dealbreakers',
    question: (_role: string, prev: StructuredJD) =>
      `软技能预期：${prev.culture_fit.join('、')}\n\n` +
      `**这是最后一个但最容易被忽略的问题。**\n\n` +
      `有没有什么"红线"或"硬伤"？就是：哪种候选人即使技术再好，你也绝对不考虑？\n\n` +
      `例如：\n` +
      `- 频繁跳槽（每份工作不满 1 年）\n` +
      `- 无法接受加班文化\n` +
      `- 远程办公需求\n` +
      `- 特定行业背景要求\n\n` +
      `如果没有特别的红线，回复"无"即可。`,
    followUp: null,
    extract: (input: string): Partial<StructuredJD> => {
      if (input.trim() === "无" || input.trim() === "没有" || input.trim().length < 3) {
        return { plus_points: [] };
      }
      return {
        plus_points: input.split(/[,，、\s]+/).filter(s => s.length > 1).slice(0, 4)
      };
    }
  }
];

// --- 2. SPEC CONFIGURATOR: MISSION BRIEF ---
function SpecConfigurator({ initialUserInput, onComplete }: { initialUserInput: string, onComplete: (jd: StructuredJD) => void }) {
  // 从用户输入中尝试提取岗位关键词
  const extractedRole = initialUserInput.length > 20 ? initialUserInput.slice(0, 20) + '...' : initialUserInput;

  const [formData, setFormData] = useState<StructuredJD>({ ...INITIAL_JD, role: extractedRole, remarks: initialUserInput });
  const [mode, setMode] = useState<'FORM' | 'CHAT'>('CHAT'); // 默认进入 CHAT 模式
  const [isDrafting, setIsDrafting] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [hasProcessedInitialInput, setHasProcessedInitialInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat State - 用户的 Hero 输入作为第一条消息
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'user', text: initialUserInput }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(true); // 初始就在思考

  // 组件挂载时，AI 立即对用户的初始输入进行回应
  useEffect(() => {
    if (!hasProcessedInitialInput && initialUserInput) {
      setHasProcessedInitialInput(true);

      // 模拟 AI 分析用户输入并生成第一个追问
      const timer = setTimeout(() => {
        let aiResponse: string;

        if (initialUserInput.length < 15) {
          // 输入太简略，直接追问场景
          aiResponse = `收到您的需求：「${initialUserInput}」\n\n` +
            `不过这个描述还比较宽泛。让我帮您精准定位：\n\n` +
            `**这个人入职第一个月，需要独立完成什么具体任务？**\n\n` +
            `比如：搭建后台管理系统、优化首页加载速度、接手现有代码库维护等。`;
        } else {
          // 输入较详细，进入技能追问
          aiResponse = `明白了，您的需求是：「${initialUserInput}」\n\n` +
            `这个场景很清晰。接下来关键问题：\n\n` +
            `**要完成这个任务，候选人必须精通的 2-3 项核心技术是什么？**\n\n` +
            `⚠️ 注意：请只列出"没有就绝对不行"的技术，而不是"有了更好"的。`;
          setChatStep(1); // 跳到技能阶段
        }

        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
        setIsAiThinking(false);
      }, 800 + Math.random() * 400);

      return () => clearTimeout(timer);
    }
  }, [initialUserInput, hasProcessedInitialInput]); // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoDraft = () => {
    setIsDrafting(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        stack: ["React", "TypeScript", "Next.js", "Tailwind", "Node.js"],
        exp_level: "高级 (3-5年)",
        culture_fit: ["产品思维", "快速迭代", "Ownership"],
        remarks: "寻找能主导架构设计的核心开发。"
      }));
      setIsDrafting(false);
    }, 1500);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiThinking) return;

    const userInput = chatInput.trim();
    const userMsg = { role: 'user' as const, text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiThinking(true);

    // 获取当前流程步骤
    const currentFlow = SOCRATIC_INTERVIEW_FLOW[chatStep];

    // 仅在非追问状态时提取数据
    let updatedFormData = formData;
    if (!isFollowUp) {
      const extracted = currentFlow.extract(userInput);
      updatedFormData = { ...formData, ...extracted };
      setFormData(updatedFormData);
    }

    // AI Response Logic with Socratic followUp
    setTimeout(() => {
      // 检查是否需要追问
      const followUpFn = currentFlow.followUp;
      if (!isFollowUp && followUpFn) {
        const followUpText = followUpFn(userInput, updatedFormData);
        if (followUpText) {
          // 需要追问，保持在当前步骤
          setMessages(prev => [...prev, { role: 'ai', text: followUpText }]);
          setIsFollowUp(true);
          setIsAiThinking(false);
          return;
        }
      }

      // 没有追问或已完成追问，进入下一步
      setIsFollowUp(false);
      const nextStep = chatStep + 1;

      if (nextStep < SOCRATIC_INTERVIEW_FLOW.length) {
        const nextFlow = SOCRATIC_INTERVIEW_FLOW[nextStep];
        const nextQuestion = nextFlow.question(extractedRole, updatedFormData);
        setMessages(prev => [...prev, { role: 'ai', text: nextQuestion }]);
        setChatStep(nextStep);
      } else {
        // Conversation complete - 生成画像摘要
        const completionMsg = `**人才画像配置完成**\n\n我已根据我们的对话生成了精准的筛选标准：\n\n` +
          `**岗位**: ${updatedFormData.role}\n` +
          `**核心技能**: ${updatedFormData.stack.join(' / ') || '待确认'}\n` +
          `**经验定位**: ${updatedFormData.exp_level}\n` +
          `**软技能**: ${updatedFormData.culture_fit.join('、') || '待确认'}\n` +
          `**红线/加分项**: ${updatedFormData.plus_points.length > 0 ? updatedFormData.plus_points.join('、') : '无特殊要求'}\n\n` +
          `这套标准比传统 JD 更精准，因为它基于**实际交付场景**而非泛泛的技能清单。\n\n` +
          `点击 **「开始筛选」** 继续，或切换 [Commander Form] 微调参数。`;
        setMessages(prev => [...prev, { role: 'ai', text: completionMsg }]);
      }
      setIsAiThinking(false);
    }, 600 + Math.random() * 600);
  };

  return (
    <div className="w-[98%] h-[92vh] max-w-[1900px] relative animate-in fade-in zoom-in-95 duration-500 flex flex-col">
      <div className="absolute -top-16 left-0 right-0 flex justify-center mb-8">
        <div className="flex bg-black/40 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setMode('CHAT')}
            className={cn("px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2", mode === 'CHAT' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-white")}
          >
            <MessageSquare className="w-3.5 h-3.5" /> AI Interviewer
          </button>
          <button
            onClick={() => setMode('FORM')}
            className={cn("px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2", mode === 'FORM' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-white")}
          >
            <FileText className="w-3.5 h-3.5" /> Commander Form
          </button>
        </div>
      </div>

      <div className="glass-dark border border-white/10 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden ring-1 ring-white/5 transition-all duration-500 flex-1 flex flex-col bg-black/80 backdrop-blur-3xl">
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">定义目标画像</h2>
              <p className="text-sm text-zinc-500 font-medium mt-1">
                {mode === 'CHAT' ? "与 AI 助理对话以明确需求" : "手动配置详细的筛选参数"}
              </p>
            </div>
          </div>

          {mode === 'FORM' && (
            <button
              onClick={autoDraft}
              disabled={isDrafting}
              className="flex items-center gap-3 text-indigo-300 text-sm font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-6 py-3 rounded-xl transition-all"
            >
              {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              AI 自动拟定 (Auto-Draft)
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 overflow-hidden flex flex-col">
          {mode === 'FORM' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Left Column: Form */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label icon={<Target className="w-4 h-4" />} text="目标岗位" />
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-zinc-700"
                    value={formData.role || ''}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <Label icon={<Code2 className="w-4 h-4" />} text="核心技能 (Hard Skills)" />
                  <div className="min-h-[140px] p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                    <div className="flex flex-wrap gap-3">
                      {formData.stack.map(s => (
                        <span key={s} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-200 text-sm font-mono border border-indigo-500/30 flex items-center gap-2">
                          {s} <button onClick={() => setFormData(p => ({ ...p, stack: p.stack.filter(x => x !== s) }))}><XCircle className="w-3.5 h-3.5 hover:text-white transition-colors" /></button>
                        </span>
                      ))}
                    </div>
                    <input
                      className="bg-transparent border-none text-base text-white placeholder:text-zinc-700 outline-none w-full font-mono"
                      placeholder="Type skill & press Enter..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setFormData(p => ({ ...p, stack: [...p.stack, val] }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: AI Preview & Remarks */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label icon={<Vote className="w-4 h-4" />} text="团队文化 (Soft Skills)" />
                  <div className="p-6 bg-black/40 border border-white/10 rounded-2xl flex flex-wrap gap-3 min-h-[80px]">
                    {formData.culture_fit.map(s => (
                      <span key={s} className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-sm border border-purple-500/20">
                        {s}
                      </span>
                    ))}
                    {formData.culture_fit.length === 0 && <span className="text-zinc-700 text-sm italic">AI 等待输入...</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label icon={<Command className="w-4 h-4" />} text="补充指令 (Extra)" />
                  <textarea
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-zinc-300 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-mono resize-none leading-relaxed placeholder:text-zinc-700"
                    placeholder="// 告诉 AI 任何特殊的筛选偏好..."
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Chat Area */}
              <div className="col-span-3 flex flex-col bg-white/[0.02] rounded-3xl border border-white/10 overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-4 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10", msg.role === 'ai' ? "bg-indigo-600 text-white" : "bg-white text-black")}>
                        {msg.role === 'ai' ? <BotIcon className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div className={cn("p-6 rounded-3xl text-lg font-medium leading-relaxed max-w-[80%] shadow-2xl", msg.role === 'ai' ? "bg-[#0A0A0B] border border-indigo-500/30 text-indigo-50 rounded-tl-none" : "bg-white text-zinc-900 rounded-tr-none")}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {/* AI Thinking Indicator */}
                  {isAiThinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4 max-w-[90%]"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <BotIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-none bg-indigo-500/10 text-indigo-100">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI 正在分析...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                  <div className="relative">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="输入您的回答..."
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl pl-6 pr-16 py-5 text-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner placeholder:text-zinc-600 transition-all font-medium"
                      autoFocus
                      disabled={isAiThinking}
                    />
                    <button
                      type="submit"
                      disabled={isAiThinking}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {/* Progress Indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    {SOCRATIC_INTERVIEW_FLOW.map((_item, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          idx < chatStep ? "bg-indigo-500" : idx === chatStep ? "bg-indigo-500/50" : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                </form>
              </div>

              {/* Live JSON Preview (AI Brain) */}
              <div className="col-span-1 bg-[#050505] border-l border-white/10 p-8 text-sm overflow-y-auto relative backdrop-blur-md">
                <div className="absolute top-6 right-6 text-indigo-500 animate-pulse">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-zinc-500 font-bold uppercase tracking-[0.2em] mb-8 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  实时岗位画像
                </h3>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">目标岗位</span>
                    <span className="text-white block bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-base font-bold shadow-sm">{formData.role || '—'}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">核心技能</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.stack.length > 0 ? formData.stack.map(s => <span key={s} className="text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]">{s}</span>) : <span className="text-zinc-700 italic"> 等待输入...</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">经验要求</span>
                    <span className={cn("block text-base font-medium", formData.exp_level !== '未指定' ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-zinc-500")}>{formData.exp_level}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">学历要求</span>
                    <span className={cn("block text-base font-medium", formData.education !== '未指定' ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-zinc-500")}>{formData.education}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">软技能</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.culture_fit.length > 0 ? formData.culture_fit.map(s => <span key={s} className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 text-xs">{s}</span>) : <span className="text-zinc-700 italic">...</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold">加分项/红线</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.plus_points.length > 0 ? formData.plus_points.map(s => <span key={s} className="text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 text-xs">{s}</span>) : <span className="text-zinc-700 italic">...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 border-t border-white/5 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono tracking-wider">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
            AGENTS STANDBY
          </div>
          <MagneticButton
            onClick={() => onComplete(formData)}
            className="group bg-white text-black px-10 py-4 rounded-xl font-bold text-base hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
          >
            启动筛选引擎
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}

function Label({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <label className="flex items-center gap-3 text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
      {icon} {text}
    </label>
  );
}

function SpotlightCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string, onClick?: () => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-white/[0.03] border border-white/5 transition-all duration-300",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300 opacity-0 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}



function MagneticButton({ children, className, onClick, type = "button", disabled = false }: any) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      className={className}
      type={type}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

// --- 3. EXECUTION DASHBOARD: WAR ROOM ---
function ExecutionDashboard({ jd: _jd, onStartInterview }: { jd: StructuredJD, onStartInterview: (c: Candidate) => void }) {
  const [phase, setPhase] = useState<'INGEST' | 'PROCESSING' | 'RESULTS'>('INGEST');
  const [logs, setLogs] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Simulation Logic
  useEffect(() => {
    if (phase === 'PROCESSING') {
      const sequence = [
        "[INFO] 正在阅读您上传的简历，理解候选人背景...",
        "[SCAN] 正在比对 [MISSION_BRIEF] 核心需求...",
        "[ANALYSIS] 提取核心能力向量 (技能/经验/潜力)...",
        "[MATCH] 进行多维能力画像匹配...",
        "[RESULT] 发现高潜力候选人 (置信度 > 90%)...",
        "[GENERATE] 正在为您生成推荐理由与面试建议...",
        "[READY] 准备就绪，正在开启人才匹配驾驶舱..."
      ];

      let i = 0;
      const interval = setInterval(() => {
        if (i >= sequence.length) {
          clearInterval(interval);
          setTimeout(() => {
            setCandidates(MOCK_CANDIDATES);
            setPhase('RESULTS');
          }, 1000);
          return;
        }
        setLogs(prev => [...prev, sequence[i]]);
        i++;
      }, 600);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // 文件上传状态
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 50)); // 最多 50 份
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 50));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = () => {
    if (uploadedFiles.length === 0) return;

    // 模拟上传进度
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setPhase('PROCESSING');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  if (phase === 'INGEST') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl space-y-6">
          {/* 拖拽上传区域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full aspect-[2/1] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300",
              isDragOver
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
                : "border-white/10 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-white/[0.04]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
              isDragOver ? "bg-indigo-600 scale-110" : "bg-black border border-white/10"
            )}>
              <UploadCloud className={cn("w-8 h-8", isDragOver ? "text-white" : "text-indigo-400")} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              {isDragOver ? "释放以上传文件" : "拖拽简历到这里"}
            </h3>
            <p className="text-zinc-500 text-sm text-center">
              支持 PDF、PNG、JPG 格式，最多上传 50 份简历<br />
              <span className="text-indigo-400 hover:underline">或点击选择文件</span>
            </p>
          </div>

          {/* 已上传文件列表 */}
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  已选择 {uploadedFiles.length} 份简历
                </h4>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFiles([]); }}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  清空全部
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white truncate max-w-[200px]">{file.name}</div>
                        <div className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 上传进度条 */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>正在解析简历...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 开始按钮 */}
          <div className="flex justify-center">
            <button
              onClick={startProcessing}
              disabled={uploadedFiles.length === 0}
              className={cn(
                "px-12 py-4 rounded-2xl font-bold text-base transition-all flex items-center gap-3",
                uploadedFiles.length > 0
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] active:scale-95"
                  : "bg-white/5 text-zinc-600 cursor-not-allowed"
              )}
            >
              <Cpu className="w-5 h-5" />
              激活与解析简历 ({uploadedFiles.length} 份)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'PROCESSING') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-full max-w-3xl bg-black rounded-3xl border border-white/10 p-2 font-mono text-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center rounded-t-2xl">
            <span className="text-zinc-400 font-bold tracking-wider">AI_THOUGHT_PROCESS</span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/20"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="p-8 h-[500px] flex flex-col justify-end items-start space-y-3">
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-indigo-300/80 flex items-center gap-4">
                <span className="opacity-30 font-thin text-xs">{(new Date()).toLocaleTimeString()}</span>
                {log}
              </motion.div>
            ))}
            <motion.div
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-2 h-5 bg-indigo-500 ml-1 rounded-sm"
            />
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-8 relative z-20 overflow-y-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-6 mb-12 shrink-0">
        <StatCard label="总简历数" value={uploadedFiles.length.toString() || "3"} icon={<ListFilter className="w-5 h-5 text-zinc-500" />} />
        <StatCard label="AI 面试官" value="Active" icon={<Activity className="w-5 h-5 text-green-500" />} highlight />
        <StatCard label="平均匹配度" value="86%" icon={<Target className="w-5 h-5 text-indigo-500" />} />
        <div className="col-span-1 flex justify-end items-center">
          <MagneticButton className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg active:scale-95">
            导出筛选报告
          </MagneticButton>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          候选人匹配列表 (AI 推荐)
        </h3>
        {candidates.length > 0 ? (
          [...candidates].sort((a, b) => b.match_score - a.match_score).map((c, i) => {
            const isExpanded = expandedId === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard className="group rounded-[2rem]">
                  {/* 主卡片区域 */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className={cn(
                      "p-8 cursor-pointer transition-all duration-300 relative z-10",
                      isExpanded ? "bg-white/[0.06] border-b border-white/5" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl"></div>

                    <div className="flex gap-10 items-start">
                      {/* Score Badge */}
                      <div className="w-28 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-10 py-2">
                        <div className="text-5xl font-black text-white tracking-tighter shadow-indigo-500/50 drop-shadow-lg">{c.match_score}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-2 font-bold">Match Score</div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h4 className="text-3xl font-bold text-white tracking-tight">{c.name}</h4>
                            <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform duration-300", isExpanded && "rotate-180")} />
                          </div>
                          <div className="flex gap-2">
                            {c.tags.map(t => <span key={t} className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs text-zinc-400 font-mono tracking-wide">{t}</span>)}
                          </div>
                        </div>

                        <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden group-hover:bg-indigo-500/10 transition-colors">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/30 to-transparent"></div>
                          <div className="flex items-center gap-3 text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                            <Zap className="w-4 h-4" /> AI 推荐理由
                          </div>
                          <p className="text-base text-indigo-100/90 leading-relaxed font-medium font-sans">
                            {c.ai_analysis}
                          </p>
                        </div>

                        {/* Evidence Preview */}
                        {!isExpanded && (
                          <div className="pt-2 pl-2">
                            <div className="text-xs text-zinc-500 font-mono flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-400/80">原文证据:</span>
                              <span className="text-zinc-400 italic">"{c.evidence_logs[0].source_context}"</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="w-40 shrink-0 flex flex-col gap-3 justify-center border-l border-white/5 pl-10 h-full py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartInterview(c); }}
                          className="w-full py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
                        >
                          发送面试
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCandidates(prev => prev.filter(candidate => candidate.id !== c.id));
                          }}
                          className="w-full py-3 bg-transparent border border-white/10 text-zinc-400 text-sm font-bold rounded-xl hover:bg-white/5 hover:text-red-400 hover:border-red-500/30 transition-colors active:scale-95"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 展开的详情面板 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-6 p-8 bg-black/20 border-t border-white/5">
                          {/* 左侧：简历原文高亮 */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              简历关键信息
                            </h5>
                            <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4 font-sans text-sm">
                              <div className="space-y-1">
                                <span className="text-zinc-600 text-xs">联系邮箱</span>
                                <div className="text-indigo-400">{c.email}</div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-zinc-600 text-xs">技能标签</span>
                                <div className="flex flex-wrap gap-2">
                                  {c.tags.map(t => (
                                    <span key={t} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded text-xs border border-indigo-500/20">{t}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-zinc-600 text-xs">核心亮点 (AI 提取)</span>
                                <div className="text-zinc-300 leading-relaxed">
                                  {c.evidence_logs.map(e => e.source_context).join(' · ')}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 右侧：完整证据链 */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" />
                              完整证据链 ({c.evidence_logs.length} 条)
                            </h5>
                            <div className="space-y-3 font-sans">
                              {c.evidence_logs.map((ev, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full" style={{
                                    backgroundColor: ev.confidence > 90 ? 'rgb(52, 211, 153)' : ev.confidence > 70 ? 'rgb(251, 191, 36)' : 'rgb(239, 68, 68)'
                                  }}></div>
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-indigo-400 uppercase">{ev.requirement}</span>
                                    <span className={cn(
                                      "text-xs font-mono px-2 py-0.5 rounded",
                                      ev.confidence > 90 ? "bg-emerald-500/20 text-emerald-400" :
                                        ev.confidence > 70 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                                    )}>
                                      置信度 {ev.confidence}%
                                    </span>
                                  </div>
                                  <p className="text-zinc-300 text-sm leading-relaxed mb-2">
                                    "{ev.source_context}"
                                  </p>
                                  <p className="text-zinc-500 text-xs italic">
                                    💡 {ev.reasoning_trace}
                                  </p>
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
          <FriendlyEmptyState onRetry={() => setPhase('INGEST')} />
        )}
      </div >
    </div >
  );
}

function FriendlyEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 mt-12 bg-white/[0.02] border border-white/5 rounded-3xl p-12">
      <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.15)]">
        <User className="w-10 h-10 text-indigo-400 opacity-60" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white tracking-tight">暂无完美匹配的候选人</h3>
        <p className="text-zinc-400 max-w-md mx-auto text-base leading-relaxed">
          AI 已阅览所有简历，但未发现高度契合的候选人。您可以尝试调整筛选标准（如放宽硬技能要求）。
        </p>
      </div>
      <div className="pt-4">
        <MagneticButton onClick={onRetry} className="bg-white text-black px-10 py-4 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg active:scale-95">
          重新配置标准
        </MagneticButton>
      </div>
    </div>
  );
}

// --- 4. INTERVIEW PANEL: ACTION CENTER ---
function InterviewPanel({ candidates }: { candidates: Candidate[] }) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>(candidates[0]);
  const [activeAction, setActiveAction] = useState<'EMAIL' | 'QUESTIONS'>('EMAIL');

  if (!selectedCandidate) return null;

  return (
    <div className="h-full flex overflow-hidden p-6 gap-6 max-w-[1600px] mx-auto">
      {/* 4.1 Shortlist Sidebar */}
      <div className="w-80 shrink-0 bg-white/[0.02] border border-white/10 rounded-3xl p-6 overflow-y-auto">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <ListFilter className="w-3.5 h-3.5" /> 面试候选队列
        </h3>
        <div className="space-y-2">
          {candidates.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCandidate(c)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-300 border",
                selectedCandidate.id === c.id
                  ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg"
                  : "bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{c.name}</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 font-mono">{c.match_score}%</span>
              </div>
              <div className="text-[10px] text-zinc-500 truncate font-mono">{c.email}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4.2 Action Workspace */}
      <div className="flex-1 bg-black border border-white/10 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
        {/* Candidate Header */}
        <div className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {selectedCandidate.name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{selectedCandidate.name}</h2>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                <span>{selectedCandidate.email}</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                <span>Match Score: {selectedCandidate.match_score}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'EMAIL', label: 'Email Draft', icon: <Mail className="w-4 h-4" /> },
              { id: 'QUESTIONS', label: 'AI Questions', icon: <MessageSquare className="w-4 h-4" /> }
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveAction(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
                  activeAction === tab.id
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            {activeAction === 'EMAIL' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col max-w-3xl mx-auto"
              >
                <EmailComposer candidate={selectedCandidate} />
              </motion.div>
            )}

            {activeAction === 'QUESTIONS' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full max-w-3xl mx-auto"
              >
                <QuestionGenerator candidate={selectedCandidate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EmailComposer({ candidate }: { candidate: Candidate }) {
  const [template, setTemplate] = useState<'INVITE' | 'REJECT'>('INVITE');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const templates = {
    INVITE: {
      subject: `面试邀请 - ${candidate.name}`,
      body: `亲爱的 ${candidate.name}，\n\n我是 [Company Name] 的 AI 招聘助手。很高兴通知您，经过我们要评估，您的经历与我们 [Role Name] 岗位的需求高度契合。\n\n特别是您在 [Key Skill] 方面的经验给我们留下了深刻印象。\n\n我们诚挚邀请您参加下一轮的技术面试，请点击下方链接选择您方便的时间。\n\n祝好，\nRecruiting Team`
    },
    REJECT: {
      subject: `关于您在 [Company Name] 的申请`,
      body: `亲爱的 ${candidate.name}，\n\n感谢您投递 [Role Name] 岗位。经过慎重评估，我们决定暂时不推进此申请。\n\n这并不代表对您能力的否定，我们已将您纳入人才库，未来有合适机会会第一时间联系。\n\n祝您求职顺利！`
    }
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
    }, 1500);
  };

  if (sent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white">邮件发送成功</h3>
        <p className="text-zinc-500">已通知 {candidate.name}。AI 正在监控回复状态。</p>
        <button onClick={() => setSent(false)} className="text-indigo-400 hover:text-indigo-300 text-sm mt-4">发送下一封</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Toggles */}
      <div className="flex gap-3 justify-center mb-8">
        <button
          onClick={() => setTemplate('INVITE')}
          className={cn("px-6 py-2 rounded-full border text-xs font-bold transition-all", template === 'INVITE' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-white/10 text-zinc-500 hover:bg-white/5")}
        >
          面试邀请
        </button>
        <button
          onClick={() => setTemplate('REJECT')}
          className={cn("px-6 py-2 rounded-full border text-xs font-bold transition-all", template === 'REJECT' ? "bg-red-500/20 border-red-500 text-red-400" : "border-white/10 text-zinc-500 hover:bg-white/5")}
        >
          委婉拒绝
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Subject</label>
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" defaultValue={templates[template].subject} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Message Body (AI Generated)</label>
          <textarea
            className="w-full h-64 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-sm leading-relaxed"
            defaultValue={templates[template].body}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSend}
          className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSending ? 'Sending...' : '确认发送'}
        </button>
      </div>
    </div>
  );
}

function QuestionGenerator({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-8">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Interview Copilot</h3>
            <p className="text-xs text-indigo-200/60 mt-0. 5">Based on candidate's weak points and JD requirements</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {candidate.interview_questions?.map((q, i) => (
          <div key={i} className="group p-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all cursor-copy">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Question 0{i + 1}</span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/30 px-2 py-1 rounded">Copy to Clipboard</button>
            </div>
            <p className="text-zinc-200 font-medium leading-relaxed">
              {q}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors">
          <Loader2 className="w-3 h-3" /> Regenerate Questions
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-32 hover:bg-white/[0.04] transition-colors group">
      <div className="flex justify-between items-start">
        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">{label}</span>
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className={cn("text-4xl font-mono font-bold text-white tracking-tighter", highlight && "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]")}>
        {value}
      </div>
    </div>
  );
}

function BotIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  )
}
