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
const STEPS = ['init', 'spec', 'exec'] as const;
type Step = typeof STEPS[number];

const INITIAL_JD: StructuredJD = {
    role: null,
    stack: [],
    exp_level: "Unspecified",
    culture_fit: [],
    education: "Unspecified",
    plus_points: [],
    remarks: ""
};

const MOCK_CANDIDATES: Candidate[] = [
    {
        id: 'c1',
        name: "Alex Zhang",
        match_score: 94,
        tags: ["React Core", "Performance", "Fullstack"],
        ai_analysis: "High confidence match. Candidate demonstrates deep understanding of React internals and reconciler optimization. Direct mapping to required stack.",
        status: 'idle',
        email: "alex.z@example.com",
        evidence_logs: [
            {
                requirement: "React Ecosystem Mastery",
                source_context: "Refactored legacy dashboard using React 18 Concurrent Features + Zustand, reducing bundle size by 40%.",
                confidence: 98,
                reasoning_trace: "Explicit mention of advanced React 18 features and state management optimization."
            },
            {
                requirement: "Performance Engineering",
                source_context: "Implemented virtualized lists & web workers for data processing; improved TTI from 2s to 0.8s.",
                confidence: 92,
                reasoning_trace: "Quantifiable metrics (TTI) provided backing the optimization claim."
            }
        ]
    },
    {
        id: 'c2',
        name: "Luna Li",
        match_score: 78,
        tags: ["Vue -> React", "High Potential", "Clean Code"],
        ai_analysis: "Moderate match. Strong engineering fundamentals but specific React depth is transitioning from Vue background. Potential false positive on 'Expert' requirement.",
        status: 'idle',
        email: "luna.li@example.com",
        evidence_logs: [
            {
                requirement: "React Ecosystem Mastery",
                source_context: "3 years Vue.js experience; Built personal blog with Next.js/React to learn hooks pattern.",
                confidence: 65,
                reasoning_trace: "Transferred learning detected, but lacks large-scale production React experience."
            },
            {
                requirement: "CS Fundamentals",
                source_context: "B.S. Computer Science, Zhejiang University. GPA 3.8/4.0.",
                confidence: 99,
                reasoning_trace: "Verified Top-tier education background."
            }
        ]
    }
];

// --- APP COMPONENT ---
export default function JobExpressPro() {
    const [step, setStep] = useState<Step>('init');
    const [jdData, setJdData] = useState<StructuredJD>(INITIAL_JD);

    // Handlers to transition between steps
    const handleStart = (roleName: string) => {
        setJdData(prev => ({ ...prev, role: roleName }));
        setStep('spec');
    };

    const handleSpecComplete = (finalJd: StructuredJD) => {
        setJdData(finalJd);
        setStep('exec');
    };

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>

            {/* Neural Navbar */}
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <Terminal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-mono font-bold text-sm tracking-widest text-white">JOB<span className="text-zinc-500">_OS</span> <span className="text-[10px] text-indigo-400 border border-indigo-500/30 px-1 py-0.5 rounded ml-1">v2.0.0-beta</span></span>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 select-none">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <span className={cn(
                                "transition-colors duration-300 uppercase",
                                step === s ? "text-white font-bold text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]" :
                                    (STEPS.indexOf(step) > i ? "text-zinc-400" : "text-zinc-700")
                            )}>
                                0{i + 1}_{s.toUpperCase()}
                            </span>
                            {i < STEPS.length - 1 && <span className="text-zinc-800">/</span>}
                        </React.Fragment>
                    ))}
                </div>
            </header>

            {/* Main Viewport */}
            <main className="pt-14 h-screen relative z-10">
                {step === 'init' && <LandingPage onStart={handleStart} />}
                {step === 'spec' && <SpecConfigurator initialRole={jdData.role || ''} onComplete={handleSpecComplete} />}
                {step === 'exec' && <ExecutionDashboard jd={jdData} />}
            </main>
        </div>
    );
}

// --- 1. LANDING PAGE ---
// Re-using the aesthetic but hooking up to logic
function LandingPage({ onStart }: { onStart: (role: string) => void }) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) onStart(input);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full z-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-mono mb-4">
                        <Activity className="w-3 h-3" />
                        <span>AI-POWERED RECRUITING ENGINE</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                        Deploy your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">hiring pipeline</span><br />
                        like code.
                    </h1>
                    <p className="text-lg text-zinc-400 font-light max-w-xl mx-auto">
                        Transform unstructured resumes into structured data. <br />
                        Automate screening with semantic reasoning, not keyword matching.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="relative group max-w-2xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-lg flex items-center p-2 shadow-2xl">
                        <div className="pl-4 pr-3 text-zinc-500">
                            <Command className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-lg font-mono h-12"
                            placeholder="Define Target Role (e.g., 'Senior Frontend Engineer')..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2"
                        >
                            Initialize <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="mt-4 flex justify-center gap-6 text-xs font-mono text-zinc-600">
                        <span>[ENTER] to submit</span>
                        <span>Structured Output</span>
                        <span>Evidence-Based</span>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- 2. SPEC CONFIGURATOR (Hybrid of Chat & Form) ---
// Replacing the prompt-only chat with a Sci-fi Form Interface
function SpecConfigurator({ initialRole, onComplete }: { initialRole: string, onComplete: (jd: StructuredJD) => void }) {
    const [formData, setFormData] = useState<StructuredJD>({
        ...INITIAL_JD,
        role: initialRole
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // Auto-fill effect simulation
    const autoFillTemplate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                stack: ["React", "TypeScript", "Next.js", "Tailwind", "Node.js"],
                exp_level: "Senior (3-5y)",
                education: "BS Computer Science or equivalent",
                culture_fit: ["Product-minded", "Fast Iterator", "Ownership"],
                plus_points: ["AI/LLM experience", "Open Source contributions"],
                remarks: "Looking for someone who can lead the frontend architecture for our new AI product."
            }));
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">

            {/* Left Panel: Configuration Form */}
            <div className="flex-1 bg-zinc-900/50 rounded-xl border border-white/10 backdrop-blur-sm flex flex-col relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <Cpu className="w-24 h-24 text-indigo-500" />
                </div>

                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            SPEC_CONFIGURATION
                        </h2>
                        <p className="text-xs text-zinc-500 font-mono mt-1">Define the parameters for the candidate search engine.</p>
                    </div>
                    <button
                        onClick={autoFillTemplate}
                        disabled={isGenerating}
                        className="text-xs font-mono text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 px-3 py-1.5 rounded transition-all flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Code2 className="w-3 h-3" />}
                        AUTO_GENERATE_TEMPLATE
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormGroup label="Role Title">
                            <input
                                value={formData.role || ''}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                            />
                        </FormGroup>

                        <FormGroup label="Experience Level">
                            <select
                                value={formData.exp_level}
                                onChange={e => setFormData({ ...formData, exp_level: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                            >
                                <option>Unspecified</option>
                                <option>Junior (1-3y)</option>
                                <option>Senior (3-5y)</option>
                                <option>Staff/Principal (5y+)</option>
                            </select>
                        </FormGroup>
                    </div>

                    <FormGroup label="Tech Stack (Comma separated)">
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.stack.map(s => (
                                <span key={s} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded border border-indigo-500/30 font-mono flex items-center gap-1 group">
                                    {s}
                                    <button onClick={() => setFormData({ ...formData, stack: formData.stack.filter(i => i !== s) })} className="hover:text-white"><XCircle className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <input
                            placeholder="Type & Enter to add (e.g., React)..."
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    if (target.value.trim()) {
                                        setFormData(prev => ({ ...prev, stack: [...prev.stack, target.value.trim()] }));
                                        target.value = '';
                                    }
                                }
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                        />
                    </FormGroup>

                    <FormGroup label="Culture Fit / Soft Skills">
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.culture_fit.map(s => (
                                <span key={s} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30 font-mono flex items-center gap-1">
                                    {s}
                                    <button onClick={() => setFormData({ ...formData, culture_fit: formData.culture_fit.filter(i => i !== s) })} className="hover:text-white"><XCircle className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <input
                            placeholder="Type & Enter to add..."
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    if (target.value.trim()) {
                                        setFormData(prev => ({ ...prev, culture_fit: [...prev.culture_fit, target.value.trim()] }));
                                        target.value = '';
                                    }
                                }
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                        />
                    </FormGroup>

                    <FormGroup label="Remarks / Extra Context">
                        <textarea
                            value={formData.remarks}
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono min-h-[100px]"
                            placeholder="Any specific context for the AI..."
                        />
                    </FormGroup>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
                    <button
                        onClick={() => onComplete(formData)}
                        className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded font-mono text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                        COMPILE & DEPLOY
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Right Panel: JSON Preview (Visual Feedback) */}
            <div className="w-full md:w-80 hidden md:flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden font-mono text-xs">
                <div className="bg-zinc-900/80 p-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400">spec_preview.json</span>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                    </div>
                </div>
                <div className="p-4 text-zinc-500 overflow-y-auto flex-1 font-mono leading-relaxed">
                    <span className="text-purple-400">{"{"}</span>
                    <div className="pl-4">
                        <span className="text-indigo-400">"role"</span>: <span className="text-green-400">"{formData.role}"</span>,<br />
                        <span className="text-indigo-400">"level"</span>: <span className="text-green-400">"{formData.exp_level}"</span>,<br />
                        <span className="text-indigo-400">"stack"</span>: [<br />
                        {formData.stack.map(s => <span key={s} className="pl-4 text-yellow-200">"{s}",<br /></span>)}
                        ],<br />
                        <span className="text-indigo-400">"culture"</span>: [<br />
                        {formData.culture_fit.map(s => <span key={s} className="pl-4 text-yellow-200">"{s}",<br /></span>)}
                        ]
                    </div>
                    <span className="text-purple-400">{"}"}</span>
                </div>
                <div className="p-3 bg-indigo-500/10 border-t border-indigo-500/20">
                    <p className="text-[10px] text-indigo-300 flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Live Sync Active
                    </p>
                </div>
            </div>
        </div>
    );
}

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold font-mono">{label}</label>
            {children}
        </div>
    );
}

// --- 3. EXECUTION DASHBOARD (Screening & Interview) ---
// Combined dashboard for viewing candidates and managing interview flow
function ExecutionDashboard({ jd }: { jd: StructuredJD }) {
    const [activeTab, setActiveTab] = useState<'candidates' | 'interview'>('candidates');
    const [phase, setPhase] = useState<'ingest' | 'processing' | 'results'>('ingest');
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    // Simulation for file upload
    useEffect(() => {
        if (phase === 'processing') {
            setTimeout(() => {
                setCandidates(MOCK_CANDIDATES);
                setPhase('results');
            }, 3000);
        }
    }, [phase]);

    // Handler for Interview tab actions
    const [interviewCandidates, setInterviewCandidates] = useState<Candidate[]>([]);

    const handleInvite = (c: Candidate) => {
        setInterviewCandidates(prev => [...prev.filter(i => i.id !== c.id), { ...c, status: 'interview' }]);
        // Update local list visual status
        setCandidates(prev => prev.map(p => p.id === c.id ? { ...p, status: 'interview' } : p));
    };

    if (activeTab === 'interview') {
        return <InterviewManager candidates={interviewCandidates} onBack={() => setActiveTab('candidates')} />;
    }

    // --- SUB-VIEW: INGEST ---
    if (phase === 'ingest') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
                <div className="max-w-xl w-full border border-zinc-800 bg-zinc-900/30 rounded-lg p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-700"></div>

                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-xl z-10 relative">
                        <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 font-mono">Ingest Data Source</h2>
                    <p className="text-zinc-500 mb-8 font-mono text-sm">Drag & Drop resumes (PDF/PNG).<br />System will auto-vectorize content.</p>

                    <button
                        onClick={() => setPhase('processing')}
                        className="border border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 text-zinc-300 hover:bg-indigo-500/10 font-mono text-xs py-4 px-8 rounded transition-all uppercase tracking-widest w-full"
                    >
                        [ Select Files from Local Drive ]
                    </button>
                </div>
            </div>
        );
    }

    // --- SUB-VIEW: PROCESSING ---
    if (phase === 'processing') {
        return (
            <div className="h-full flex flex-col items-center justify-center font-mono animate-in fade-in duration-500">
                <div className="w-96 space-y-4">
                    <div className="flex justify-between text-xs text-indigo-400">
                        <span>EXECUTING PIPELINE...</span>
                        <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[progress_3s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
                    </div>
                    <div className="space-y-1 text-[10px] text-zinc-500">
                        <LogLine delay={100} text="> Parsing PDF structures..." />
                        <LogLine delay={800} text="> Generating embeddings (model: text-embedding-3-small)..." />
                        <LogLine delay={1600} text="> Calculating cosine similarity..." />
                        <LogLine delay={2400} text="> Extracting evidence verification chain..." />
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
                        <div className="text-zinc-500">PROCESSED: <span className="text-white">3</span></div>
                        <div className="text-zinc-500">AVG MATCH: <span className="text-indigo-400">71%</span></div>
                    </div>

                    <div className="h-6 w-px bg-white/10"></div>

                    <button
                        onClick={() => setActiveTab('interview')}
                        className="flex items-center gap-2 text-xs font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded transition-all border border-indigo-500/20"
                    >
                        <ListFilter className="w-3 h-3" />
                        MANAGE PROCESS ({interviewCandidates.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                    <div className="col-span-1">Score</div>
                    <div className="col-span-3">Candidate</div>
                    <div className="col-span-5">AI Reasoning Log</div>
                    <div className="col-span-2">Tags</div>
                    <div className="col-span-1 text-right">Action</div>
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

    if (!show) return <div className="h-4"></div>; // placeholder
    return <p className="animate-in fade-in slide-in-from-left-2 duration-300">{text}</p>;
}

function CandidateRow({ candidate, onInvite }: { candidate: Candidate, onInvite: (c: Candidate) => void }) {
    const [expanded, setExpanded] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400 border-green-900/50 bg-green-900/10';
        if (score >= 70) return 'text-indigo-400 border-indigo-900/50 bg-indigo-900/10';
        return 'text-red-400 border-red-900/50 bg-red-900/10';
    };

    return (
        <div className={`group border rounded bg-zinc-900/30 transition-all duration-200 ${expanded ? 'border-indigo-500/30 ring-1 ring-indigo-500/10 bg-zinc-900/80' : 'border-white/5 hover:border-white/10'}`}>
            {/* Row Summary */}
            <div className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="col-span-1">
                    <div className={`w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm border ${getScoreColor(candidate.match_score)}`}>
                        {candidate.match_score}
                    </div>
                </div>
                <div className="col-span-3">
                    <div className="font-bold text-zinc-200">{candidate.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${candidate.status === 'interview' ? 'bg-indigo-500' : (candidate.status === 'processed' ? 'bg-green-500' : 'bg-zinc-600')}`}></span>
                        {candidate.status === 'idle' ? 'Ready' : candidate.status.toUpperCase()}
                    </div>
                </div>
                <div className="col-span-5 text-sm text-zinc-400 line-clamp-2 font-mono text-[11px] leading-relaxed">
                    <span className="text-indigo-400">AI_LOG:</span> {candidate.ai_analysis}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                    {candidate.tags.slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/5 text-zinc-400 text-[10px] rounded font-mono">
                            {t}
                        </span>
                    ))}
                </div>
                <div className="col-span-1 text-right text-zinc-500 group-hover:text-white transition-colors">
                    {expanded ? <ChevronDown className="w-5 h-5 ml-auto" /> : <ChevronRight className="w-5 h-5 ml-auto" />}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-white/5 p-6 bg-black/20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Logic Trace */}
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <GitPullRequest className="w-3 h-3" /> Evidence Verification
                            </h4>
                            <div className="space-y-3">
                                {candidate.evidence_logs.map((log, idx) => (
                                    <div key={idx} className="bg-zinc-950 border border-white/5 rounded p-3 font-mono text-xs relative overflow-hidden">
                                        {/* Confidence Bar */}
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>

                                        <div className="flex justify-between mb-2">
                                            <span className="text-indigo-300 font-bold">{log.requirement}</span>
                                            <span className="text-zinc-500">{log.confidence}% confidence</span>
                                        </div>
                                        <div className="pl-3 border-l border-zinc-800 space-y-2">
                                            <div className="text-zinc-400 italic">"{log.source_context}"</div>
                                            <div className="text-green-500/80 flex items-start gap-2">
                                                <span className="mt-0.5">↳</span>
                                                <span>REASONING: {log.reasoning_trace}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="space-y-4">
                            <div className="bg-zinc-900 border border-white/5 p-4 rounded h-full flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Execute Action</h4>
                                    <div className="text-xs text-zinc-400 mb-4 font-mono">
                                        {candidate.status === 'interview'
                                            ? 'Candidate is already in the interview pipeline.'
                                            : 'Action required: Decide next steps based on AI analysis.'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => onInvite(candidate)}
                                        disabled={candidate.status === 'interview'}
                                        className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Mail className="w-3 h-3" />
                                        {candidate.status === 'interview' ? 'INVITATION_SENT' : 'GENERATE_INVITE'}
                                    </button>
                                    <button className="w-full bg-transparent border border-red-900/30 text-red-400 hover:bg-red-900/10 py-2 rounded text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors">
                                        <XCircle className="w-3 h-3" />
                                        REJECT_CANDIDATE
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
        <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="h-16 border-b border-white/5 px-6 flex items-center gap-4 bg-black/50 backdrop-blur shrink-0">
                <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-lg font-bold text-white font-mono">Interview Pipeline Manager</h1>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar List */}
                <div className="w-64 border-r border-white/5 bg-zinc-900/30 p-4 overflow-y-auto">
                    <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 px-2">Pending Actions</h3>
                    {candidates.length === 0 && <div className="text-zinc-600 text-xs px-2 italic">No candidates selected.</div>}
                    <div className="space-y-1">
                        {candidates.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedId(c.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors flex items-center justify-between group",
                                    selectedId === c.id ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-zinc-400 hover:bg-white/5"
                                )}
                            >
                                <span>{c.name}</span>
                                {selectedId === c.id && <ChevronRight className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* content */}
                {selectedCandidate ? (
                    <div className="flex-1 p-8 overflow-y-auto flex gap-8">
                        {/* Email Composer */}
                        <div className="flex-1 space-y-4">
                            <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-indigo-400" />
                                        Automated Outreach
                                    </h3>
                                    <span className="text-[10px] text-zinc-500 font-mono">TEMPLATE: INVITE_V2</span>
                                </div>

                                <div className="bg-black border border-white/10 rounded-md p-4 space-y-4">
                                    <div className="flex gap-2 text-xs border-b border-white/10 pb-2">
                                        <span className="text-zinc-500 w-12 text-right">To:</span>
                                        <span className="text-zinc-300 font-mono bg-zinc-900 px-2 rounded">{selectedCandidate.email}</span>
                                    </div>
                                    <div className="flex gap-2 text-xs border-b border-white/10 pb-2">
                                        <span className="text-zinc-500 w-12 text-right">Subj:</span>
                                        <span className="text-zinc-300">Interview Invitation - {selectedCandidate.match_score}% Match Found</span>
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent border-none text-sm text-zinc-400 focus:outline-none font-mono resize-none h-48 leading-relaxed"
                                        defaultValue={`Dear ${selectedCandidate.name},\n\nWe detected a high alignment between your profile and our open requirements (Logic match: ${selectedCandidate.match_score}%). Specifically, your experience in ${selectedCandidate.tags[0]} is exactly what we are looking for.\n\nWe'd like to invite you to a technical deep-dive.\n\nBest,\nJobOS AI Recruiting`}
                                    />
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleSendEmail}
                                        className="bg-white text-black px-6 py-2 rounded font-mono text-xs font-bold uppercase hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                    >
                                        {emailStatus === 'sending' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                        {emailStatus === 'sending' ? 'SENDING...' : (emailStatus === 'sent' ? 'SENT SUCCESSFULLY' : 'SEND INVITE')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Assistant */}
                        <div className="w-80 space-y-4">
                            <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
                                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-green-400" />
                                    Interview Prep
                                </h3>
                                <div className="space-y-4">
                                    <div className="text-xs text-zinc-500">Based on candidate's GitHub patterns:</div>
                                    <div className="space-y-2">
                                        <div className="bg-black/40 border-l-2 border-indigo-500 p-3 text-xs text-zinc-300">
                                            <p className="font-bold mb-1 text-indigo-300">Q: React Concurrent Features</p>
                                            "Ask about their specific implementation of Suspense boundaries in the dashboard project."
                                        </div>
                                        <div className="bg-black/40 border-l-2 border-indigo-500 p-3 text-xs text-zinc-300">
                                            <p className="font-bold mb-1 text-indigo-300">Q: State Management</p>
                                            "Why choose Zustand over Redux for this specific bundle size optimization?"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 font-mono text-sm">
                        Select a candidate to proceed
                    </div>
                )}
            </div>
        </div>
    );
}
