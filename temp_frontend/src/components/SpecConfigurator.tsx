import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowRight,
    ShieldCheck,
    Activity,
    Loader2,
    User,
    Radar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { MagneticButton, SpotlightCard } from './shared';
import api from '../api';
import type { ChatMessage } from '../api';
import type { StructuredJD } from '../types';
import { INITIAL_JD } from '../types';


/**
 * AI 对话式岗位需求配置面板
 */
export function SpecConfigurator({
    initialUserInput,
    onComplete,
}: {
    initialUserInput: string;
    onComplete: (jd: StructuredJD) => void;
}) {
    const [formData, setFormData] = useState<StructuredJD>({
        ...INITIAL_JD,
        role: initialUserInput,
        remarks: initialUserInput,
    });
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [apiHistory, setApiHistory] = useState<ChatMessage[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [quickReplies, setQuickReplies] = useState<string[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // 初始化对话
    useEffect(() => {
        let mounted = true;
        api.resetChat().then(() => {
            if (!mounted) return;
            setIsAiThinking(true);
            api
                .chat(initialUserInput)
                .then((res) => {
                    if (!mounted) return;
                    setIsAiThinking(false);
                    setMessages([
                        { role: 'user', content: initialUserInput },
                        { role: 'assistant', content: res.reply },
                    ]);
                    setApiHistory([
                        { role: 'user', content: initialUserInput },
                        { role: 'assistant', content: res.reply },
                    ]);
                    setQuickReplies(res.quick_replies || []);
                    if (res.collected_info) updateFormData(res.collected_info);
                    if (res.is_complete) setIsComplete(true);
                })
                .catch((err) => {
                    console.error('Chat init error', err);
                    setIsAiThinking(false);
                });
        });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const updateFormData = (info: Record<string, any>) => {
        setFormData((prev) => ({
            ...prev,
            role: info.role || prev.role,
            stack: info.core_skills || prev.stack,
            exp_level: info.exp_years || prev.exp_level,
            culture_fit: info.soft_skills || info.culture_fit || prev.culture_fit,
            education: info.education || prev.education,
            plus_points: info.bonus || info.plus_points || prev.plus_points,
        }));
    };

    const handleChatSubmit = async (e?: React.FormEvent, msgOverride?: string) => {
        e?.preventDefault();
        const txt = msgOverride || chatInput.trim();
        if (!txt || isAiThinking) return;

        setChatInput('');
        setQuickReplies([]);
        setMessages((prev) => [...prev, { role: 'user', content: txt }]);
        setIsAiThinking(true);

        try {
            const res = await api.chat(txt, apiHistory);
            setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
            setApiHistory((prev) => [
                ...prev,
                { role: 'user', content: txt },
                { role: 'assistant', content: res.reply },
            ]);
            if (res.quick_replies) setQuickReplies(res.quick_replies);
            if (res.collected_info) updateFormData(res.collected_info);
            if (res.is_complete) setIsComplete(true);
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '抱歉，网络连接似乎有点问题，请重试。' },
            ]);
        } finally {
            setIsAiThinking(false);
        }
    };

    // 完成采集后生成正式 JD
    const handleGenerate = async () => {
        setIsAiThinking(true);
        const answers = [
            { question_id: 'role', answer: formData.role || '' },
            { question_id: 'stack', answer: formData.stack.join(',') },
            { question_id: 'exp', answer: formData.exp_level },
            { question_id: 'soft', answer: formData.culture_fit.join(',') },
            { question_id: 'edu', answer: formData.education },
            { question_id: 'bonus', answer: formData.plus_points.join(',') },
        ];

        try {
            const jd = await api.generateJd(answers, formData.remarks);
            const salaryParts: string[] = [];
            if (jd.salary) {
                if (jd.salary.range && jd.salary.range !== '面议') salaryParts.push(`薪资范围：${jd.salary.range}`);
                if (jd.salary.description) salaryParts.push(jd.salary.description);
                if (jd.salary.tax_type) salaryParts.push(jd.salary.tax_type);
                if (jd.salary.has_bonus) salaryParts.push('含绩效奖金');
            }
            const finalJd: StructuredJD = {
                role: jd.title,
                stack: jd.required_skills,
                exp_level: jd.experience_level,
                culture_fit: formData.culture_fit,
                education: formData.education,
                plus_points: jd.bonus_skills,
                remarks: salaryParts.filter(Boolean).join('，') || '面议',
            };
            onComplete(finalJd);
        } catch (e) {
            console.error(e);
            alert('JD 生成失败');
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col p-6 lg:p-10 animate-fadeInUp relative z-20">
            {/* 背景氛围层 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] animate-float-delayed" />
                <div className="absolute inset-0 bg-grid opacity-40" />
            </div>

            <div className="flex-1 flex flex-col glass-panel rounded-[2.5rem] overflow-hidden relative z-10">
                {/* 顶部装饰发光位 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                {/* 顶部标题栏 */}
                <div className="px-10 py-7 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01] relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                            <ShieldCheck className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">定义目标画像</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">岗位架构协议 V1.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono font-bold tracking-[0.2em] bg-zinc-900/50 px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                        系统：正在实时同步
                    </div>
                </div>

                {/* 主体区域 */}
                <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
                    {/* 左侧聊天: 占据视觉重心 */}
                    <div className="flex-[3] flex flex-col border-r border-white/[0.05] relative overflow-hidden bg-black/20">
                        {/* 动态背景背景 */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.05),transparent)] pointer-events-none" />

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                    className={cn(
                                        'flex gap-5 max-w-[85%]',
                                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500',
                                            msg.role === 'assistant'
                                                ? 'bg-blue-600 border-blue-400/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                                : 'bg-white border-white/20 text-black shadow-[0_8px_20px_-5px_rgba(255,255,255,0.2)]'
                                        )}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <Radar className="w-5.5 h-5.5" />
                                        ) : (
                                            <User className="w-5.5 h-5.5" />
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            'p-3.5 px-5 rounded-[1.4rem] text-[15px] leading-snug relative transition-all duration-300 max-w-full',
                                            msg.role === 'assistant'
                                                ? 'bg-[#262629]/90 backdrop-blur-3xl border border-white/5 text-zinc-100 rounded-tl-sm'
                                                : 'bg-[#007AFF] text-white rounded-tr-sm shadow-md font-normal'
                                        )}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/10 via-transparent to-transparent pointer-events-none" />
                                        )}
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isAiThinking && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-5"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    </div>
                                    <div className="px-6 py-4 rounded-2xl rounded-tl-none bg-white/[0.02] border border-white/5 text-zinc-500 flex items-center gap-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">正在进行画像解析与解码...</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 快捷推荐回复 */}
                            <AnimatePresence>
                                {quickReplies.length > 0 && !isAiThinking && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-wrap gap-3 ml-16"
                                    >
                                        {quickReplies.map((qr, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setChatInput(qr)}
                                                className="px-5 py-2.5 bg-blue-500/5 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                            >
                                                {qr}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={chatEndRef} />
                        </div>

                        {/* 输入框区域 */}
                        <div className="p-8 px-10 border-t border-white/[0.05] bg-black/40">
                            <form onSubmit={handleChatSubmit} className="relative group">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="输入您的回答，描述招聘需求细节..."
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-[1.5rem] pl-8 pr-20 py-5 text-[17px] text-white focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-zinc-600 font-sans shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                    autoFocus
                                    disabled={isAiThinking}
                                />
                                <button
                                    type="submit"
                                    disabled={isAiThinking}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl hover:bg-zinc-200 text-black flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group-hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 右侧预览: 辅助信息 */}
                    <div className="flex-1 bg-black/40 border-l border-white/[0.05] p-10 flex flex-col relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(var(--primary),0.03),transparent)] pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-zinc-500 font-bold uppercase tracking-[0.25em] text-[10px] flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                    实时构建画像
                                </h3>
                            </div>

                            <div className="space-y-10 flex-1 custom-scrollbar pr-2">
                                <PreviewItem
                                    label="目标岗位"
                                    value={formData.role || ''}
                                    placeholder="待识别..."
                                />

                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">核心技术栈</span>
                                    <div className="flex flex-wrap gap-2.5">
                                        {formData.stack.length > 0 ? (
                                            formData.stack.map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-400/20 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                                                >
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-700 italic text-sm pl-1">分析中...</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <PreviewItem label="经验年限" value={formData.exp_level} placeholder="未指定" isCompact />
                                    <PreviewItem label="最低学历" value={formData.education} placeholder="未指定" isCompact />
                                </div>

                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">软实力要求</span>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.culture_fit.length > 0 ? (
                                            formData.culture_fit.map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2.5 py-1 bg-white/5 text-zinc-400 border border-white/5 rounded-md text-[11px] font-medium"
                                                >
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-800 italic text-xs pl-1">—</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">加分项</span>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.plus_points.length > 0 ? (
                                            formData.plus_points.map((p) => (
                                                <span
                                                    key={p}
                                                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[11px] font-medium"
                                                >
                                                    {p}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-800 italic text-xs pl-1">—</span>
                                        )}
                                    </div>
                                </div>

                                <PreviewItem label="薪资 / 预算细节" value={formData.remarks} placeholder="未指定" isCompact />
                            </div>

                            {/* 生成按钮 */}
                            <div className="pt-10">
                                <MagneticButton
                                    onClick={handleGenerate}
                                    disabled={!isComplete || isAiThinking}
                                    className={cn(
                                        'w-full py-5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 tracking-widest uppercase shadow-2xl',
                                        isComplete
                                            ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_10px_40px_-5px_rgba(255,255,255,0.2)]'
                                            : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
                                    )}
                                >
                                    {isAiThinking ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            启动筛选核心
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </MagneticButton>
                                {!isComplete && (
                                    <p className="text-[10px] text-zinc-600 text-center mt-4 font-mono uppercase tracking-[0.1em]">
                                        需求采集进度 ({Object.values(formData).filter(v => v && (Array.isArray(v) ? v.length > 0 : v !== '未指定')).length}/6 完整度)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreviewItem({ label, value, placeholder, isCompact }: { label: string, value: string, placeholder: string, isCompact?: boolean }) {
    const active = value && value !== '未指定';
    return (
        <div className="space-y-3">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">{label}</span>
            <SpotlightCard className={cn(
                "rounded-[1.2rem] border transition-all duration-500 relative overflow-hidden",
                active
                    ? "bg-white/[0.03] border-white/10 text-white shadow-xl"
                    : "bg-black/20 border-white/5 text-zinc-600",
                isCompact ? "p-3.5" : "p-4.5"
            )}>
                {active && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40" />
                )}
                <span className={cn(
                    "block leading-tight",
                    isCompact ? "text-sm font-bold" : "text-lg font-bold tracking-tight",
                    !active && "opacity-30 italic font-normal"
                )}>
                    {active ? value : placeholder}
                </span>
            </SpotlightCard>
        </div>
    );
}
