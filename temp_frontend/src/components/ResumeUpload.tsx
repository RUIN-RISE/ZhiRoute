import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ChevronRight, Loader2, FileUp } from 'lucide-react';

type UploadState = 'IDLE' | 'DRAGGING' | 'UPLOADING' | 'ANALYZING' | 'SUCCESS';

export function ResumeUpload({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState<UploadState>('IDLE');
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState<File[]>([]);

    // 模拟的解析详情流
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
        setTimeout(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === 'IDLE') setStatus('DRAGGING');
    }, [status]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === 'DRAGGING') setStatus('IDLE');
    }, [status]);

    const simulateUploadAndAnalyze = (selectedFiles: File[]) => {
        setFiles(selectedFiles);
        setStatus('UPLOADING');
        setProgress(0);
        setLogs([]);

        // 模拟上传阶段 0-30%
        let currentProgress = 0;
        const uploadTimer = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 30) {
                clearInterval(uploadTimer);
                setProgress(30);
                startAnalysisPhase();
            } else {
                setProgress(currentProgress);
            }
        }, 300);
    };

    const startAnalysisPhase = () => {
        setStatus('ANALYZING');

        const analyzeSteps = [
            '正在启动 OCR 引擎以提取基础文本 (PDF Miner)...',
            '正在执行版面分析 (Layout Analysis)...',
            '正在通过 JobOS NLP 抽提关键实体表：(Name, Edu, Exp)...',
            '正在标准化技能树标签字典 (Skill Taxonomy Mapping)...',
            '构建履历特征向量 (Embedding Generation)...',
            '计算大盘基准参考分 (Baseline Scoring)...',
            '结构化档案整合完毕，准备入库...'
        ];

        let stepIdx = 0;
        let p = 30;

        const analyzeTimer = setInterval(() => {
            if (stepIdx < analyzeSteps.length) {
                addLog(analyzeSteps[stepIdx]);
                p += 10;
                setProgress(Math.min(99, p));
                stepIdx++;
            } else {
                clearInterval(analyzeTimer);
                setProgress(100);
                setStatus('SUCCESS');
            }
        }, 800);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setStatus('IDLE');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            simulateUploadAndAnalyze(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            simulateUploadAndAnalyze(Array.from(e.target.files));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] relative z-20"
        >
            <div className="w-full bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">

                {/* 顶部标题区 */}
                <div className="p-8 pb-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f7] flex items-center gap-3">
                            <UploadCloud className="w-6 h-6 text-[#0071e3]" />
                            导入候选人至人才库
                        </h2>
                        <p className="text-[#86868b] text-sm mt-2">支持批量拖拽 PDF / Word / DOCX。系统将运用大模型自动抽提经历并标准化入库。</p>
                    </div>
                    {status === 'IDLE' && (
                        <button
                            onClick={onComplete}
                            className="px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-all flex items-center gap-2"
                        >
                            跳过上传，先逛逛人才大盘 <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {/* 虚线拖拽区 */}
                    {status === 'IDLE' || status === 'DRAGGING' ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${status === 'DRAGGING'
                                ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-[0_0_50px_rgba(0,113,227,0.15)] scale-[1.02]'
                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/40'
                                }`}
                        >
                            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${status === 'DRAGGING' ? 'bg-[#0071e3] text-white scale-110 shadow-lg' : 'bg-white/5 text-[#86868b]'}`}>
                                <FileUp className="w-8 h-8" />
                            </div>

                            <h3 className={`text-xl font-medium mb-2 ${status === 'DRAGGING' ? 'text-white' : 'text-[#f5f5f7]'}`}>
                                {status === 'DRAGGING' ? '松开鼠标即可极速上传' : '将简历文件拖拽至此处'}
                            </h3>
                            <p className="text-[#a1a1a6] text-sm mb-6 max-w-sm text-center">
                                JobOS AI 引擎将自动读取文本、拆解块状结构，生成对应的精准人才画像标签库。
                            </p>

                            <label className="bg-[#1c1c1e] border border-white/[0.08] hover:bg-[#2c2c2e] text-white px-6 py-2.5 rounded-full font-medium transition-colors cursor-pointer shadow-sm text-sm">
                                浏览本地文件
                                <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx" />
                            </label>
                        </div>
                    ) : (
                        /* 解析进度与日志屏 */
                        <div className="w-full h-80 bg-black/40 border border-white/5 rounded-2xl flex relative overflow-hidden">
                            {/* 左侧大进度 */}
                            <div className="w-1/2 p-10 flex flex-col items-center justify-center border-r border-white/5 relative bg-gradient-to-br from-[#1c1c1e] to-black">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3]/10 rounded-full blur-3xl" />

                                <div className="relative mb-6">
                                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                        <motion.circle
                                            cx="50" cy="50" r="46"
                                            fill="transparent"
                                            stroke={status === 'SUCCESS' ? "#34d399" : "#0071e3"}
                                            strokeWidth="6"
                                            strokeDasharray={289.026}
                                            animate={{ strokeDashoffset: 289.026 - (progress / 100) * 289.026 }}
                                            transition={{ ease: "easeInOut" }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {status === 'SUCCESS' ? (
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        ) : (
                                            <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                                                {Math.round(progress)}<span className="text-lg text-[#86868b]">%</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold tracking-tight text-white mb-1">
                                    {status === 'UPLOADING' && '正在传输物理文件...'}
                                    {status === 'ANALYZING' && 'AI 管线处理中'}
                                    {status === 'SUCCESS' && '资产入库完毕'}
                                </h3>
                                <p className="text-[#86868b] text-sm">
                                    {files.length > 0 ? `已读取 ${files.length} 个候选人卷宗` : '等待中'}
                                </p>
                            </div>

                            {/* 右侧流式日志终端 */}
                            <div className="w-1/2 bg-black flex flex-col font-mono text-xs">
                                <div className="h-10 border-b border-white/10 bg-[#1c1c1e] flex items-center px-4 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="ml-4 text-zinc-500 text-[10px] tracking-widest font-bold">TERMINAL.LOG</span>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto space-y-2 text-zinc-400">
                                    <div>[System] Establishing connection to indexing server...</div>
                                    <div>[System] 收到对象，体积：{(files[0]?.size / 1024).toFixed(2)} KB</div>
                                    <AnimatePresence>
                                        {logs.map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex gap-2"
                                            >
                                                <span className="text-[#0071e3] font-bold shrink-0">{'>'}</span>
                                                <span className={log.includes('完毕') || log.includes('SUCCESS') ? 'text-emerald-400' : ''}>
                                                    {log}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {status !== 'SUCCESS' && (
                                        <div className="flex gap-2 animate-pulse text-[#86868b]">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>_</span>
                                        </div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部浮动提示与按钮区 */}
                {status === 'SUCCESS' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 pt-0 flex justify-end"
                    >
                        <button
                            onClick={onComplete}
                            className="bg-[#0071e3] hover:bg-[#0077ED] text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(0,113,227,0.4)] active:scale-95"
                        >
                            打开人才库大盘 <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
