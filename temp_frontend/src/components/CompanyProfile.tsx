import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Building2, Sparkles, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';

export interface CompanyProfile {
    industry: string;
    size: string;
    cultureKeywords: string[];
    recruitmentPreferences: string[];
    avoidPatterns: string[];
}

const INDUSTRY_OPTIONS = ['互联网 / SaaS', 'AI / 大模型', '金融 / FinTech', '电商 / 零售', '医疗健康', '教育科技', '制造业', '其他'];
const SIZE_OPTIONS = ['1-15人（天使期）', '16-50人（种子期）', '51-200人（A轮级）', '200人以上'];
const CULTURE_TAGS = ['执行力强', '自驱力', '学历背景优先', '结果导向', '快速成长', '跨部门协作', '创业精神'];
const PREF_TAGS = ['有相关行业经验', '有创业公司背景', '学历不限但经验要强', '有实际项目产出', '稳定性好（3年+）'];
const AVOID_TAGS = ['跳槽频繁（<1年）', '经历断层', '技能与JD不符', '薪资预期差距大', '无实际产出'];

const STEPS = ['公司基础', '招聘偏好', '避免踩坑'];

export function CompanyProfileSetup({ onComplete }: { onComplete: (profile: CompanyProfile) => void }) {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<CompanyProfile>({
        industry: '',
        size: '',
        cultureKeywords: [],
        recruitmentPreferences: [],
        avoidPatterns: [],
    });

    // 「其他」行业自填
    const [customIndustry, setCustomIndustry] = useState('');
    const [showIndustryInput, setShowIndustryInput] = useState(false);

    // 关键词自定义
    const [customCulture, setCustomCulture] = useState('');
    const [customPref, setCustomPref] = useState('');
    const [customAvoid, setCustomAvoid] = useState('');

    const toggleTag = (list: keyof Pick<CompanyProfile, 'cultureKeywords' | 'recruitmentPreferences' | 'avoidPatterns'>, tag: string) => {
        setProfile(prev => ({
            ...prev,
            [list]: prev[list].includes(tag) ? prev[list].filter(t => t !== tag) : [...prev[list], tag],
        }));
    };

    const addCustomTag = (list: keyof Pick<CompanyProfile, 'cultureKeywords' | 'recruitmentPreferences' | 'avoidPatterns'>, value: string, clear: () => void) => {
        const trimmed = value.trim();
        if (trimmed && !profile[list].includes(trimmed)) {
            setProfile(prev => ({ ...prev, [list]: [...prev[list], trimmed] }));
            clear();
        }
    };

    const removeTag = (list: keyof Pick<CompanyProfile, 'cultureKeywords' | 'recruitmentPreferences' | 'avoidPatterns'>, tag: string) => {
        setProfile(prev => ({ ...prev, [list]: prev[list].filter(t => t !== tag) }));
    };

    const canProceed = () => {
        if (step === 0) return profile.industry && profile.size;
        if (step === 1) return true; // 偏好可选
        return true;
    };

    const handleSelectIndustry = (opt: string) => {
        if (opt === '其他') {
            setShowIndustryInput(true);
            setProfile(p => ({ ...p, industry: '' }));
        } else {
            setShowIndustryInput(false);
            setCustomIndustry('');
            setProfile(p => ({ ...p, industry: opt }));
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* 进度条 */}
                <div className="flex border-b border-white/5">
                    {STEPS.map((s, i) => (
                        <div key={s} className={`flex-1 py-3.5 text-center text-xs font-semibold transition-all relative ${i <= step ? 'text-[#2997ff]' : 'text-zinc-600'}`}>
                            {i < step && <span className="mr-1">✓</span>}
                            {s}
                            {i <= step && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0071e3]" />}
                        </div>
                    ))}
                </div>

                <div className="p-8 relative z-10 max-h-[70vh] overflow-y-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            {step === 0 && <Building2 className="w-5 h-5 text-[#0071e3]" />}
                            {step === 1 && <Sparkles className="w-5 h-5 text-[#0071e3]" />}
                            {step === 2 && <AlertCircle className="w-5 h-5 text-[#0071e3]" />}
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {step === 0 && '告诉我们关于你的公司'}
                                {step === 1 && '你们招人时最看重什么？'}
                                {step === 2 && '过去踩过哪些坑？'}
                            </h2>
                        </div>
                        <p className="text-sm text-zinc-500 ml-8">
                            {step === 0 && '这些信息帮助 AI 调整招聘策略，为你的语境量身推荐。'}
                            {step === 1 && '设置越精准，AI 的匹配权重越个性化。（全部可选）'}
                            {step === 2 && '命中这些特征的候选人会被自动降权但不隐藏，最终决定权在您。（全部可选）'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 0: 基础信息 */}
                        {step === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3 block">所在行业</label>
                                    <div className="flex flex-wrap gap-2">
                                        {INDUSTRY_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => handleSelectIndustry(opt)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${(opt === '其他' && showIndustryInput) || profile.industry === opt
                                                        ? 'bg-[#0071e3] text-white shadow-[0_0_12px_rgba(0,113,227,0.4)]'
                                                        : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                                                    }`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    {showIndustryInput && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex gap-2">
                                            <input
                                                autoFocus
                                                value={customIndustry}
                                                onChange={e => { setCustomIndustry(e.target.value); setProfile(p => ({ ...p, industry: e.target.value })); }}
                                                placeholder="请输入您的行业..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0071e3]/50 placeholder-zinc-600"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3 block">公司规模</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZE_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => setProfile(p => ({ ...p, size: opt }))}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${profile.size === opt ? 'bg-[#0071e3] text-white shadow-[0_0_12px_rgba(0,113,227,0.4)]' : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: 招聘偏好 */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3 block">文化契合关键词</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {CULTURE_TAGS.map(tag => (
                                            <button key={tag} onClick={() => toggleTag('cultureKeywords', tag)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${profile.cultureKeywords.includes(tag) ? 'bg-[#0071e3] text-white shadow-[0_0_12px_rgba(0,113,227,0.4)]' : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'}`}>
                                                {profile.cultureKeywords.includes(tag) && <CheckCircle2 size={12} />}
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {/* 自定义关键词 */}
                                    <div className="flex gap-2">
                                        <input value={customCulture} onChange={e => setCustomCulture(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addCustomTag('cultureKeywords', customCulture, () => setCustomCulture(''))}
                                            placeholder="自定义关键词..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#0071e3]/50 placeholder-zinc-600" />
                                        <button onClick={() => addCustomTag('cultureKeywords', customCulture, () => setCustomCulture(''))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><Plus size={16} /></button>
                                    </div>
                                    {profile.cultureKeywords.filter(x => !CULTURE_TAGS.includes(x)).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {profile.cultureKeywords.filter(x => !CULTURE_TAGS.includes(x)).map(t => (
                                                <span key={t} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-medium flex items-center gap-1">
                                                    {t} <X size={10} className="cursor-pointer" onClick={() => removeTag('cultureKeywords', t)} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3 block">招聘偏好</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {PREF_TAGS.map(tag => (
                                            <button key={tag} onClick={() => toggleTag('recruitmentPreferences', tag)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${profile.recruitmentPreferences.includes(tag) ? 'bg-[#0071e3] text-white shadow-[0_0_12px_rgba(0,113,227,0.4)]' : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'}`}>
                                                {profile.recruitmentPreferences.includes(tag) && <CheckCircle2 size={12} />}
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input value={customPref} onChange={e => setCustomPref(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addCustomTag('recruitmentPreferences', customPref, () => setCustomPref(''))}
                                            placeholder="自定义偏好..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#0071e3]/50 placeholder-zinc-600" />
                                        <button onClick={() => addCustomTag('recruitmentPreferences', customPref, () => setCustomPref(''))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><Plus size={16} /></button>
                                    </div>
                                    {profile.recruitmentPreferences.filter(x => !PREF_TAGS.includes(x)).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {profile.recruitmentPreferences.filter(x => !PREF_TAGS.includes(x)).map(t => (
                                                <span key={t} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-medium flex items-center gap-1">
                                                    {t} <X size={10} className="cursor-pointer" onClick={() => removeTag('recruitmentPreferences', t)} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: 避坑 */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {AVOID_TAGS.map(tag => (
                                        <button key={tag} onClick={() => toggleTag('avoidPatterns', tag)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${profile.avoidPatterns.includes(tag) ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'}`}>
                                            {profile.avoidPatterns.includes(tag) && '⚠ '}
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input value={customAvoid} onChange={e => setCustomAvoid(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomTag('avoidPatterns', customAvoid, () => setCustomAvoid(''))}
                                        placeholder="自定义踩坑项..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/30 placeholder-zinc-600" />
                                    <button onClick={() => addCustomTag('avoidPatterns', customAvoid, () => setCustomAvoid(''))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Plus size={16} /></button>
                                </div>
                                {profile.avoidPatterns.filter(x => !AVOID_TAGS.includes(x)).length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.avoidPatterns.filter(x => !AVOID_TAGS.includes(x)).map(t => (
                                            <span key={t} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1">
                                                {t} <X size={10} className="cursor-pointer" onClick={() => removeTag('avoidPatterns', t)} />
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                    <p className="text-xs text-blue-400/80 leading-relaxed">
                                        <strong>提示：</strong>选中的踩坑项将追加到 AI 评分指令中，命中这些特征的候选人会被降权但不隐藏，最终决定权仍在您。
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 底部操作 */}
                    <div className="flex justify-between items-center mt-8">
                        <button
                            onClick={() => step > 0 && setStep(s => s - 1)}
                            className={`text-sm text-zinc-500 hover:text-zinc-300 transition-colors ${step === 0 ? 'invisible' : ''}`}
                        >← 上一步</button>
                        <button
                            onClick={() => {
                                if (step < STEPS.length - 1) {
                                    setStep(s => s + 1);
                                } else {
                                    const final = { ...profile, industry: profile.industry || customIndustry };
                                    localStorage.setItem('company_profile', JSON.stringify(final));
                                    onComplete(final);
                                }
                            }}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-95 shadow-[0_0_20px_rgba(0,113,227,0.3)]"
                        >
                            {step < STEPS.length - 1 ? '下一步' : '完成设置，开始招聘'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="text-center pb-5">
                    <p className="text-[11px] text-zinc-700">这些信息仅存储在本地，随时可在设置中修改</p>
                </div>
            </motion.div>
        </div>
    );
}
