import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, ChevronRight, FileText, Search, Trash2, FolderOpen } from 'lucide-react';

export interface JDHistoryRecord {
    id: string;
    roleName: string;
    createdAt: number;
    descriptionSnippet: string;
    candidateCount: number;
    matchScoreAvg: number;
}

// 模拟历史数据
export const mockHistory: JDHistoryRecord[] = [
    {
        id: 'jd-001',
        roleName: '高级前端架构师',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        descriptionSnippet: '负责公司核心业务系统的架构设计与技术选型，带领团队完成百万级并发量的高可用架构重构...',
        candidateCount: 15,
        matchScoreAvg: 88
    },
    {
        id: 'jd-002',
        roleName: 'AI 算法专家 (LLM)',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
        descriptionSnippet: '深入参与百亿级参数大模型的微调、强化学习对齐 (RLHF) ，并主导模型在金融垂直领域的私有化落地部署...',
        candidateCount: 8,
        matchScoreAvg: 92
    },
    {
        id: 'jd-003',
        roleName: '资深产品经理 (B端商业化)',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14, // 14 days ago
        descriptionSnippet: '主导大型复杂B端 SaaS 产品的生命周期管理，建立增长模型并驱动商业化变现目标达成...',
        candidateCount: 23,
        matchScoreAvg: 85
    }
];

interface JDHistoryLibraryProps {
    onClose: () => void;
    onSelectJD: (jdId: string | number) => void;
    history: any[];
    onDelete?: (id: string | number) => void;
}

function formatRelativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return new Date(ts).toLocaleDateString();
}

// ... 保持原有导入 ...

export function JDHistoryLibrary({ onClose, onSelectJD, history, onDelete }: JDHistoryLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const records = useMemo(() => {
        return history.map(r => {
            const raw = r.content;
            const jdRaw = r.record_type === 'workspace' ? (raw?.jd_data ?? raw) : raw;
            const candidates = r.record_type === 'workspace' ? (raw?.candidates || []) : [];

            return {
                id: r.id,
                type: r.record_type,
                roleName: jdRaw?.title ?? jdRaw?.role ?? '未知职位',
                createdAt: new Date(r.created_at).getTime(),
                descriptionSnippet: jdRaw?.remarks ?? jdRaw?.salary?.range ?? '暂无详细描述',
                candidateCount: candidates.length,
                matchScoreAvg: candidates.length > 0 ? Math.round(candidates.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / candidates.length) : 0
            };
        });
    }, [history]);

    // 搜索和 10 条限制
    const filteredRecords = records
        .filter(r =>
            r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.descriptionSnippet.toLowerCase().includes(searchQuery.toLowerCase())
        )
        // 最多展示10条
        .slice(0, 10);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl h-[85vh] bg-[#111111] rounded-3xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden"
            >
                {/* 装饰光晕 */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 relative z-10 bg-[#111111]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center shadow-inner">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#f5f5f7] tracking-tight">候选人资产库</h2>
                            <p className="text-xs text-[#86868b] mt-0.5">历史保存的人才寻访配置集与简历 (展现最近 10 条)</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#86868b] hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 工具栏 */}
                <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 relative z-10">
                    <div className="relative group">
                        <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-400" />
                        <input
                            type="text"
                            placeholder="检索职位名称或关键词..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-72 bg-[#1c1c1e] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3]/50 focus:ring-1 focus:ring-[#0071e3]/50 transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* 列表区 */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide relative z-10">
                    {filteredRecords.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                            <FolderOpen className="w-12 h-12 text-zinc-700 mb-4" />
                            <p>暂无候选人资产库记录</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredRecords.map((record, idx) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-[#1c1c1e]/60 border border-white/5 hover:border-white/15 rounded-2xl p-6 flex items-start gap-6 transition-all hover:bg-[#2c2c2e]/60 cursor-pointer"
                                onClick={() => onSelectJD(record.id)}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-inner shrink-0 mt-1 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/20 border-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <FileText className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors relative z-10" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-[#f5f5f7] group-hover:text-white transition-colors tracking-tight">
                                            {record.roleName}
                                        </h3>
                                        <span className="text-xs font-mono text-[#86868b] bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                                            {formatRelativeTime(record.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#86868b] leading-relaxed mb-4">
                                        {record.descriptionSnippet}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <div className="flex items-center gap-1.5 text-zinc-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-blue-400 font-bold">{record.candidateCount}</span>
                                            <span>入库候选人</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-emerald-400 font-bold">{record.matchScoreAvg}</span>
                                            <span>平均匹配分</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-full flex items-center justify-center pl-6 border-l border-white/5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onDelete && confirm("确认要删除此记录吗？")) {
                                                onDelete(record.id);
                                            }
                                        }}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all mr-3"
                                        title="删除此记录"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onSelectJD(record.id)}
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0071e3]/10 text-blue-400 hover:bg-[#0071e3] hover:text-white transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
