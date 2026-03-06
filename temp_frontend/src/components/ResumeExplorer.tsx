import { useState } from 'react';
import { ChevronLeft, Search, Filter, Upload, FileText, Star, MapPin, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 模拟简历数据
const MOCK_RESUMES = [
    {
        id: '1',
        name: '张明远',
        title: '高级全栈工程师',
        exp: '6年',
        edu: '硕士 · 浙江大学',
        location: '杭州',
        skills: ['React', 'Node.js', 'System Architecture', 'AWS'],
        match: 95,
        summary: '拥有从0到1架构高并发系统的经验，精通前后端分离与微服务架构，曾主导过百万日活电商平台的核心链路重构。',
        status: '新建'
    },
    {
        id: '2',
        name: '李清照',
        title: '高级产品经理',
        exp: '5年',
        edu: '本科 · 复旦大学',
        location: '上海',
        skills: ['B端产品', '数据分析', '增长黑客', 'Axure'],
        match: 88,
        summary: '具备敏锐的商业嗅觉和卓越的数据分析能力，主导过多个B端SaaS产品的从0到1，带领团队实现年订阅转化率提升30%。',
        status: '已看'
    },
    {
        id: '3',
        name: '王小波',
        title: 'AI 算法专家',
        exp: '4年',
        edu: '博士 · 北京大学',
        location: '北京',
        skills: ['PyTorch', 'NLP', 'LLM', 'Python'],
        match: 92,
        summary: '深耕自然语言处理领域，在ACL等顶会发表过多篇论文。参与过百亿级参数大模型的微调与私有化部署工作。',
        status: '一面'
    },
    {
        id: '4',
        name: '赵子龙',
        title: '前端架构师',
        exp: '8年',
        edu: '本科 · 华中科技大学',
        location: '深圳',
        skills: ['Vue3', 'TypeScript', '性能规划', '工程化'],
        match: 90,
        summary: '精通前端工程化，主导过公司内自研前端框架的搭建，大幅提升团队开发效率。对 WebGL 也有深入研究。',
        status: '已淘汰'
    },
    {
        id: '5',
        name: '孙尚香',
        title: 'UI/UX 设计师',
        exp: '3年',
        edu: '硕士 · 皇家艺术学院',
        location: '上海',
        skills: ['Figma', '交互设计', '设计系统', 'C4D'],
        match: 85,
        summary: '拥有国际视野的体验设计师，不仅擅长视觉表达，更能从业务逻辑出发完成复杂系统的交互设计，沉淀过两套设计系统。',
        status: '储备'
    }
];

const CATEGORIES = ['全部简历', '研发技术', '产品设计', '市场运营', '职能管理'];

export function ResumeExplorer({ onBack }: { onBack: () => void }) {
    const [activeCategory, setActiveCategory] = useState('全部简历');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    const selectedResume = MOCK_RESUMES.find(r => r.id === selectedResumeId);

    // 过滤逻辑
    const filteredResumes = MOCK_RESUMES.filter(r => {
        const matchSearch = r.name.includes(searchQuery) || r.title.includes(searchQuery) || r.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchSearch; // 这里暂时简化分类过滤，全量搜索
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#0a0a0c] text-zinc-200 flex flex-col z-40 overflow-hidden"
        >
            {/* 顶部导航 */}
            <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02] backdrop-blur-xl relative z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
                    >
                        <ChevronLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <h1 className="text-xl font-medium tracking-wide">星云简历库</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="搜索姓名、职位或技能..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/40 border border-white/10 text-sm rounded-full pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all text-zinc-200 placeholder:text-zinc-600"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-sm font-medium">
                        <Upload className="w-4 h-4" />
                        导入简历
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 左侧侧边栏 - 分类与标签 */}
                <aside className="w-64 shrink-0 border-r border-white/5 bg-white/[0.01] flex flex-col p-4">
                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-2">简历分类</h2>
                        <div className="space-y-1">
                            {CATEGORIES.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${activeCategory === category
                                        ? 'bg-blue-500/10 text-blue-400 font-medium'
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                        }`}
                                >
                                    {category}
                                    {category === '全部简历' && <span className="text-xs opacity-50 bg-white/10 px-1.5 py-0.5 rounded-md">{MOCK_RESUMES.length}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-2">快捷筛选</h2>
                        <div className="space-y-2">
                            <button className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> 90分以上高匹配
                            </button>
                            <button className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> 5年以上经验
                            </button>
                        </div>
                    </div>
                </aside>

                {/* 中间主视口 - 简历网格系列 */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-white">找到 {filteredResumes.length} 份候选人简历</h2>
                        <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition group border border-white/10 px-3 py-1.5 rounded-lg bg-white/5">
                            <Filter className="w-4 h-4 group-hover:text-blue-400 transition" />
                            详细过滤条件
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        <AnimatePresence>
                            {filteredResumes.map((resume, idx) => (
                                <motion.div
                                    key={resume.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedResumeId(resume.id)}
                                    className={`group cursor-pointer relative p-5 rounded-2xl border transition-all duration-300 ${selectedResumeId === resume.id
                                        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'bg-[#151518]/50 border-white/5 hover:bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    {/* 发光高亮效果 */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:to-blue-500/5 transition-all duration-500" />

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center font-bold text-white shadow-inner">
                                                {resume.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">{resume.name}</h3>
                                                <p className="text-xs text-zinc-500">{resume.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md border border-green-400/20">
                                                {resume.match}% 匹配
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4 relative z-10">
                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {resume.exp}</span>
                                        <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {resume.edu}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {resume.location}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                                        {resume.skills.slice(0, 3).map(skill => (
                                            <span key={skill} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                                                {skill}
                                            </span>
                                        ))}
                                        {resume.skills.length > 3 && (
                                            <span className="text-[10px] px-1.5 py-1 rounded-md bg-transparent text-zinc-500">+{resume.skills.length - 3}</span>
                                        )}
                                    </div>

                                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed relative z-10">
                                        {resume.summary}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </main>

                {/* 右侧边栏 - 简历细节弹出/侧展板 */}
                <AnimatePresence>
                    {selectedResume && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 400, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-white/5 bg-[#0f0f12] shrink-0 overflow-y-auto"
                        >
                            <div className="w-[400px] p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-medium text-white">AI 分析洞察</h3>
                                    <button onClick={() => setSelectedResumeId(null)} className="text-zinc-500 hover:text-white transition text-xs">关闭</button>
                                </div>

                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center text-xl font-bold text-white">
                                        {selectedResume.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-medium text-white">{selectedResume.name}</h2>
                                        <p className="text-zinc-400 text-sm mt-1">{selectedResume.title}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 text-blue-400" /> 核心亮点
                                        </h4>
                                        <p className="text-sm text-zinc-300 leading-relaxed bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                                            {selectedResume.summary}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Award className="w-3.5 h-3.5 text-purple-400" /> 技能图谱
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedResume.skills.map(skill => (
                                                <div key={skill} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300">
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/5 flex gap-3">
                                        <button className="flex-1 bg-white text-black py-2.5 rounded-xl font-medium text-sm hover:bg-zinc-200 transition">安排面试</button>
                                        <button className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-white/10 transition">查看原件</button>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
}
