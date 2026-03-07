import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ChevronRight, Loader2, Database, Globe, Lock, ShieldCheck } from 'lucide-react';
import api from '../api';

type UploadState = 'IDLE' | 'DRAGGING' | 'UPLOADING' | 'SUCCESS';

export function ResumeUpload({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState<UploadState>('IDLE');
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [importedCount, setImportedCount] = useState(0);

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

    const handleUploadPrivate = async (selectedFiles: File[]) => {
        setFiles(selectedFiles);
        setStatus('UPLOADING');
        setProgress(10);
        setLogs([]);
        addLog(`开始上传并解析 ${selectedFiles.length} 份文件至账号私库...`);

        try {
            const progressTimer = setInterval(() => {
                setProgress(p => Math.min(p + 15, 85));
            }, 500);

            let totalImported = 0;
            for (const file of selectedFiles) {
                await api.uploadPrivateResume(file);
                totalImported++;
            }

            clearInterval(progressTimer);
            setProgress(100);
            setImportedCount(totalImported);

            addLog(`解析完成。私有库新增 ${totalImported} 个候选人。`);
            setStatus('SUCCESS');
        } catch (e) {
            console.error(e);
            addLog(`私有库上传失败: ${e}`);
            alert("档案上传至私库失败");
            setStatus('IDLE');
        }
    };

    const handleImportPrivate = async () => {
        setStatus('UPLOADING');
        setProgress(20);
        setLogs([]);
        addLog("正在连接账号私密人才库...");

        try {
            const resumes = await api.fetchPrivateResumes();
            setProgress(100);
            setImportedCount(resumes.length);
            addLog(`同步完成。共加载 ${resumes.length} 份私有加密档案。`);
            setStatus('SUCCESS');
        } catch (e) {
            console.error(e);
            addLog(`私库加载失败: ${e}`);
            alert("加载账号私库失败");
            setStatus('IDLE');
        }
    };

    const handleImportPublic = async () => {
        setStatus('UPLOADING');
        setProgress(20);
        setLogs([]);
        addLog("正在连接公共开源人才云图...");

        try {
            const resumes = await api.fetchPublicResumes();
            setProgress(100);
            setImportedCount(resumes.length);
            addLog(`同步完成。共加载 ${resumes.length} 份公有开源档案。`);
            setStatus('SUCCESS');
        } catch (e) {
            console.error(e);
            addLog(`公有库加载失败: ${e}`);
            alert("加载公库档案失败");
            setStatus('IDLE');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setStatus('IDLE');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadPrivate(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadPrivate(Array.from(e.target.files));
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
                        <p className="text-[#86868b] text-sm mt-2">支持批量拖拽 PDF / Word。系统将运用大模型自动抽提经历并标准化入库。</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* 操作区 */}
                    {/* 操作区 */}
                    {status === 'IDLE' || status === 'DRAGGING' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* 公用简历库卡片 */}
                            <div className="bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-lg hover:-translate-y-1" onClick={handleImportPublic}>
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                                        <Globe className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">使用公用简历库</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        一键拉取平台提供的脱敏开源人才数据，快速体验基于庞大数据池的 AI 人才筛选流程。
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                                    进入公用库探索 <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>

                            {/* 私有库拉取卡片 */}
                            <div className="bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-lg hover:-translate-y-1" onClick={handleImportPrivate}>
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                                        <Database className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">使用账号私有库</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        提取绑定账号历史已同步、安全合规存放在隔离分区的已激活人才资产档案。
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center text-sm font-semibold text-purple-400 group-hover:text-purple-300">
                                    拉取我的私库 <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>

                            {/* 上传至私有库卡片 */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`bg-gradient-to-br from-[#1c1c1e] to-black border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${status === 'DRAGGING'
                                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-[1.02]'
                                    : 'border-white/10 hover:border-emerald-500/50 hover:bg-[#1a211e] shadow-lg hover:-translate-y-1'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
                                <div className="relative z-10 w-full flex flex-col items-center justify-center text-center h-full">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${status === 'DRAGGING' ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-white/5 border border-white/10 text-[#86868b] group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 group-hover:text-emerald-400'}`}>
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 tracking-tight ${status === 'DRAGGING' ? 'text-emerald-400' : 'text-white'}`}>
                                        上传私有新档案
                                    </h3>
                                    <p className="text-xs text-[#86868b] mb-6 leading-relaxed flex items-center gap-1 justify-center">
                                        <ShieldCheck className="w-3.5 h-3.5" /> 本地数据端到端加密入库
                                    </p>

                                    <label className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-transparent text-emerald-400 px-6 py-2.5 rounded-full font-bold transition-all cursor-pointer shadow-sm text-sm active:scale-95">
                                        浏览本地文件
                                        <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx" />
                                    </label>
                                    <span className="text-[10px] text-[#555] mt-3 uppercase tracking-wider font-semibold">支持直接拖拽 PDF/WORD 至此处</span>
                                </div>
                            </div>
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
                                    {status === 'UPLOADING' && '正在传输并解析...'}
                                    {status === 'SUCCESS' && '资产入库完毕'}
                                </h3>
                                <p className="text-[#86868b] text-sm">
                                    {importedCount > 0 ? `已读取 ${importedCount} 个候选人卷宗` : '等待中'}
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
