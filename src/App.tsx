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
  ListFilter
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

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
}

// --- CONSTANTS ---
const STEPS = ['初始化', '配置', '执行'] as const;
type Step = typeof STEPS[number];

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
    ai_analysis: "高置信度匹配。候选人展现了对React内部机制和协调器优化的深刻理解，与目标技术栈高度契合。",
    status: 'idle',
    email: "zhangwei@example.com",
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
    ai_analysis: "中等匹配度。工程基础扎实，但React深度正在从Vue背景过渡中。「专家级」要求可能存在误判风险。",
    status: 'idle',
    email: "lina@example.com",
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
export default function JobExpressPro() {
  const [step, setStep] = useState<Step>('初始化');
  const [jdData, setJdData] = useState<StructuredJD>(INITIAL_JD);

  // Handlers to transition between steps
  const handleStart = (roleName: string) => {
    setJdData(prev => ({ ...prev, role: roleName }));
    setStep('配置');
  };

  const handleSpecComplete = (finalJd: StructuredJD) => {
    setJdData(finalJd);
    setStep('执行');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px] animate-float"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[150px]"></div>
      </div>

      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>

      {/* Neural Navbar */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform hover:scale-105">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="font-bold text-sm tracking-tight text-white">职通车 <span className="text-indigo-400">AI</span></span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">Professional OS v2.0</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-zinc-500 select-none bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all duration-500",
                step === s ? "text-white bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]" :
                  (STEPS.indexOf(step) > i ? "text-indigo-400" : "text-zinc-600")
              )}>
                <span className="opacity-50">0{i + 1}</span>
                <span className="font-bold uppercase tracking-wider">{s}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-800" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase hidden sm:inline">Engine Active</span>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="pt-14 h-screen relative z-10">
        {step === '初始化' && <LandingPage onStart={handleStart} />}
        {step === '配置' && <SpecConfigurator initialRole={jdData.role || ''} onComplete={handleSpecComplete} />}
        {step === '执行' && <ExecutionDashboard jd={jdData} />}
      </main>
    </div>
  );
}

// --- 1. LANDING PAGE ---
function LandingPage({ onStart }: { onStart: (role: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onStart(input);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative">
      <div className="max-w-4xl w-full z-10 px-4 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold tracking-widest uppercase mb-8 backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Gen Recruiting Framework</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
            <span className="inline-block hover:scale-105 transition-transform cursor-default">像写代码一样</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 animate-shimmer bg-[size:200%_auto]">
              部署招聘流程
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            将非结构化简历转化为可检索的结构化向量。<br />
            利用大规模语言模型进行语义推理，实现毫秒级精准人才匹配。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition duration-700"></div>

          <div className="relative glass rounded-2xl flex items-center p-2.5 transition-all duration-500 focus-within:ring-2 focus-within:ring-indigo-500/50">
            <div className="pl-5 pr-4 text-indigo-400/70">
              <Command className="w-6 h-6" />
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-xl font-mono h-14"
              placeholder="输入目标岗位指令..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="bg-white text-black hover:bg-zinc-200 h-14 px-8 rounded-xl font-bold text-sm transition-all flex items-center gap-3 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              初始化系统 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-8 text-[11px] font-mono text-zinc-500 tracking-tighter uppercase animate-pulse">
            <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> 结构化输出模块就绪</div>
            <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500"></div> 语义匹配引擎在线</div>
            <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500"></div> 逻辑推理链活跃</div>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 2. SPEC CONFIGURATOR ---
function SpecConfigurator({ initialRole, onComplete }: { initialRole: string, onComplete: (jd: StructuredJD) => void }) {
  const [formData, setFormData] = useState<StructuredJD>({
    ...INITIAL_JD,
    role: initialRole
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const autoFillTemplate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        stack: ["React", "TypeScript", "Next.js", "Tailwind", "Node.js"],
        exp_level: "高级 (3-5年)",
        education: "本科及以上 计算机相关专业",
        culture_fit: ["产品思维", "快速迭代", "主人翁意识"],
        plus_points: ["AI/大模型经验", "开源贡献"],
        remarks: "寻找能够主导新AI产品前端架构的候选人。"
      }));
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700">

      {/* Left Panel: Configuration Form */}
      <div className="flex-[2] glass rounded-3xl border border-white/10 flex flex-col relative overflow-hidden group/form">
        {/* Animated Accent */}
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/form:opacity-20 transition-opacity pointer-events-none">
          <Cpu className="w-32 h-32 text-indigo-500 animate-pulse-slow" />
        </div>

        <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/40 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-black text-white font-mono flex items-center gap-3">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              岗位规格配置 <span className="text-[10px] text-zinc-500 font-normal">CONFIG_v2.4</span>
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-2 tracking-wide">定义候选人搜索引擎的核心参数。AI将根据此配置生成筛选逻辑。</p>
          </div>
          <button
            onClick={autoFillTemplate}
            disabled={isGenerating}
            className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />}
            智能填充模板
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormGroup label="岗位名称" icon={<Terminal className="w-3 h-3" />}>
              <input
                value={formData.role || ''}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              />
            </FormGroup>

            <FormGroup label="经验要求" icon={<Activity className="w-3 h-3" />}>
              <select
                value={formData.exp_level}
                onChange={e => setFormData({ ...formData, exp_level: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono appearance-none"
              >
                <option className="bg-zinc-900 text-white">未指定</option>
                <option className="bg-zinc-900 text-white">初级 (1-3年)</option>
                <option className="bg-zinc-900 text-white">高级 (3-5年)</option>
                <option className="bg-zinc-900 text-white">专家/架构师 (5年+)</option>
              </select>
            </FormGroup>
          </div>

          <FormGroup label="核心技术栈" icon={<Code2 className="w-3 h-3" />}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {formData.stack.map(s => (
                <span key={s} className="px-3 py-1.5 glass bg-indigo-500/10 text-indigo-300 text-[11px] rounded-full border border-indigo-500/20 font-mono flex items-center gap-2 hover:bg-indigo-500/20 transition-colors group">
                  {s}
                  <button
                    onClick={() => setFormData({ ...formData, stack: formData.stack.filter(i => i !== s) })}
                    className="text-indigo-500 hover:text-white transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.stack.length === 0 && <span className="text-zinc-600 text-[10px] font-mono italic">等待输入...</span>}
            </div>
            <div className="relative group/input">
              <input
                placeholder="键入技术栈名称后按 [Enter] 添加"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      setFormData(prev => ({ ...prev, stack: [...new Set([...prev.stack, target.value.trim()])] }));
                      target.value = '';
                    }
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-zinc-400">⏎</kbd>
              </div>
            </div>
          </FormGroup>

          <FormGroup label="软技能与文化契合" icon={<Zap className="w-3 h-3" />}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {formData.culture_fit.map(s => (
                <span key={s} className="px-3 py-1.5 glass bg-purple-500/10 text-purple-300 text-[11px] rounded-full border border-purple-500/20 font-mono flex items-center gap-2 hover:bg-purple-500/20 transition-colors">
                  {s}
                  <button onClick={() => setFormData({ ...formData, culture_fit: formData.culture_fit.filter(i => i !== s) })} className="text-purple-500 hover:text-white transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
            <input
              placeholder="例如：自驱动、主人翁意识、快速迭代..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    setFormData(prev => ({ ...prev, culture_fit: [...new Set([...prev.culture_fit, target.value.trim()])] }));
                    target.value = '';
                  }
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
            />
          </FormGroup>

          <FormGroup label="附加说明" icon={<Mail className="w-3 h-3" />}>
            <textarea
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono min-h-[120px] resize-none"
              placeholder="请输入任何需要AI理解的特殊背景、项目要求或团队风格..."
            />
          </FormGroup>
        </div>

        <div className="p-8 border-t border-white/5 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            Ready to compile
          </div>
          <button
            onClick={() => onComplete(formData)}
            className="group/submit neon-border bg-white text-black hover:bg-zinc-200 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden"
          >
            编译并部署引擎
            <ArrowRight className="w-5 h-5 group-hover/submit:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Right Panel: JSON Preview */}
      <div className="flex-1 hidden md:flex flex-col gap-6 font-mono text-[11px]">
        <div className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col flex-1 h-0 transition-transform duration-500 hover:scale-[1.02]">
          <div className="bg-white/10 p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="text-zinc-300 font-bold uppercase tracking-widest">LIVE_SPEC_DATA</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
            </div>
          </div>
          <div className="p-6 text-zinc-500 overflow-y-auto flex-1 font-mono leading-relaxed custom-scrollbar">
            <span className="text-purple-400/80">{"{"}</span>
            <div className="pl-6 space-y-1">
              <div><span className="text-indigo-400">"role"</span>: <span className="text-emerald-400">"{formData.role}"</span>,</div>
              <div><span className="text-indigo-400">"level"</span>: <span className="text-emerald-400">"{formData.exp_level}"</span>,</div>
              <div>
                <span className="text-indigo-400">"stack"</span>: [
                {formData.stack.length > 0 ? (
                  <div className="pl-6">
                    {formData.stack.map((s, idx) => (
                      <div key={s} className="text-amber-300">"{s}"{idx < formData.stack.length - 1 ? ',' : ''}</div>
                    ))}
                  </div>
                ) : <span className="text-zinc-700 italic">...</span>}
                ],
              </div>
              <div>
                <span className="text-indigo-400">"culture"</span>: [
                {formData.culture_fit.length > 0 ? (
                  <div className="pl-6">
                    {formData.culture_fit.map((s, idx) => (
                      <div key={s} className="text-amber-300">"{s}"{idx < formData.culture_fit.length - 1 ? ',' : ''}</div>
                    ))}
                  </div>
                ) : <span className="text-zinc-700 italic">...</span>}
                ]
              </div>
            </div>
            <span className="text-purple-400/80">{"}"}</span>
          </div>
          <div className="p-4 bg-indigo-500/5 border-t border-indigo-500/10">
            <div className="flex items-center gap-3 text-indigo-400 font-bold uppercase tracking-thinnest">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-time Stream Active</span>
            </div>
          </div>
        </div>

        {/* Helper Card */}
        <div className="glass-dark rounded-3xl border border-indigo-500/20 p-6 flex flex-col justify-center gap-4">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-indigo-200">引擎提示</h4>
          <p className="text-zinc-400 leading-tight">系统正在通过本地 LLM 构建岗位向量化索引。建议包含 3 个以上的核心技术栈以提高初步筛选的置信度。</p>
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] uppercase tracking-[0.15em] text-zinc-500 font-black font-mono flex items-center gap-2">
        <span className="p-1 rounded bg-zinc-900 border border-white/5">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

// --- 3. EXECUTION DASHBOARD ---
function ExecutionDashboard({ jd }: { jd: StructuredJD }) {
  const [activeTab, setActiveTab] = useState<'candidates' | 'interview'>('candidates');
  const [phase, setPhase] = useState<'ingest' | 'processing' | 'results'>('ingest');
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (phase === 'processing') {
      setTimeout(() => {
        setCandidates(MOCK_CANDIDATES);
        setPhase('results');
      }, 3500);
    }
  }, [phase]);

  const [interviewCandidates, setInterviewCandidates] = useState<Candidate[]>([]);

  const handleInvite = (c: Candidate) => {
    setInterviewCandidates(prev => [...prev.filter(i => i.id !== c.id), { ...c, status: 'interview' }]);
    setCandidates(prev => prev.map(p => p.id === c.id ? { ...p, status: 'interview' } : p));
  };

  if (activeTab === 'interview') {
    return <InterviewManager candidates={interviewCandidates} onBack={() => setActiveTab('candidates')} />;
  }

  // --- SUB-VIEW: INGEST ---
  if (phase === 'ingest') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="max-w-2xl w-full glass rounded-[2.5rem] p-16 text-center relative overflow-hidden group/ingest">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover/ingest:opacity-100 transition duration-1000"></div>

          <div className="w-24 h-24 bg-gradient-to-b from-indigo-500/20 to-purple-500/5 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl relative border border-white/10 group-hover/ingest:scale-110 transition-transform duration-700">
            <UploadCloud className="w-10 h-10 text-indigo-400 group-hover/ingest:text-white transition-colors" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 font-mono tracking-tighter">导入人才数据源</h2>
          <p className="text-zinc-500 mb-12 font-medium max-w-sm mx-auto leading-relaxed">
            拖拽上传简历文件（支持 PDF/PNG/DOCX）。<br />
            云端引擎将自动执行 OCR 提取与语义向量化。
          </p>

          <button
            onClick={() => setPhase('processing')}
            className="group/btn relative w-full h-16 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-zinc-200 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              [ 执行批量注入作业 ]
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left"></div>
          </button>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW: PROCESSING ---
  if (phase === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center font-mono animate-in fade-in duration-700">
        <div className="w-[450px] space-y-8 glass rounded-3xl p-10 border-indigo-500/20">
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-black">System Status</span>
              <span className="text-sm text-white font-bold">正在执行人才识别流水线...</span>
            </div>
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 animate-progress-loading w-1/3"></div>
          </div>
          <div className="space-y-2 text-[11px] font-mono leading-relaxed">
            <LogLine delay={200} text="> initializing local index connection..." />
            <LogLine delay={1000} text="> analyzing document structure [pdfminer.six]..." />
            <LogLine delay={1800} text="> generating context embeddings [embedding-v3]..." />
            <LogLine delay={2600} text="> running semantic matching sequence..." />
            <LogLine delay={3200} text="> verify evidence chains with high confidence..." />
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW: CANDIDATE LIST ---
  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Stats Bar */}
      <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white font-mono">{jd.role}</h1>
          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono">ID: REF-2024-X9</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-6 font-mono text-xs">
            <div className="text-zinc-500">已处理: <span className="text-white">3</span></div>
            <div className="text-zinc-500">平均匹配度: <span className="text-indigo-400">71%</span></div>
          </div>

          <div className="h-6 w-px bg-white/10"></div>

          <button
            onClick={() => setActiveTab('interview')}
            className="flex items-center gap-2 text-xs font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded transition-all border border-indigo-500/20"
          >
            <ListFilter className="w-3 h-3" />
            流程管理 ({interviewCandidates.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full space-y-2">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          <div className="col-span-1">匹配度</div>
          <div className="col-span-3">候选人</div>
          <div className="col-span-5">AI推理日志</div>
          <div className="col-span-2">标签</div>
          <div className="col-span-1 text-right">操作</div>
        </div>

        {candidates.sort((a, b) => b.match_score - a.match_score).map((candidate) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            onInvite={handleInvite}
          />
        ))}
      </div>
    </div>
  );
}

function LogLine({ text, delay }: { text: string, delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return <div className="h-4 opacity-0 transition-opacity"></div>;
  return <p className="animate-in fade-in slide-in-from-left-4 duration-500 text-indigo-300/80 drop-shadow-[0_0_5px_rgba(99,102,241,0.3)]">{text}</p>;
}

function CandidateRow({ candidate, onInvite }: { candidate: Candidate, onInvite: (c: Candidate) => void }) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]';
    if (score >= 70) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  return (
    <div className={`group glass rounded-3xl transition-all duration-500 ${expanded ? 'bg-white/10 ring-1 ring-white/10 border-transparent scale-[1.01]' : 'hover:bg-white/5 border-white/5'}`}>
      {/* Row Summary */}
      <div className="grid grid-cols-12 gap-6 p-6 items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="col-span-1">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-lg border transition-transform duration-500 group-hover:scale-110 ${getScoreColor(candidate.match_score)}`}>
            {candidate.match_score}
          </div>
        </div>
        <div className="col-span-3">
          <div className="font-black text-lg text-white tracking-tight leading-none mb-2">{candidate.name}</div>
          <div className="text-[10px] font-mono tracking-widest flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              candidate.status === 'interview' ? "bg-indigo-500 animate-pulse" : (candidate.status === 'processed' ? "bg-emerald-500" : "bg-zinc-600")
            )}></span>
            <span className="text-zinc-500 uppercase">{candidate.status === 'idle' ? 'Pending' : (candidate.status === 'interview' ? 'In pipeline' : candidate.status)}</span>
          </div>
        </div>
        <div className="col-span-5 text-xs text-zinc-400 font-mono leading-relaxed line-clamp-2 pr-6 border-l border-white/5 pl-6">
          <span className="text-indigo-400 font-black mr-2 uppercase text-[9px]">[AI_REASONING]</span>
          {candidate.ai_analysis}
        </div>
        <div className="col-span-2 flex flex-wrap gap-2 justify-center">
          {candidate.tags.slice(0, 2).map(t => (
            <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 text-[9px] rounded-full font-black uppercase tracking-wider">
              {t}
            </span>
          ))}
        </div>
        <div className="col-span-1 text-right pr-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ml-auto group-hover:bg-white/10 transition-colors">
            {expanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white" />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-white/5 p-10 bg-black/40 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Logic Trace */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <GitPullRequest className="w-4 h-4 text-indigo-400" /> TRUTH_EVIDENCE_REASONING
              </h4>
              <div className="space-y-4">
                {candidate.evidence_logs.map((log, idx) => (
                  <div key={idx} className="glass-dark border border-white/5 rounded-2xl p-6 font-mono text-xs relative overflow-hidden group/evidence hover:border-indigo-500/20 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50"></div>

                    <div className="flex justify-between mb-4">
                      <span className="text-indigo-300 font-black uppercase tracking-widest">{log.requirement}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${log.confidence}%` }}></div>
                        </div>
                        <span className="text-zinc-500 text-[10px]">{log.confidence}% Confidence</span>
                      </div>
                    </div>
                    <div className="pl-4 border-l border-white/5 space-y-4">
                      <div className="text-zinc-400 italic bg-white/5 p-3 rounded-xl border border-white/5">"{log.source_context}"</div>
                      <div className="text-emerald-400/90 flex items-start gap-3 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><strong className="text-emerald-400 uppercase mr-2 font-black text-[9px]">Proof:</strong> {log.reasoning_trace}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Panel */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Zap className="w-4 h-4 text-yellow-500" /> Quick Tasks
              </h4>
              <div className="glass-dark border border-white/5 p-8 rounded-3xl h-fit space-y-8">
                <div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Status Summary</div>
                  <div className="text-sm text-zinc-200 font-medium leading-relaxed">
                    {candidate.status === 'interview'
                      ? '已处于活跃流程中。AI 正持续监控背景验证动态。'
                      : '系统判定高置信度。建议立即进入技术面试环节。'}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => onInvite(candidate)}
                    disabled={candidate.status === 'interview'}
                    className="w-full h-14 bg-white text-black hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-500/10"
                  >
                    <Mail className="w-4 h-4" />
                    {candidate.status === 'interview' ? '作业已部署' : '发送面试邀请'}
                  </button>
                  <button className="w-full h-14 bg-white/5 border border-red-900/20 text-red-400/80 hover:bg-red-900/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all">
                    <XCircle className="w-4 h-4" />
                    标记不匹配
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. INTERVIEW MANAGER ---
function InterviewManager({ candidates, onBack }: { candidates: Candidate[], onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(candidates[0]?.id || null);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  const handleSendEmail = () => {
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
      setTimeout(() => setEmailStatus('idle'), 2000);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <div className="h-20 border-b border-white/5 px-8 flex items-center gap-8 bg-black/40 backdrop-blur-xl shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group">
          <ArrowRight className="w-5 h-5 rotate-180 text-zinc-400 group-hover:text-white" />
        </button>
        <div className="h-6 w-px bg-white/10"></div>
        <h1 className="text-xl font-black text-white font-mono tracking-tight uppercase">Pipe_Manager <span className="text-indigo-500">v1.2</span></h1>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar List */}
        <div className="w-80 border-r border-white/5 bg-black/20 p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 pl-4">Queue_List</h3>
          {candidates.length === 0 && <div className="text-zinc-600 text-xs px-4 italic py-10 glass rounded-2xl border-dashed border border-white/5">当前无活跃邀请。</div>}
          <div className="space-y-2">
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full text-left px-5 py-5 rounded-2xl transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                  selectedId === c.id
                    ? "glass bg-indigo-500/10 border-indigo-500/40 text-white"
                    : "text-zinc-500 hover:bg-white/5"
                )}
              >
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="font-black tracking-tight">{c.name}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-60">Score: {c.match_score}%</span>
                </div>
                {selectedId === c.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        {selectedCandidate ? (
          <div className="flex-1 p-12 overflow-y-auto flex gap-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent custom-scrollbar">
            {/* Email Composer */}
            <div className="flex-1 space-y-8">
              <div className="glass rounded-[2rem] p-10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-indigo-500/20">
                      <Mail className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight uppercase font-mono">Mail_Service</h3>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Selected Template: OUTREACH_FLOW_v2</span>
                    </div>
                  </div>
                </div>

                <div className="glass-dark border border-white/5 rounded-3xl p-8 space-y-6">
                  <div className="flex gap-4 items-center text-xs pb-4 border-b border-white/5 uppercase font-mono">
                    <span className="text-zinc-600 w-16">To:</span>
                    <span className="text-indigo-300 font-black bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 tracking-wider lowercase">{"<"}{selectedCandidate.email}{">"}</span>
                  </div>
                  <div className="flex gap-4 items-center text-xs pb-4 border-b border-white/5 uppercase font-mono">
                    <span className="text-zinc-600 w-16">Subject:</span>
                    <span className="text-white font-black tracking-tight underline decoration-indigo-500/50 underline-offset-4">面试邀请 - 匹配度 {selectedCandidate.match_score}%</span>
                  </div>
                  <textarea
                    className="w-full bg-transparent border-none text-base text-zinc-400 focus:outline-none font-mono resize-none h-[400px] leading-[1.8] custom-scrollbar"
                    defaultValue={`${selectedCandidate.name} 您好，\n\n我们检测到您的简历与我们的岗位需求高度契合（逻辑匹配度：${selectedCandidate.match_score}%）。特别是您在 ${selectedCandidate.tags[0]} 方面的丰富经验，正是我们目前所大力寻找的高级人才。\n\n我们已阅读了您的全部核心项目代码描述，对其架构策略印象深刻。诚邀您在未来一周内参加我们的线上下一轮技术面试，深入探讨挑战。\n\n祝好,\n职通车 AI 招聘工程部`}
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSendEmail}
                    className="relative group/send h-16 px-12 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all active:scale-95 shadow-xl shadow-white/5"
                  >
                    <span className="relative z-10 flex items-center gap-4">
                      {emailStatus === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 fill-black" />}
                      {emailStatus === 'sending' ? 'Executing...' : (emailStatus === 'sent' ? 'Job Succcess' : 'Send Invite')}
                    </span>
                    <div className="absolute inset-0 bg-indigo-500 scale-x-0 group-hover/send:scale-x-100 transition-transform origin-left duration-500 -z-10 bg-opacity-10 opacity-0 group-hover/send:opacity-100"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="w-[400px] space-y-8">
              <div className="glass rounded-[2rem] p-10 border-indigo-500/20">
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-400" /> Preparation_Kit
                </h3>
                <div className="space-y-8 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-zinc-600 uppercase tracking-widest text-[9px]">Insight Source</span>
                    <div className="text-white font-black text-sm">Deep Semantic Analysis</div>
                  </div>
                  <div className="space-y-4">
                    <div className="glass-dark border border-white/5 p-6 rounded-2xl hover:border-emerald-500/20 transition-all group/kit relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover/kit:scale-150 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <p className="font-black mb-3 text-emerald-400 uppercase tracking-widest">Question: React Core</p>
                      <p className="text-zinc-400 leading-relaxed italic">"询问他们在仪表盘项目中对于并发特性（Concurrent features）的边界处理逻辑。"</p>
                    </div>
                    <div className="glass-dark border border-white/5 p-6 rounded-2xl hover:border-indigo-500/20 transition-all group/kit relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover/kit:scale-150 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                      <p className="font-black mb-3 text-indigo-400 uppercase tracking-widest">Question: Architecure</p>
                      <p className="text-zinc-400 leading-relaxed italic">"为何在特定的包体积优化任务中，选择了 Zustand 而非传统的 Redux 基座？"</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-zinc-600 text-[9px] uppercase tracking-thinner">
                      <span>Index_Integrity</span>
                      <span className="text-emerald-500">Passed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 font-mono gap-6 animate-pulse">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-800"></div>
            <span className="text-[10px] uppercase tracking-[0.4em]">Awaiting selection...</span>
          </div>
        )}
      </div>
    </div>
  );
}
