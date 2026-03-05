import React, { useState, useRef } from 'react';
import {
    UploadCloud,
    XCircle,
    ChevronDown,
    Cpu,
    Zap,
    CheckCircle2,
    ListFilter,
    ShieldCheck,
    Target,
    Activity,
    FileText,
    Terminal,
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
    // 提升到父组件的状态
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
 * 简历分析执行仪表盘：上传 → 处理 → 结果展示
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

    // ---- 阶段一：上传 ----
    if (phase === 'INGEST') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
                {/* 装饰性极简网格和背景光 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
                <div className="w-full max-w-3xl space-y-6 relative z-10">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'w-full aspect-[2/1] border border-dashed rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-500 glass-panel',
                            isDragOver
                                ? 'border-primary/50 bg-primary/5 scale-[1.02] shadow-[0_0_50px_rgba(var(--primary),0.1)]'
                                : 'border-white/10 hover:border-primary/30 hover:bg-white/[0.03] shadow-2xl'
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
                        <div
                            className={cn(
                                'w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500',
                                isDragOver ? 'bg-primary/20 scale-110 shadow-[0_0_30px_hsl(var(--primary))]' : 'bg-black/50 border border-white/5 shadow-inner'
                            )}
                        >
                            <UploadCloud className={cn('w-10 h-10 transition-colors', isDragOver ? 'text-white' : 'text-primary/70')} />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white mb-3 tracking-wide">
                            {isDragOver ? '释放以上传文件' : '拖拽简历档案至此'}
                        </h3>
                        <p className="text-zinc-500 text-sm text-center font-sans tracking-wide">
                            支持 PDF, TXT, ZIP <br />
                            <span className="text-primary/80 hover:text-primary transition-colors hover:underline underline-offset-4 mt-1 inline-block">或点击浏览文件</span>
                        </p>
                    </div>
                    {uploadedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel rounded-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    已选择 {uploadedFiles.length} 份档案
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUploadedFiles([]);
                                    }}
                                    className="text-xs text-zinc-500 hover:text-destructive transition-colors uppercase tracking-widest font-bold"
                                >
                                    清空
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {uploadedFiles.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2.5 px-4 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200 truncate max-w-[250px]">{file.name}</div>
                                                <div className="text-xs text-zinc-600 font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-destructive transition-all p-1"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {uploadProgress > 0 && (
                                <div className="mt-6">
                                    <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
                                        <span>正在上传数据包...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={startProcessing}
                            disabled={uploadedFiles.length === 0}
                            className={cn(
                                'px-14 py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center gap-3 font-display tracking-wider uppercase shadow-2xl',
                                uploadedFiles.length > 0
                                    ? 'bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]'
                                    : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
                            )}
                        >
                            <Cpu className="w-5 h-5" />
                            启动神经匹配器
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- 阶段二：处理中 ----
    if (phase === 'PROCESSING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="w-full max-w-3xl glass-panel rounded-3xl p-1 font-mono text-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-700 relative z-10">
                    <div className="bg-black/60 px-6 py-4 border-b border-white/5 flex justify-between items-center rounded-t-[1.3rem]">
                        <span className="text-primary/70 font-bold tracking-[0.2em] text-xs">AI 处理子系统</span>
                        <div className="flex gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <span className="w-2.5 h-2.5 rounded-full bg-primary/60 shadow-[0_0_8px_hsl(var(--primary))]" />
                        </div>
                    </div>
                    <div className="p-8 h-[500px] bg-black/80 flex flex-col justify-end items-start space-y-4 rounded-b-[1.3rem] overflow-hidden relative">
                        {/* 扫描纹理装饰 */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50" />

                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-zinc-300 flex items-start gap-4 relative z-10"
                            >
                                <span className="opacity-40 font-thin text-xs mt-0.5 shrink-0">
                                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                                </span>
                                <span className={cn(
                                    log.includes('SUCCESS') ? 'text-emerald-400' :
                                        log.includes('ERROR') ? 'text-destructive' :
                                            log.includes('RESULT') ? 'text-primary font-bold' : ''
                                )}>
                                    {log}
                                </span>
                            </motion.div>
                        ))}
                        <motion.div
                            animate={{ opacity: [0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                            className="w-2.5 h-5 bg-primary ml-[72px] mt-2 relative z-10 box-shadow-[0_0_10px_hsl(var(--primary))]"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ---- 阶段三：结果 ----
    const avgScore =
        candidates.length > 0
            ? Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length)
            : '-';

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto p-8 relative z-20 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-6 mb-12 shrink-0">
                <StatCard
                    label="处理档案数"
                    value={processedCount > 0 ? processedCount.toString() : uploadedFiles.length.toString()}
                    icon={<ListFilter className="w-5 h-5 text-zinc-500" />}
                />
                <StatCard
                    label="计算核心状态"
                    value="运行良好"
                    icon={<Activity className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                    highlight
                />
                <StatCard
                    label="平均拟合度"
                    value={avgScore.toString()}
                    icon={<Target className="w-5 h-5 text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]" />}
                />
            </div>
            <div className="space-y-4 flex-1">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 mb-8 flex items-center gap-3 font-display">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                    智算网络输出 · 候选人序列
                </h3>
                {candidates.length > 0 ? (
                    candidates.map((c, i) => {
                        const isExpanded = expandedId === c.resume_id;
                        return (
                            <motion.div
                                key={c.resume_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, ease: 'easeOut' }}
                            >
                                <SpotlightCard className="group rounded-[1.5rem] p-0 overflow-hidden border border-white/[0.08] shadow-[0_10px_40px_-10px_rgba(0,0,0,1)]">
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : c.resume_id)}
                                        className={cn(
                                            'p-8 cursor-pointer transition-all duration-500 relative z-10 bg-black/40',
                                            isExpanded ? 'bg-primary/[0.03] border-b border-primary/20' : 'hover:bg-white/[0.04]'
                                        )}
                                    >
                                        {/* 发光左前缀指示器 */}
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="flex gap-10 items-start">
                                            {/* 分数区域 */}
                                            <div className="w-32 shrink-0 flex flex-col items-center justify-center border-r border-white/10 pr-10 py-2">
                                                <div className="text-[3.5rem] font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none font-display">
                                                    {c.score}
                                                </div>
                                                <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-3 font-bold">
                                                    匹配指数
                                                </div>
                                            </div>

                                            {/* 内容区域 */}
                                            <div className="flex-1 space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <h4 className="text-2xl font-bold text-white tracking-tight">{c.name}</h4>
                                                        <ChevronDown
                                                            className={cn(
                                                                'w-5 h-5 text-zinc-600 transition-transform duration-500 ease-out',
                                                                isExpanded && 'rotate-180 text-primary'
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-5 glass-panel rounded-2xl relative overflow-hidden group-hover:bg-white/[0.04] transition-colors duration-500 border border-white/5">
                                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                                                    <div className="flex items-center gap-3 text-xs font-black text-primary uppercase tracking-[0.15em] mb-3 opacity-90">
                                                        <Zap className="w-4 h-4 fill-primary/20" /> 推荐计算摘要
                                                    </div>
                                                    <p className="text-[15px] text-zinc-300 leading-relaxed font-medium">
                                                        {c.summary}
                                                    </p>
                                                </div>

                                                {!isExpanded && c.top_evidence[0] && (
                                                    <div className="pt-2 pl-2">
                                                        <div className="text-xs text-secondary-foreground font-mono flex items-center gap-3 bg-white/[0.02] inline-flex pr-4 py-1.5 rounded-full border border-white/5">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center ml-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            </div>
                                                            <span className="text-emerald-500/80 font-bold uppercase tracking-wider text-[10px]">数据匹配：</span>
                                                            <span className="text-zinc-400 italic font-sans max-w-[400px] truncate">
                                                                &quot;{c.top_evidence[0].quote}&quot;
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 操作区 */}
                                            <div className="w-44 shrink-0 flex flex-col gap-3 justify-center border-l border-white/10 pl-10 h-full py-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStartInterview(c);
                                                    }}
                                                    className="w-full py-3.5 bg-white text-black text-sm font-bold tracking-widest uppercase rounded-xl hover:bg-zinc-200 transition-all shadow-[0_5px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_5px_25px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                                                >
                                                    处理指令
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCandidates((prev) => prev.filter((x) => x.resume_id !== c.resume_id));
                                                    }}
                                                    className="w-full py-3.5 bg-transparent border border-white/10 text-zinc-500 text-sm font-bold tracking-widest uppercase rounded-xl hover:bg-white/5 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-[0.98]"
                                                >
                                                    归档
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
                                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like easing
                                                className="overflow-hidden bg-[#0A0B0E]"
                                            >
                                                <div className="grid grid-cols-2 gap-8 p-10 border-t border-primary/20 relative">
                                                    {/* 背景细节 */}
                                                    <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(circle_at_50%_0%,black,transparent_70%)] pointer-events-none" />

                                                    {/* 左栏：原文片段 */}
                                                    <div className="space-y-5 relative z-10">
                                                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-primary" /> 原始数据向量
                                                        </h5>
                                                        <div className="bg-black/80 border border-white/[0.08] shadow-inner rounded-2xl p-6 font-sans text-sm relative">
                                                            <div className="absolute top-0 left-6 w-8 h-1 bg-primary/40 rounded-b-full" />
                                                            <div className="space-y-2">
                                                                <span className="text-zinc-600 text-xs font-mono uppercase">简历原文提取项</span>
                                                                <div className="text-zinc-300 leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar pr-4 text-[13px]">
                                                                    {c.evidence_quotes.join(' [...] ')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 右栏：证据链 */}
                                                    <div className="space-y-5 relative z-10">
                                                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> 验证逻辑链
                                                        </h5>
                                                        <div className="space-y-4 font-sans max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                                                            {c.top_evidence.map((ev, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-black/60 border border-white/[0.05] rounded-xl p-5 relative overflow-hidden hover:border-white/10 transition-colors"
                                                                >
                                                                    <div className="absolute left-0 top-0 w-1 h-full bg-zinc-800" />
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <span className="text-[11px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
                                                                            {ev.criteria}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-zinc-400 text-sm mb-3 italic pl-2 border-l-2 border-white/10 font-serif">
                                                                        &quot;{ev.quote}&quot;
                                                                    </p>
                                                                    <p className="text-zinc-200 text-[13px] leading-relaxed">
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
                    <div className="flex flex-col items-center justify-center p-20 text-center glass-panel rounded-[2rem] border border-dashed border-white/10">
                        <Terminal className="w-12 h-12 text-zinc-700 mb-4" />
                        <span className="text-zinc-500 font-mono tracking-widest text-sm uppercase">暂无匹配的候选人</span>
                    </div>
                )}
            </div>
        </div>
    );
}
