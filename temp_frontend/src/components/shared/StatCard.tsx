import React from 'react';
import { cn } from '../../lib/utils';

/**
 * 统计指标卡片（用于仪表盘顶部展示关键数字）
 */
export function StatCard({
    label,
    value,
    icon,
    highlight = false,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                'bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group',
                highlight && 'bg-indigo-900/10 border-indigo-500/20'
            )}
        >
            {highlight && (
                <div className="absolute inset-0 bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-colors" />
            )}
            <div className="flex justify-between items-start relative z-10">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <div
                className={cn(
                    'text-4xl font-black tracking-tighter relative z-10',
                    highlight ? 'text-indigo-100' : 'text-white'
                )}
            >
                {value}
            </div>
        </div>
    );
}
