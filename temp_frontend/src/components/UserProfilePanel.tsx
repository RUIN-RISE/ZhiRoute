import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Shield,
    LogOut,
    Cloud,
    X,
    Archive,
    Activity,
} from 'lucide-react';

/**
 * 操作历史记录
 */
export interface TimelineRecord {
    id: string;
    type: 'jd_created' | 'resume_analyzed' | 'interview_started' | 'login' | 'other';
    title: string;
    detail: string;
    timestamp: number;
}

interface UserProfilePanelProps {
    userCode: string | null;
    onLogout: () => void;
    onLoginClick: () => void;
    isLoggedIn: boolean;
}

/** 从 localStorage 读取时间线记录 */
function loadTimeline(): TimelineRecord[] {
    try {
        const raw = localStorage.getItem('jobos_timeline');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** 写入时间线记录（外部也可调用） */
export function pushTimelineRecord(record: Omit<TimelineRecord, 'id' | 'timestamp'>) {
    const list = loadTimeline();
    list.unshift({
        ...record,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    });
    // 最多保留最近 50 条
    localStorage.setItem('jobos_timeline', JSON.stringify(list.slice(0, 50)));
}

/** 格式化时间为相对时间 */
function formatRelativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
}

/** 时间线记录类型对应的颜色 */
function getTypeColor(type: TimelineRecord['type']): string {
    switch (type) {
        case 'jd_created': return 'text-blue-400';
        case 'resume_analyzed': return 'text-emerald-400';
        case 'interview_started': return 'text-amber-400';
        case 'login': return 'text-purple-400';
        default: return 'text-zinc-400';
    }
}

/**
 * 用户信息面板 - 导航栏右侧
 * 包含：系统状态、历史记录按钮、用户名、同步状态、操作按钮、时间线下拉
 */
export function UserProfilePanel({ userCode, onLogout, onLoginClick, isLoggedIn }: UserProfilePanelProps) {
    const [showTimeline, setShowTimeline] = useState(false);
    const [timeline, setTimeline] = useState<TimelineRecord[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);

    // 加载时间线
    useEffect(() => {
        setTimeline(loadTimeline());
    }, [showTimeline]);

    // 点击外部关闭面板
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setShowTimeline(false);
            }
        };
        if (showTimeline) {
            document.addEventListener('mousedown', handler);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [showTimeline]);

    // 未登录：显示登录按钮
    if (!isLoggedIn) {
        return (
            <button
                onClick={onLoginClick}
                className="px-5 py-2 rounded-full border border-white/20 text-white text-sm hover:bg-white hover:text-black transition-colors font-medium"
            >
                登录
            </button>
        );
    }

    // 截取用户名显示
    const displayName = userCode
        ? (userCode.length > 12 ? userCode.substring(0, 12) : userCode)
        : 'user';

    const recentCount = timeline.length;

    return (
        <div className="flex items-center gap-3" ref={panelRef}>
            {/* 系统状态指示 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-zinc-400 font-medium">System Ready</span>
            </div>

            {/* 分隔线 */}
            <div className="hidden md:block w-px h-5 bg-white/10" />

            {/* 历史记录按钮 */}
            <button
                onClick={() => setShowTimeline(!showTimeline)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-medium ${showTimeline
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                    }`}
            >
                <Clock className="w-3.5 h-3.5" />
                <span>历史记录</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${showTimeline ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-zinc-500'
                    }`}>
                    {recentCount}
                </span>
            </button>

            {/* 分隔线 */}
            <div className="hidden md:block w-px h-5 bg-white/10" />

            {/* 用户名 & 同步状态 */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-white tracking-tight">{displayName}</span>
                    <div className="flex items-center gap-1">
                        <Cloud className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] text-zinc-500 font-medium">Cloud Synced</span>
                    </div>
                </div>

                {/* 安全按钮 */}
                <button
                    className="w-9 h-9 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 hover:border-white/20 transition-all group"
                    title="账号安全"
                >
                    <Shield className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>

                {/* 退出按钮 */}
                <button
                    onClick={onLogout}
                    className="w-9 h-9 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center hover:bg-red-950 hover:border-red-500/30 transition-all group"
                    title="退出登录"
                >
                    <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                </button>
            </div>

            {/* 时间线下拉面板 */}
            <AnimatePresence>
                {showTimeline && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute top-full right-0 mt-3 w-[400px] max-h-[520px] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[60]"
                    >
                        {/* 面板头部 */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <Archive className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">账号时间线</h3>
                                    <p className="text-[11px] text-zinc-500">云端同步的最近 10 条记录</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTimeline(false)}
                                className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* 时间线内容 */}
                        <div className="px-5 py-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {timeline.length === 0 ? (
                                /* 空状态 */
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-4">
                                        <Archive className="w-7 h-7 text-zinc-600" />
                                    </div>
                                    <p className="text-sm text-zinc-500 font-medium">暂无云端历史记录</p>
                                    <p className="text-xs text-zinc-600 mt-1">使用 JobOS 后，你的操作将在此处留下轨迹</p>
                                </div>
                            ) : (
                                /* 记录列表 */
                                <div className="space-y-1">
                                    {timeline.slice(0, 10).map((record, idx) => (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                                        >
                                            {/* 时间线竖线 & 圆点 */}
                                            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                                                <div className={`w-2 h-2 rounded-full ${getTypeColor(record.type).replace('text-', 'bg-')}`} />
                                                {idx < Math.min(timeline.length, 10) - 1 && (
                                                    <div className="w-px h-8 bg-white/5" />
                                                )}
                                            </div>
                                            {/* 内容 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-semibold ${getTypeColor(record.type)}`}>
                                                        {record.title}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                                                        {formatRelativeTime(record.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-0.5 truncate">{record.detail}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 面板底部 */}
                        {timeline.length > 0 && (
                            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                    <Activity className="w-3 h-3" />
                                    <span className="text-[11px]">共 {timeline.length} 条记录</span>
                                </div>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('jobos_timeline');
                                        setTimeline([]);
                                    }}
                                    className="text-[11px] text-zinc-600 hover:text-red-400 transition-colors"
                                >
                                    清空记录
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
