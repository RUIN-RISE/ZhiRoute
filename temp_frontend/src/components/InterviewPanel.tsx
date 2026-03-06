import { useState, useEffect } from 'react';
import { Mail, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { MagneticButton } from './shared';
import api from '../api';
import type { CandidateRank } from '../api';

/**
 * 面试/录取操作面板：为候选人生成面试邀请、Offer 或婉拒邮件
 */
export function InterviewPanel({ candidates }: { candidates: CandidateRank[] }) {
    const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);
    const [actionType, setActionType] = useState<'interview' | 'offer' | 'reject'>('interview');
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (candidates.length > 0) setSelectedCandidate(candidates[0]);
    }, [candidates]);

    const handleGenerate = async () => {
        if (!selectedCandidate) return;
        setIsLoading(true);
        try {
            const res = await api.generateAction(selectedCandidate.name, actionType, '目标岗位');
            setGeneratedContent(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 p-6 lg:p-10 animate-in fade-in duration-700 relative z-20 overflow-hidden bg-black">
            {/* 装饰背景 */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

            {/* 候选人侧边栏: 高级感玻璃名单 */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">待处理人才序列</h3>
                    <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] text-blue-400 font-bold">{candidates.length} 人</div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {candidates.map((c) => (
                        <motion.div
                            key={c.resume_id}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                                setSelectedCandidate(c);
                                setGeneratedContent(null);
                            }}
                            className={cn(
                                'p-5 rounded-2xl cursor-pointer border transition-all duration-500 relative overflow-hidden group',
                                selectedCandidate?.resume_id === c.resume_id
                                    ? 'bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.15)]'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-zinc-400 hover:bg-white/[0.04]'
                            )}
                        >
                            {selectedCandidate?.resume_id === c.resume_id && (
                                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 blur-xl rounded-full translate-x-4 -translate-y-4" />
                            )}
                            <div className="font-display font-bold text-lg mb-1 tracking-tight">{c.name}</div>
                            <div className={cn(
                                "text-[10px] uppercase tracking-widest font-bold",
                                selectedCandidate?.resume_id === c.resume_id ? "text-blue-400" : "text-zinc-600"
                            )}>
                                匹配度：{c.score}%
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 操作内容区域: 主玻璃面板 */}
            <div className="flex-1 flex flex-col glass-panel rounded-[2.5rem] border border-white/[0.08] relative overflow-hidden bg-black/40 shadow-2xl">
                {/* 顶部标签切换 */}
                <div className="flex border-b border-white/[0.05] bg-white/[0.02]">
                    {[
                        { id: 'interview', label: '面试邀请', icon: <Zap className="w-4 h-4" /> },
                        { id: 'offer', label: 'OFFER录用', icon: <ShieldCheck className="w-4 h-4" /> },
                        { id: 'reject', label: '遗憾婉拒', icon: <Mail className="w-4 h-4" /> },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setActionType(t.id as any);
                                setGeneratedContent(null);
                            }}
                            className={cn(
                                'flex-1 py-6 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] transition-all relative group',
                                actionType === t.id
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            <span className={cn(
                                "transition-colors duration-300",
                                actionType === t.id ? "text-blue-400" : "opacity-30"
                            )}>{t.icon}</span>
                            {t.label}
                            {actionType === t.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-10 overflow-y-auto relative custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {!generatedContent && !isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex items-center justify-center flex-col text-zinc-600 gap-8"
                            >
                                <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />
                                    <Mail className="w-10 h-10 opacity-20 relative z-10" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">文档生成器准备就绪</p>
                                    <p className="text-zinc-700 text-xs">准备为 <strong>{selectedCandidate?.name}</strong> 生成配套方案</p>
                                </div>
                                <MagneticButton
                                    onClick={handleGenerate}
                                    className="bg-white text-black px-12 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-all shadow-[0_15px_40px_-5px_rgba(255,255,255,0.2)] active:scale-95"
                                >
                                    立即生成
                                </MagneticButton>
                            </motion.div>
                        )}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex items-center justify-center flex-col gap-6"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 border-2 border-blue-500/20 rounded-full animate-ping" />
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 animate-pulse">正在生成文案...</p>
                            </motion.div>
                        )}

                        {generatedContent && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-10"
                            >
                                {/* 预览卡片 */}
                                <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2rem] p-8 relative overflow-hidden shadow-inner ring-1 ring-inset ring-white/5">
                                    <div className="absolute top-0 left-0 w-20 h-[1px] bg-blue-500" />
                                    <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <Mail className="w-4 h-4 opacity-70" /> {actionType === 'interview' ? '面试邀请' : actionType === 'offer' ? '入职通知' : '婉拒信'}草稿
                                    </h4>
                                    <div className="whitespace-pre-wrap leading-[1.8] text-zinc-200 font-sans text-[17px] font-medium opacity-90">
                                        {generatedContent.content}
                                    </div>
                                    <div className="mt-10 flex gap-4">
                                        <button className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors">复制全文</button>
                                        <button className="px-6 py-3 bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors">预览发送</button>
                                    </div>
                                </div>

                                {actionType === 'interview' && generatedContent.interview_questions && (
                                    <div className="bg-blue-500/5 p-8 rounded-[2rem] border border-blue-500/20 relative overflow-hidden group">
                                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
                                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <Zap className="w-4 h-4" /> 深度面评建议问案
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {generatedContent.interview_questions.map((q: string, i: number) => (
                                                <div key={i} className="flex gap-5 p-4 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5 group/q">
                                                    <span className="text-blue-400 font-mono text-sm opacity-40 group-hover/q:opacity-100 transition-opacity">#{i + 1}</span>
                                                    <span className="text-zinc-300 text-[15px] leading-relaxed font-medium">{q}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// 补全缺失的 Icon 引用
// 已移动到顶部

