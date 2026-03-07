import { useState } from 'react';
import {
    Search, Upload, Users, Code, PenTool,
    Megaphone, Briefcase, MapPin,
    GraduationCap, Clock, ChevronLeft, MoreHorizontal, Zap, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    { id: '全部简历', label: '全部简历', icon: Users },
    { id: '研发技术', label: '研发技术', icon: Code },
    { id: '产品设计', label: '产品设计', icon: PenTool },
    { id: '市场运营', label: '市场运营', icon: Megaphone },
    { id: '职能管理', label: '职能管理', icon: Briefcase },
];

export interface ResumeExplorerProps {
    onBack: () => void;
    isLoggedIn?: boolean;
    onRequireLogin?: () => void;
    onStartJobFlow?: (hint?: string) => void;
    resumes?: any[];
}

export function ResumeExplorer({ onBack, isLoggedIn = true, onRequireLogin, onStartJobFlow, resumes = [] }: ResumeExplorerProps) {
    const [activeCategory, setActiveCategory] = useState('全部简历');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    const selectedResume = resumes.find(r => r.id === selectedResumeId);

    // 过滤逻辑
    const filteredResumes = resumes.filter(r => {
        const matchSearch = !searchQuery || (r.name || '').includes(searchQuery) || (r.title && r.title.includes(searchQuery)) || (r.skills || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchSearch;
    }).sort((a, b) => (b.match || 0) - (a.match || 0));

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[1400px] mx-auto flex bg-black text-[#f5f5f7] antialiased selection:bg-[#2997ff]/30 h-[calc(100vh-6rem)] rounded-xl overflow-hidden shadow-2xl border border-white/5 relative z-10"
        >
            {/* 左侧侧边栏 */}
            <aside className="w-64 flex-shrink-0 border-r border-white/[0.08] bg-[#1c1c1e] flex flex-col relative z-20">
                {/* Logo/标题区 */}
                <div className="flex flex-col gap-4 p-6 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 text-[#86868b] transition-colors shrink-0">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-500" /> 人才大盘
                        </h2>
                    </div>
                    <div className="flex justify-between items-end px-1">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none pb-1">已就绪</div>
                        <div className="text-3xl font-black text-white leading-none">{resumes.length}</div>
                    </div>
                </div>

                {/* 视图分类 */}
                <div className="px-4 py-2 flex-1 overflow-y-auto scrollbar-hide">
                    <div className="text-[11px] font-semibold text-[#86868b] mb-3 px-2 uppercase tracking-widest">视图分类</div>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveCategory(item.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeCategory === item.id
                                        ? 'bg-[#0071e3]/15 text-[#2997ff]'
                                        : 'text-[#a1a1a6] hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon size={18} className={activeCategory === item.id ? 'text-[#2997ff]' : 'text-[#86868b]'} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 flex flex-col h-full bg-[#0a0a0c] relative">
                {/* 顶部导航栏 (Header) */}
                <header className="h-[88px] flex-shrink-0 flex items-center justify-between px-8 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.04] z-10 w-full">
                    <div className="flex flex-col space-y-1.5">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#a8c8e1] to-[#78a2c1] tracking-tight">
                            发现卓越人才
                        </h2>
                        <span className="text-xs font-medium text-[#86868b]">
                            智能分析与精准推荐
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* 发起新招聘按钮 */}
                        {onStartJobFlow && (
                            <button
                                onClick={() => onStartJobFlow()}
                                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold transition-all hover:bg-[#f5f5f7] shadow-md active:scale-95"
                            >
                                <Zap size={14} />
                                <span>发起新招聘</span>
                            </button>
                        )}
                        {/* 深色搜索框 */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" size={16} />
                            <input
                                type="text"
                                placeholder="通过姓名、职位检索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-[#1c1c1e] border border-white/[0.08] rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all text-white placeholder:text-[#86868b]"
                            />
                        </div>

                        {/* 简历数据统计与操作区 */}
                        <div className="flex items-center bg-[#1d1d1f] rounded-full p-1 border border-white/[0.05] shadow-sm">
                            <div className="flex flex-col mx-3 justify-center">
                                <span className="text-[11px] text-white font-medium leading-tight whitespace-nowrap">
                                    共 {filteredResumes.length} 份档案
                                </span>
                                <span className="text-[10px] text-[#86868b] leading-tight mt-0.5 whitespace-nowrap">
                                    按匹配度排序
                                </span>
                            </div>
                            <button className="flex items-center space-x-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors border-none">
                                <Upload size={14} />
                                <span>导入简历</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* 卡片网格区 (Content) */}
                <div className="flex-1 p-8 overflow-y-auto scrollbar-hide relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        <AnimatePresence>
                            {filteredResumes.map((resume, idx) => (
                                <motion.div
                                    key={resume.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    onClick={() => setSelectedResumeId(resume.id)}
                                    className={`group rounded-3xl p-6 shadow-md border transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden ${selectedResumeId === resume.id
                                        ? 'bg-[#161618] border-[#0071e3]/50 shadow-[0_0_15px_rgba(0,113,227,0.15)] ring-1 ring-[#0071e3]/30 scale-[1.02]'
                                        : 'bg-[#111111] border-white/[0.06] hover:bg-[#161618] hover:border-white/[0.12] hover:-translate-y-1 hover:shadow-lg'
                                        }`}
                                >
                                    {/* 卡片微弱的顶部反光，增加立体金属质感 */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                                    {/* 头部：姓名、职位、匹配度 */}
                                    <div className="flex justify-between items-start mb-5 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-semibold text-[#f5f5f7] leading-tight">{resume.name}</h3>
                                            <p className="text-sm text-[#86868b] mt-1.5">{resume.title}</p>
                                        </div>

                                        <div className="flex flex-col items-end space-y-2">
                                            {/* 专业深色模式风格的徽标 */}
                                            <div className={`border px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wider ${resume.match >= 90
                                                ? 'bg-[#0071e3]/10 border-[#0071e3]/20 text-[#2997ff]'
                                                : 'bg-[#1c1c1e] border-white/[0.08] text-[#a1a1a6]'
                                                }`}>
                                                匹配度 <span className="text-white font-bold ml-1">{resume.match}%</span>
                                            </div>
                                            <button className="text-[#86868b] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 履历元数据 (Meta Info) */}
                                    <div className="flex items-center space-x-3 text-xs font-medium text-[#86868b] mb-5 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.02]">
                                        <div className="flex items-center space-x-1.5 shrink-0">
                                            <Clock size={14} className="text-[#6e6e73]" />
                                            <span>{resume.exp}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-[#3a3a3c] shrink-0" />
                                        <div className="flex items-center space-x-1.5 truncate">
                                            <GraduationCap size={14} className="text-[#6e6e73] shrink-0" />
                                            <span className="truncate">{resume.edu}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-[#3a3a3c] shrink-0" />
                                        <div className="flex items-center space-x-1.5 shrink-0">
                                            <MapPin size={14} className="text-[#6e6e73] shrink-0" />
                                            <span>{resume.location}</span>
                                        </div>
                                    </div>

                                    {/* 技能标签 (Tags) */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {resume.skills.slice(0, 3).map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2.5 py-1 bg-[#1c1c1e] border border-white/[0.05] rounded-lg text-[10px] font-semibold text-[#a1a1a6] tracking-wider capitalize"
                                            >
                                                {tag.toLowerCase()}
                                            </span>
                                        ))}
                                        {resume.skills.length > 3 && (
                                            <span className="px-2 py-1 bg-transparent text-[10px] font-semibold text-[#6e6e73] tracking-wider">
                                                +{resume.skills.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    {/* 个人简介 (Description) */}
                                    <div className="mt-auto pt-4 border-t border-white/[0.06]">
                                        <p className="text-[13px] text-[#86868b] leading-relaxed">
                                            {resume.summary}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 侧展板 */}
                <AnimatePresence>
                    {selectedResume && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0, x: 20 }}
                            animate={{ width: 420, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: 20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-[#1c1c1e]/95 border-l border-white/[0.08] backdrop-blur-3xl overflow-hidden shadow-[-20px_0_30px_rgba(0,0,0,0.5)] z-50 absolute right-0 top-0 bottom-0"
                        >
                            <div className="w-[420px] h-full absolute top-0 left-0 overflow-y-auto p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold pl-2 border-l-2 border-[#0071e3]">候选人深度分析</p>
                                    <button onClick={() => setSelectedResumeId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[#86868b] hover:text-white shadow-sm">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex items-center gap-5 mb-10">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
                                        {selectedResume.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight text-[#f5f5f7] leading-tight flex items-center gap-3">
                                            {selectedResume.name}
                                        </h2>
                                        <p className="text-[#a8c8e1] text-sm mt-1 mb-2.5 font-medium">{selectedResume.title}</p>
                                        <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border shadow-sm ${selectedResume.match >= 90 ? 'text-[#2997ff] bg-[#0071e3]/10 border-[#0071e3]/20' : 'text-[#a1a1a6] bg-[#1c1c1e] border-white/[0.08]'}`}>
                                            综合匹配得分: {selectedResume.match}/100
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-8 flex-1">
                                    <section>
                                        <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-widest mb-3 flex items-center gap-2">
                                            核心履历摘要
                                        </h3>
                                        <div className="bg-[#111111] border border-white/[0.06] p-5 rounded-2xl shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            <p className="text-[13px] text-[#a1a1a6] leading-relaxed font-light relative z-10">
                                                {selectedResume.summary}
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-widest mb-3 flex items-center gap-2">
                                            能力图谱
                                        </h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {(selectedResume.skills || []).map((skill: string) => (
                                                <div key={skill} className="px-3.5 py-1.5 rounded-lg bg-[#1c1c1e] border border-white/[0.05] text-[11px] font-medium text-[#a1a1a6] hover:bg-[#2c2c2e] transition-colors shadow-sm cursor-default capitalize">
                                                    {skill.toLowerCase()}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-widest mb-3 flex items-center gap-2">
                                            深度打分依据与原文
                                        </h3>
                                        <div className="space-y-3">
                                            {(selectedResume.evidence || []).map((ev: any, i: number) => (
                                                <div key={i} className="bg-[#111111] border border-white/[0.06] p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-[#0071e3]/30 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-[12px] font-semibold text-[#f5f5f7] tracking-wide">{ev.criteria}</h4>
                                                    </div>
                                                    <p className="text-[12px] text-[#a1a1a6] leading-relaxed mb-3 font-light">
                                                        {ev.reasoning}
                                                    </p>

                                                    {/* 原文证据折叠卡片 */}
                                                    {ev.quote && (
                                                        <div className="bg-[#1c1c1e] border-l-2 border-[#0071e3] p-3 rounded-r-lg">
                                                            <p className="text-[11px] font-mono text-[#86868b] italic leading-relaxed">
                                                                "{ev.quote}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!selectedResume.evidence || selectedResume.evidence.length === 0) && (
                                                <div className="text-[11px] text-[#86868b] italic mt-2">
                                                    无明确评分证据
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col gap-2.5 shrink-0">
                                    <div className="flex gap-2.5">
                                        <button className="flex-1 bg-[#0071e3] hover:bg-[#0077ED] text-white py-3 rounded-full font-medium transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(0,113,227,0.3)] border-none text-[13px]">
                                            发起智能面试
                                        </button>
                                        <button className="flex-1 bg-[#1c1c1e] border border-white/[0.08] text-[#f5f5f7] py-3 rounded-full font-medium text-[13px] hover:bg-[#2c2c2e] transition-all active:scale-95">
                                            调阅原文件
                                        </button>
                                    </div>
                                    {onStartJobFlow && (
                                        <button
                                            onClick={() => onStartJobFlow(selectedResume.title)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-[13px] font-medium transition-all active:scale-95"
                                        >
                                            <Zap size={13} />
                                            以 TA 为人才画像，发起专属招聘
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

            </main>

        </motion.div >
    );
}
