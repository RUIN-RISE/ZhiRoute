import React from 'react';

/**
 * 表单标签组件（图标 + 文字）
 */
export function Label({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <label className="flex items-center gap-3 text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
            {icon} {text}
        </label>
    );
}
