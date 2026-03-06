import React, { useState, useRef } from 'react';
import {
    UploadCloud,
    XCircle,
    Cpu,
    CheckCircle2,
    Activity,
    FileText,
    Terminal,
    Target,
    ChevronDown,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { SpotlightCard, StatCard } from './shared';
import api from '../api';
import type { CandidateRank } from '../api';
import type { StructuredJD } from '../types';

interface DashboardProps {
    jd: StructuredJD;
    onStartInterview: (c: CandidateRank) => void;
    phase: 'INGEST' | 'PROCESSING' | 'RESULTS';
    setPhase: (p: 'INGEST' | 'PROCESSING' | 'RESULTS') => void;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    logs: string[];
    setLogs: React.Dispatch<React.SetStateAction<string[]>>;
    candidates: CandidateRank[];
    setCandidates: React.Dispatch<React.SetStateAction<CandidateRank[]>>;
}

/**
 * 简历分析执行仪表盘：上传 → 处理 → 结果展示 (Apple Pro 设计标准)
 */
export function ExecutionDashboard({
    jd: _jd,
    onStartInterview,
    phase,
    setPhase,
    files: uploadedFiles,
    setFiles: setUploadedFiles,
    logs,
    setLogs,
    candidates,
    setCandidates,
}: DashboardProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processedCount, setProcessedCount] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter(
            (f) =>
                f.type === 'application/pdf' ||
                f.name.endsWith('.pdf') ||
                f.name.endsWith('.txt') ||
                f.name.endsWith('.md') ||
                f.name.endsWith('.zip')
        );
        if (files.length > 0) setUploadedFiles((prev) => [...prev, ...files].slice(0, 50));
    };

    const startProcessing = async () => {
        if (uploadedFiles.length === 0) return;

        setUploadProgress(0);
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
            setPhase('PROCESSING');
            setLogs((prev) => [...prev, '[INFO] 上传简历中...']);

            const resultResumes = await api.uploadMultipleResumes(uploadedFiles);
            setProcessedCount(resultResumes.length);
            setLogs((prev) => [
                ...prev,
                `[SUCCESS] 简历上传完成，共解析 ${resultResumes.length} 份简历...`,
            ]);

            setLogs((prev) => [...prev, '[ANALYSIS] 正在进行多维能力画像匹配... (可能需要1-2分钟)']);
            setUploadProgress(100);
            clearInterval(progressInterval);

            const ranks = await api.analyzeResumes();
            setLogs((prev) => [...prev, `[RESULT] 完成分析，发现 ${ranks.length} 位高潜力候选人。`]);

            setTimeout(() => {
                setCandidates(ranks);
                setPhase('RESULTS');
            }, 1000);
        } catch (e) {
            clearInterval(progressInterval);
            setLogs((prev) => [...prev, `[ERROR] 处理失败: ${e}`]);
            alert('处理失败，请重试');
            setPhase('INGEST');
        }
    };

    // ---- 阶段一：上传 (Apple Pro 风格升级) ----
    if (phase === 'INGEST') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

                <div className="w-full max-w-4xl space-y-10 relative z-10 flex flex-col">
                    <div className="text-center space-y-4 mb-2">
                        <h2 className="text-5xl font-bold text-white tracking-tight">上传人才档案</h2>
                        <p className="text-zinc-500 text-lg font-medium">支持 PDF, TXT 或 ZIP 格式的简历包</p>
                    </div>

                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'w-full aspect-[2.2/1] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.06] rounded-[3.5rem] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-700 group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]',
                            isDragOver
                                ? 'border-blue-500/40 bg-blue-500/[0.03] scale-[1.01] shadow-[0_0_60px_rgba(59,130,246,0.1)]'
                                : 'hover:border-white/10 hover:bg-white/[0.04]'
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.txt,.md,.zip"
                            onChange={(e) => {
                                if (e.target.files?.length)
                                    setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                            }}
                            className="hidden"
                        />

                        <div className="relative">
                            <div className={cn(
                                'absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl transition-opacity duration-500',
                                isDragOver ? 'opacity-100' : 'opacity-0'
                            )} />
                            <div className={cn(
                                'w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative z-10 transition-all duration-700 border border-white/5 bg-zinc-900/60 shadow-2xl',
                                isDragOver ? 'scale-110' : 'group-hover:scale-105'
                            )}>
                                <UploadCloud className={cn('w-10 h-10 transition-colors duration-500', isDragOver ? 'text-blue-400' : 'text-zinc-400 group-hover:text-blue-400/80')} />
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                {isDragOver ? '释放以上传' : '点击或拖拽档案至此'}
                            </h3>
                            <p className="text-zinc-500 text-sm font-semibold tracking-widest uppercase opacity-60">
                                神经算力匹配终端
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {uploadedFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="bg-[#1c1c1e]/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/[0.05] p-8 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        已就绪 {uploadedFiles.length} 份档案
                                    </h4>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUploadedFiles([]);
                                        }}
                                        className="text-xs text-zinc-500 hover:text-white transition-colors font-bold uppercase tracking-widest"
                                    >
                                        清除全部
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                                    {uploadedFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between py-4 px-6 bg-white/[0.02] border border-white/[0.03] rounded-[1.25rem] group hover:bg-white/[0.04] transition-all"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                                    <FileText className="w-5 h-5 text-blue-400/80" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-zinc-200 truncate">{file.name}</div>
                                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-2"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {uploadProgress > 0 && (
                                    <div className="mt-8 px-2">
                                        <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                            <span className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-current rounded-full animate-ping" />
                                                正在同步集群数据...
                                            </span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.03]">
                                            <motion.div
                                                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-center pt-6">
                        <button
                            onClick={startProcessing}
                            disabled={uploadedFiles.length === 0}
                            className={cn(
                                'px-16 py-5 rounded-2xl font-bold text-lg transition-all duration-500 flex items-center gap-4 shadow-2xl tracking-tight',
                                uploadedFiles.length > 0
                                    ? 'bg-white text-black hover:bg-[#f5f5f7] hover:scale-105 active:scale-95 shadow-[0_30px_60px_-12px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 text-zinc-700 cursor-not-allowed border border-white/5 opacity-50'
                            )}
                        >
                            <Cpu className="w-6 h-6" />
                            启动推荐算力匹配
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- 阶段二：处理中 (Apple Pro 风格升级) ----
    if (phase === 'PROCESSING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none animate-pulse" />

                <div className="w-full max-w-4xl bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-[3rem] p-2 border border-white/[0.08] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-1000 relative z-10">
                    <div className="bg-white/[0.02] px-10 py-6 border-b border-white/[0.04] flex justify-between items-center rounded-t-[2.8rem]">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-blue-500/80 animate-spin" />
                            </div>
                            <span className="text-zinc-200 font-bold tracking-[0.1em] text-sm uppercase">JobOS 算力匹配核心</span>
                        </div>
                        <div className="flex gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-white/5" />
                            <span className="w-3 h-3 rounded-full bg-white/5 shadow-inner" />
                            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" />
                        </div>
                    </div>
                    <div className="p-10 h-[550px] bg-black/40 flex flex-col justify-end items-start space-y-4 rounded-b-[2.8rem] overflow-hidden relative">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none opacity-40" />

                        <div className="w-full flex-1 overflow-y-auto custom-scrollbar-hidden flex flex-col justify-end gap-5 py-4">
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.98, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    className="flex items-center gap-6 group"
                                >
                                    <span className="w-24 text-[10px] font-mono text-zinc-700 font-bold uppercase tracking-tighter shrink-0 pt-0.5">
                                        {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <div className={cn(
                                        "flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all text-[13px] font-medium leading-none",
                                        log.includes('SUCCESS') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                                            log.includes('ERROR') ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                                log.includes('RESULT') ? 'bg-blue-500/10 border-blue-500/30 text-white font-bold' :
                                                    'bg-white/[0.02] border-white/[0.05] text-zinc-400'
                                    )}>
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            log.includes('SUCCESS') ? 'bg-emerald-500/60' :
                                                log.includes('ERROR') ? 'bg-red-500/60' :
                                                    log.includes('RESULT') ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                        'bg-zinc-700'
                                        )} />
                                        {log}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div
                            animate={{ opacity: [0, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="w-2.5 h-6 bg-blue-500 ml-[120px] rounded-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ---- 阶段三：结果 (Apple Pro 风格升级) ----
    const avgScore =
        candidates.length > 0
            ? Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length)
            : '-';

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto p-12 relative z-20 overflow-y-auto custom-scrollbar animate-fadeIn">
            <div className="grid grid-cols-3 gap-8 mb-16 shrink-0">
                <StatCard
                    label="解析档案总数"
                    value={processedCount > 0 ? processedCount.toString() : uploadedFiles.length.toString()}
                    icon={<FileText className="w-5 h-5 text-zinc-500" />}
                />
                <StatCard
                    label="匹配逻辑核心"
                    value="状态良好"
                    icon={<Activity className="w-5 h-5 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />}
                    highlight
                />
                <StatCard
                    label="平均拟合分值"
                    value={avgScore.toString()}
                    icon={<Target className="w-5 h-5 text-white opacity-40" />}
                />
            </div>

            <div className="space-y-6 flex-1">
                <div className="flex items-center justify-between mb-10 px-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-4">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                        智选匹配队列 · Intelligence Output
                    </h3>
                    <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-4 uppercase tracking-tighter">
                        <span>Ranked by Core Vector Similarity</span>
                        <div className="w-px h-3 bg-white/10" />
                        <span>Sort: Precision Descending</span>
                    </div>
                </div>

                {candidates.length > 0 ? (
                    candidates.map((c, i) => {
                        const isExpanded = expandedId === c.resume_id;
                        return (
                            <motion.div
                                key={c.resume_id}
                                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <SpotlightCard className="group rounded-[2.5rem] p-0 overflow-hidden border border-white/[0.08] bg-[#1c1c1e]/30 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.6)] transition-all duration-700">
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : c.resume_id)}
                                        className={cn(
                                            'p-10 cursor-pointer transition-all duration-700 relative z-10',
                                            isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.04]'
                                        )}
                                    >
                                        <div className="flex gap-14 items-stretch">
                                            <div className="w-36 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-14">
                                                <div className="text-[4.5rem] font-bold text-white tracking-tighter leading-none mb-4 tabular-nums">
                                                    {c.score}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap opacity-60">
                                                    拟合系数
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <h4 className="text-3xl font-bold text-white tracking-tight">{c.name}</h4>
                                                        <div className="flex gap-2">
                                                            {c.top_evidence.slice(0, 2).map((ev, idx) => (
                                                                <span key={idx} className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-full text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                                                    {ev.criteria}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <ChevronDown
                                                        className={cn(
                                                            'w-6 h-6 text-zinc-600 transition-all duration-700 ease-in-out',
                                                            isExpanded && 'rotate-180 text-white'
                                                        )}
                                                    />
                                                </div>

                                                <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-[1.75rem] transition-all group-hover:bg-white/[0.04] group-hover:border-white/[0.1]">
                                                    <p className="text-[16px] text-zinc-300 leading-relaxed font-medium">
                                                        {c.summary}
                                                    </p>
                                                </div>

                                                {!isExpanded && c.top_evidence[0] && (
                                                    <div className="flex items-center gap-4 text-[11px] font-medium text-zinc-500 font-sans">
                                                        <div className="flex items-center gap-2 text-emerald-500/80 font-bold uppercase tracking-wider bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            核心匹配
                                                        </div>
                                                        <span className="italic opacity-60 truncate max-w-[500px]">
                                                            &quot;{c.top_evidence[0].quote}&quot;
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-48 shrink-0 flex flex-col gap-4 justify-center border-l border-white/5 pl-14">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStartInterview(c);
                                                    }}
                                                    className="w-full py-4.5 bg-white text-black text-sm font-bold tracking-widest uppercase rounded-2xl hover:bg-[#f5f5f7] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
                                                >
                                                    锁定人选
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCandidates((prev) => prev.filter((x) => x.resume_id !== c.resume_id));
                                                    }}
                                                    className="w-full py-4.5 bg-white/[0.03] border border-white/[0.08] text-zinc-500 text-sm font-bold tracking-widest uppercase rounded-2xl hover:bg-white/[0.06] hover:text-white transition-all active:scale-95"
                                                >
                                                    暂不考虑
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden bg-black/40"
                                            >
                                                <div className="grid grid-cols-2 gap-12 p-14 border-t border-white/[0.06] relative">
                                                    <div className="space-y-6">
                                                        <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                                            <FileText className="w-4 h-4 text-blue-500/80" /> 原始语义提取
                                                        </h5>
                                                        <div className="bg-zinc-900/60 border border-white/[0.04] shadow-inner rounded-[2rem] p-8 font-sans">
                                                            <div className="space-y-4">
                                                                <div className="text-zinc-300 leading-loose max-h-[350px] overflow-y-auto custom-scrollbar pr-6 text-[14px]">
                                                                    {c.evidence_quotes.map((q, idx) => (
                                                                        <span key={idx} className="inline-block mb-4 p-4 bg-white/[0.02] border border-white/[0.03] rounded-xl hover:bg-white/[0.04] transition-colors">
                                                                            {q}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                                            <ShieldCheck className="w-4 h-4 text-emerald-500/80" /> 算力匹配逻辑链
                                                        </h5>
                                                        <div className="space-y-5 max-h-[450px] overflow-y-auto custom-scrollbar pr-4">
                                                            {c.top_evidence.map((ev, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-7 relative overflow-hidden group/ev transition-all hover:bg-white/[0.03]"
                                                                >
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/10 rounded-lg">
                                                                            {ev.criteria}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-zinc-400 text-sm mb-4 leading-relaxed font-serif italic border-l-2 border-white/10 pl-5">
                                                                        &quot;{ev.quote}&quot;
                                                                    </p>
                                                                    <p className="text-zinc-200 text-[14px] leading-relaxed font-medium">
                                                                        {ev.reasoning}
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
                    <div className="flex flex-col items-center justify-center p-32 text-center bg-white/[0.01] border border-dashed border-white/[0.08] rounded-[3.5rem] mt-10">
                        <Terminal className="w-16 h-16 text-zinc-800 mb-6" />
                        <span className="text-zinc-600 font-bold tracking-[0.3em] text-sm uppercase">尚未检测到匹配信号</span>
                        <p className="text-zinc-700 mt-4 text-xs font-medium">请确保已上传有效的档案集并启动算力匹配核心</p>
                    </div>
                )}
            </div>
        </div>
    );
}
