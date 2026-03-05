import { useState } from 'react';
import { FileText, User, Activity, Code2, Target, ShieldCheck, Vote, ArrowRight } from 'lucide-react';
import { MagneticButton, Label } from './shared';
import type { StructuredJD } from '../types';

/**
 * JD 审核/编辑面板：在正式启动筛选前确认职位描述
 */
export function JdReviewPanel({
    jd,
    onConfirm,
}: {
    jd: StructuredJD;
    onConfirm: (jd: StructuredJD) => void;
}) {
    const [editedJd, setEditedJd] = useState(jd);

    const handleChange = (field: keyof StructuredJD, value: any) => {
        setEditedJd((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="w-full h-full max-w-5xl mx-auto flex flex-col p-6 lg:p-10 animate-fadeInUp relative z-20">
            {/* 背景氛围层 - 保持全局一致性 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] animate-float opacity-50" />
                <div className="absolute inset-0 bg-grid opacity-30" />
            </div>

            <div className="flex-1 flex flex-col glass-panel rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl">
                {/* 顶部装饰发光位 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                {/* 顶部标题栏 */}
                <div className="px-10 py-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
                            <FileText className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">确认职位描述</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">请核对 AI 提取的核心画像数据</p>
                        </div>
                    </div>
                    <MagneticButton
                        onClick={() => onConfirm(editedJd)}
                        className="bg-white text-black px-10 py-3.5 rounded-xl font-bold flex items-center gap-3 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                    >
                        确认并继续 <ArrowRight className="w-5 h-5" />
                    </MagneticButton>
                </div>

                {/* 主体编辑区域 */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
                    <div className="grid grid-cols-2 gap-8">
                        {/* 基础信息 */}
                        <div className="space-y-3">
                            <Label icon={<User className="w-4 h-4 text-blue-400" />} text="职位名称" />
                            <div className="relative group">
                                <input
                                    className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 text-lg font-bold focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-zinc-700"
                                    value={editedJd.role || ''}
                                    onChange={(e) => handleChange('role', e.target.value)}
                                    placeholder="输入职位名称..."
                                />
                                <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label icon={<Activity className="w-4 h-4 text-emerald-400" />} text="经验要求" />
                            <input
                                className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 font-medium focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                                value={editedJd.exp_level}
                                onChange={(e) => handleChange('exp_level', e.target.value)}
                            />
                        </div>

                        {/* 核心技能 - 占据整行 */}
                        <div className="col-span-2 space-y-3">
                            <Label icon={<Code2 className="w-4 h-4 text-purple-400" />} text="核心技能要求（全角或半角逗号分隔）" />
                            <textarea
                                rows={2}
                                className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 leading-relaxed focus:border-purple-500/40 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all resize-none"
                                value={editedJd.stack.join('，')}
                                onChange={(e) =>
                                    handleChange(
                                        'stack',
                                        e.target.value
                                            .split(/[,，]/)
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                    )
                                }
                            />
                        </div>

                        {/* 加分项 */}
                        <div className="col-span-2 space-y-3">
                            <Label icon={<Target className="w-4 h-4 text-pink-400" />} text="加分项与公司亮点（全角或半角逗号分隔）" />
                            <textarea
                                rows={2}
                                className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 leading-relaxed focus:border-pink-500/40 focus:ring-4 focus:ring-pink-500/5 outline-none transition-all resize-none"
                                value={editedJd.plus_points.join('，')}
                                onChange={(e) =>
                                    handleChange(
                                        'plus_points',
                                        e.target.value
                                            .split(/[,，]/)
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                    )
                                }
                            />
                        </div>

                        {/* 教育与软技能 */}
                        <div className="space-y-3">
                            <Label icon={<ShieldCheck className="w-4 h-4 text-amber-400" />} text="最低学历" />
                            <input
                                className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                                value={editedJd.education}
                                onChange={(e) => handleChange('education', e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label icon={<Vote className="w-4 h-4 text-rose-400" />} text="软技能要求" />
                            <input
                                className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 text-zinc-100 focus:border-rose-500/40 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all"
                                value={editedJd.culture_fit.join('，')}
                                onChange={(e) =>
                                    handleChange(
                                        'culture_fit',
                                        e.target.value
                                            .split(/[,，]/)
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-12 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            💡 <strong className="text-zinc-200">提示：</strong> 精确的职位描述有助于提高简历匹配的权重。你可以直接在上方文本框中微调关键词，系统将根据最终版本重新计算人才分值。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
