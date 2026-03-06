import { useState } from 'react';
import {
    Search, Upload, Filter, Users, Code, PenTool,
    Megaphone, Briefcase, Star, Award, MapPin,
    GraduationCap, Clock, ChevronLeft, MoreHorizontal, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 模拟简历数据
const MOCK_RESUMES = [
    {
        id: '1',
        name: "张明远",
        title: "高级全栈工程师",
        match: 95,
        exp: "6年",
        edu: "硕士 · 浙江大学",
        location: "杭州",
        skills: ["REACT", "NODE.JS", "SYSTEM ARCHITECTURE", "AWS"],
        summary: "拥有从0到1架构高并发系统的经验，精通前后端分离与微服务架构，曾主导过百万日活电商平台的核心链路重构。"
    },
    {
        id: '2',
        name: "李清照",
        title: "高级产品经理",
        match: 88,
        exp: "5年",
        edu: "本科 · 复旦大学",
        location: "上海",
        skills: ["B端产品", "数据分析", "增长黑客", "Axure"],
        summary: "具备敏锐的商业嗅觉和卓越的数据分析能力，主导过多个B端SaaS产品的从0到1，带领团队实现年订阅转化率提升30%。"
    },
    {
        id: '3',
        name: "王小波",
        title: "AI 算法专家",
        match: 92,
        exp: "4年",
        edu: "博士 · 北京大学",
        location: "北京",
        skills: ["PYTORCH", "NLP", "LLM", "Python"],
        summary: "深耕自然语言处理领域，在ACL等顶会发表过多篇论文。参与过百亿级参数大模型的微调与私有化部署工作。"
    },
    {
        id: '4',
        name: "赵子龙",
        title: "前端架构师",
        match: 90,
        exp: "8年",
        edu: "本科 · 华中科技大学",
        location: "深圳",
        skills: ["VUE3", "TYPESCRIPT", "性能规划", "工程化"],
        summary: "精通前端工程化，主导过公司内自研前端框架的搭建，大幅提升团队开发效率。对 WebGL 也有深入研究。"
    },
    {
        id: '5',
        name: "孙尚香",
        title: "UI/UX 设计师",
        match: 85,
        exp: "3年",
        edu: "硕士 · 皇家艺术学院",
        location: "上海",
        skills: ["FIGMA", "交互设计", "设计系统", "C4D"],
        summary: "拥有国际视野的体验设计师，不仅擅长视觉表达，更能从业务逻辑出发完成复杂系统的交互设计，沉淀过两套设计系统。"
    }
];

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
}

export function ResumeExplorer({ onBack, isLoggedIn = true, onRequireLogin, onStartJobFlow }: ResumeExplorerProps) {
    const [activeCategory, setActiveCategory] = useState('全部简历');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    // 人才项目保存功能
    const [savedProjects, setSavedProjects] = useState<{ id: string, name: string, count: number }[]>([
        { id: 'proj-1', name: '2026-前端架构师寻访', count: 4 }
    ]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const selectedResume = MOCK_RESUMES.find(r => r.id === selectedResumeId);

    // 过滤逻辑
    const filteredResumes = MOCK_RESUMES.filter(r => {
        const matchSearch = r.name.includes(searchQuery) || r.title.includes(searchQuery) || r.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchSearch;
    });

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
                <div className="h-[88px] flex items-center px-6">
                    <button onClick={onBack} className="p-1.5 mr-3 rounded-lg hover:bg-white/10 text-[#86868b] transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-lg font-semibold tracking-tight text-[#f5f5f7]">人才库</h1>
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

                    {/* 智能筛选 */}
                    <div className="mt-8 text-[11px] font-semibold text-[#86868b] mb-3 px-2 uppercase tracking-widest">智能筛选</div>
                    <nav className="space-y-1">
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#a1a1a6] hover:bg-white/10 hover:text-white transition-colors">
                            <Star size={18} className="text-[#86868b]" />
                            <span>极高匹配潜力 (90%+)</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#a1a1a6] hover:bg-white/10 hover:text-white transition-colors">
                            <Award size={18} className="text-[#86868b]" />
                            <span>资深研发背景</span>
                        </button>
                    </nav>

                    {/* 我的人才项目池 */}
                    <div className="mt-8 text-[11px] font-semibold text-[#86868b] mb-3 px-2 uppercase tracking-widest">已保存的项目库</div>
                    <nav className="space-y-1">
                        {savedProjects.map(proj => (
                            <button
                                key={proj.id}
                                onClick={() => setActiveCategory(proj.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeCategory === proj.id
                                    ? 'bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#2997ff]'
                                    : 'text-[#a1a1a6] hover:bg-white/10 hover:text-white border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <div className={`w-2 h-2 rounded-full ${activeCategory === proj.id ? 'bg-[#2997ff]' : 'bg-[#86868b]'} shrink-0`} />
                                    <span className="truncate">{proj.name}</span>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${activeCategory === proj.id ? 'bg-[#0071e3]/20' : 'bg-white/10'}`}>
                                    {proj.count}
                                </span>
                            </button>
                        ))}
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

                        <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/[0.08] text-sm font-medium text-[#f5f5f7] transition-colors shadow-sm">
                            <Filter size={14} />
                            <span>高级过滤</span>
                        </button>

                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    onRequireLogin?.();
                                    return;
                                }
                                setShowSaveModal(true);
                            }}
                            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3]/20 border border-[#0071e3]/30 text-sm font-medium text-[#2997ff] transition-colors shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            <span>快照建库</span>
                        </button>

                        {/* 简历数据统计与操作区 */}
                        <div className="flex items-center bg-[#1d1d1f] rounded-full p-1 border border-white/[0.05] shadow-sm">
                            <div className="flex flex-col mx-3 justify-center">
                                <span className="text-[11px] text-white font-medium leading-tight whitespace-nowrap">
                                    共 {filteredResumes.length} 份档案
                                </span>
                                <span className="text-[10px] text-[#86868b] leading-tight mt-0.5 whitespace-nowrap">
                                    实时更新
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
                                        {resume.skills.slice(0, 3).map((tag, index) => (
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
                            className="bg-[#1c1c1e]/80 shrink-0 border-l border-white/[0.08] backdrop-blur-3xl relative overflow-hidden shadow-[-20px_0_30px_rgba(0,0,0,0.5)] z-20 h-full absolute right-0 top-0"
                        >
                            <div className="w-[420px] h-full absolute inset-0 overflow-y-auto p-8 flex flex-col">
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
                                            <Star className="w-3.5 h-3.5 text-[#0071e3]" /> 核心履历摘要
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
                                            <Award className="w-3.5 h-3.5 text-[#0071e3]" /> 能力图谱
                                        </h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {selectedResume.skills.map(skill => (
                                                <div key={skill} className="px-3.5 py-1.5 rounded-lg bg-[#1c1c1e] border border-white/[0.05] text-[11px] font-medium text-[#a1a1a6] hover:bg-[#2c2c2e] transition-colors shadow-sm cursor-default capitalize">
                                                    {skill.toLowerCase()}
                                                </div>
                                            ))}
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

            {/* 短名单保存弹窗 */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-[400px] bg-[#1c1c1e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">存档为人才池</h3>
                            <p className="text-sm text-[#86868b] mb-5">将当前视图下筛选出的 {filteredResumes.length} 份顶级人才档案固化保存，以便随时复用。</p>

                            <input
                                autoFocus
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                placeholder="输入项目名称，例如：前端高端寻访..."
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0071e3]/50 focus:ring-1 focus:ring-[#0071e3] transition-all mb-6 placeholder-[#48484a]"
                            />

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => { setShowSaveModal(false); setNewProjectName(''); }}
                                    className="px-5 py-2 rounded-full border border-white/10 text-sm font-medium text-[#86868b] hover:text-white hover:bg-white/5 transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        if (newProjectName.trim()) {
                                            const newProj = { id: `proj-${Date.now()}`, name: newProjectName.trim(), count: filteredResumes.length };
                                            setSavedProjects([...savedProjects, newProj]);
                                            setActiveCategory(newProj.id);
                                            setShowSaveModal(false);
                                            setNewProjectName('');
                                        }
                                    }}
                                    className="px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] border border-transparent shadow-[0_0_15px_rgba(0,113,227,0.4)] text-sm font-medium text-white transition-all active:scale-95"
                                >
                                    确认存档
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
