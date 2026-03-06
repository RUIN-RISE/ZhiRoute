import { useState } from 'react';
import { FileText, User, Activity, Code2, Target, ShieldCheck, Vote, ArrowRight, Download } from 'lucide-react';
import { MagneticButton } from './shared';
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

    const handleExport = () => {
        const lines = [
            `# 职位描述：${editedJd.role}`,
            ``,
            `## 基本要求`,
            `- 经验要求：${editedJd.exp_level}`,
            `- 最低学历：${editedJd.education}`,
            ``,
            `## 核心技能要求`,
            editedJd.stack.map(s => `- ${s}`).join('\n'),
            ``,
            `## 加分项与公司亮点`,
            editedJd.plus_points.map(p => `- ${p}`).join('\n'),
            ``,
            `## 软技能与文化契合`,
            editedJd.culture_fit.map(c => `- ${c}`).join('\n'),
        ].join('\n');
        const blob = new Blob([lines], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editedJd.role || 'JD'}_职位描述.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col p-6 lg:p-12 animate-fadeInUp relative z-20">
            {/* 更细腻的背景渐变 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] opacity-30" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] opacity-20" />
            </div>

            <div className="flex-1 flex flex-col bg-[#1c1c1e]/40 backdrop-blur-[40px] rounded-[3.5rem] border border-white/[0.08] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] overflow-hidden relative z-10">
                {/* 顶层极细边缘光 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 顶部标题栏 - 绝对简约 */}
                <div className="px-14 py-12 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/25 rounded-[1.25rem] blur-2xl animate-pulse" />
                            <div className="w-20 h-20 rounded-[1.25rem] bg-zinc-900/60 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl group transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <FileText className="w-10 h-10 text-white opacity-85 group-hover:scale-105 transition-transform duration-700" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-white tracking-tight">确认职位描述</h2>
                            <p className="text-sm text-zinc-500 font-medium tracking-wide mt-3 flex items-center gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                正在进行招聘建模
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2.5 px-8 py-4 rounded-[1rem] font-semibold text-base bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            导出 JD
                        </button>
                        <MagneticButton
                            onClick={() => onConfirm(editedJd)}
                            className="bg-white text-black px-14 py-4.5 rounded-[1rem] font-bold text-lg flex items-center gap-3 hover:bg-[#f5f5f7] transition-all hover:shadow-[0_24px_48px_rgba(255,255,255,0.15)] active:scale-95 group"
                        >
                            确认并继续 <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-300" />
                        </MagneticButton>
                    </div>
                </div>

                {/* 主体编辑区域 */}
                <div className="flex-1 overflow-y-auto p-14 custom-scrollbar space-y-16">
                    <div className="grid grid-cols-2 gap-x-16 gap-y-12">
                        {/* 基础信息 */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <User className="w-4 h-4 text-zinc-400" /> 职位名称
                            </label>
                            <input
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.25rem] px-8 py-6 text-white text-2xl font-bold focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                                value={editedJd.role || ''}
                                onChange={(e) => handleChange('role', e.target.value)}
                                placeholder="输入职位名称..."
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <Activity className="w-4 h-4 text-zinc-400" /> 经验要求
                            </label>
                            <input
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.25rem] px-8 py-6 text-white text-xl font-semibold focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all shadow-inner"
                                value={editedJd.exp_level}
                                onChange={(e) => handleChange('exp_level', e.target.value)}
                            />
                        </div>

                        {/* 核心技能 */}
                        <div className="col-span-2 space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <Code2 className="w-4 h-4 text-zinc-400" /> 核心技能要求
                            </label>
                            <textarea
                                rows={2}
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.5rem] px-8 py-7 text-white text-xl leading-relaxed focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all resize-none shadow-inner"
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
                        <div className="col-span-2 space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <Target className="w-4 h-4 text-zinc-400" /> 加分项与公司亮点
                            </label>
                            <textarea
                                rows={2}
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.5rem] px-8 py-7 text-white text-xl leading-relaxed focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all resize-none shadow-inner"
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
                        <div className="space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <ShieldCheck className="w-4 h-4 text-zinc-400" /> 最低学历
                            </label>
                            <input
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.25rem] px-8 py-6 text-white text-xl focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all shadow-inner"
                                value={editedJd.education}
                                onChange={(e) => handleChange('education', e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">
                                <Vote className="w-4 h-4 text-zinc-400" /> 软技能与文化契合
                            </label>
                            <input
                                className="w-full bg-white/[0.04] border border-white/[0.05] rounded-[1.25rem] px-8 py-6 text-white text-xl focus:bg-white/[0.08] focus:border-white/20 focus:ring-8 focus:ring-white/5 outline-none transition-all shadow-inner"
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

                    {/* 精致提示区域 */}
                    <div className="mt-8 p-10 rounded-[2.5rem] bg-white/[0.015] border border-white/[0.04] flex items-center gap-8 group hover:bg-white/[0.025] transition-all duration-700">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-900/40 flex items-center justify-center shrink-0 border border-white/[0.06] group-hover:scale-105 transition-transform duration-500">
                            <Activity className="w-7 h-7 text-blue-500/60" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-zinc-200 font-bold tracking-widest uppercase">Precision Matching</p>
                            <p className="text-[15px] text-zinc-400 leading-relaxed max-w-2xl">
                                系统将基于当前修正后的职位画像进行多维向量匹配。精确的描述能大幅提升 AI 对简历内容的筛选权重。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
