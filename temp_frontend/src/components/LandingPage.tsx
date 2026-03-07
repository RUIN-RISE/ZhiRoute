import { useState, useEffect } from 'react';
import { ArrowRight, Radar } from 'lucide-react';
import { START_SUGGESTIONS } from '../types';

// 打字机速度常量（毫秒）
const TYPE_SPEED = 100;       // 每个字符的打字间隔
const DELETE_SPEED = 50;      // 每个字符的删除间隔
const PAUSE_AFTER_WORD = 2500; // 打完一句后的停顿
const PAUSE_BEFORE_NEXT = 600; // 删完后开始下一句前的停顿

/**
 * 首页：居中布局 + 大字体 + indigo 配色
 */
export function LandingPage({ onStart, onOpenResumes, isLoggedIn }: {
    onStart: (role: string) => void;
    onOpenResumes: () => void;
    isLoggedIn?: boolean;
}) {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderText, setPlaceholderText] = useState('');

    // 简单可靠的基于 Timeout 的打字机机制
    useEffect(() => {
        if (isFocused || input.length > 0) {
            setPlaceholderText('');
            return;
        }

        let timeoutId: number;

        const typeNext = (wordIdx: number, charIdx: number, isDeleting: boolean) => {
            const currentWord = START_SUGGESTIONS[wordIdx];

            setPlaceholderText(currentWord.substring(0, charIdx));

            if (!isDeleting && charIdx === currentWord.length) {
                timeoutId = window.setTimeout(() => typeNext(wordIdx, charIdx, true), PAUSE_AFTER_WORD);
            } else if (isDeleting && charIdx === 0) {
                timeoutId = window.setTimeout(() => typeNext((wordIdx + 1) % START_SUGGESTIONS.length, 0, false), PAUSE_BEFORE_NEXT);
            } else {
                const nextCharIdx = isDeleting ? charIdx - 1 : charIdx + 1;
                const delay = isDeleting ? DELETE_SPEED : TYPE_SPEED;
                timeoutId = window.setTimeout(() => typeNext(wordIdx, nextCharIdx, isDeleting), delay);
            }
        };

        // 启动第一句
        timeoutId = window.setTimeout(() => typeNext(0, 0, false), 100);

        return () => window.clearTimeout(timeoutId);
    }, [isFocused, input]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 pb-20 w-full relative h-full">

            {/* 动态环境氛围光 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0 animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none z-0 animate-float-delayed" />

            {/* 极简网格背景层 */}
            <div className="absolute inset-0 bg-grid pointer-events-none z-0" />

            {/* 中央智能图标 (呼吸、闪烁、旋转环动效) */}
            <div className="mb-14 relative animate-fadeInUp delay-100 group cursor-default">
                {/* 底层发光 */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-glowPulse" />

                {/* 核心主体 */}
                <div className="w-24 h-24 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center relative z-10 animate-breathe shadow-2xl">
                    {/* 旋转科技细环 */}
                    <div className="absolute -inset-1 rounded-full border border-dashed border-blue-500/30 animate-spinSlow pointer-events-none" />
                    <div className="absolute -inset-3 rounded-full border border-zinc-800/50 animate-spinSlowReverse pointer-events-none" />

                    <Radar className="w-10 h-10 text-blue-400/90 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                </div>
            </div>

            {/* 标题组 */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-100 mb-2 animate-fadeInUp delay-200">
                简历筛选
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-fadeInUp delay-300 text-transparent bg-clip-text bg-gradient-to-r from-[#E2E8F0] via-[#A3B8CC] to-[#5C7C99] pb-2 drop-shadow-sm">
                从未如此智能
            </h1>

            {/* 副文本与流水线 */}
            <div className="animate-fadeInUp delay-400 flex flex-col items-center gap-5">
                <p className="text-zinc-400 text-lg md:text-xl font-light">
                    将繁琐的初筛工作交给 AI。
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm font-mono tracking-wider bg-zinc-900/40 backdrop-blur-sm px-5 py-2.5 rounded-full border border-zinc-800/60 shadow-inner group">
                    <span className="opacity-70">自动化流水线：</span>
                    <span className="text-zinc-400 group-hover:text-blue-300 transition-colors duration-300 cursor-default">岗位澄清</span>
                    <ArrowRight className="w-3 h-3 opacity-50" />
                    <span className="text-zinc-400 group-hover:text-indigo-300 transition-colors duration-300 delay-75 cursor-default">简历解析</span>
                    <ArrowRight className="w-3 h-3 opacity-50" />
                    <span className="text-zinc-400 group-hover:text-purple-300 transition-colors duration-300 delay-150 cursor-default">智能排序</span>
                    <ArrowRight className="w-3 h-3 opacity-50" />
                    <span className="text-zinc-400 group-hover:text-pink-300 transition-colors duration-300 delay-200 cursor-default">面试邀约</span>
                </div>
            </div>

            {/* 居中的操作栏 (毛玻璃 + 扫光按钮 + 打字机输入) */}
            <div className="w-full max-w-2xl mt-14 animate-fadeInUp delay-500 relative group z-20">
                {/* 悬浮发光底座 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-1000" />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim()) onStart(input);
                    }}
                    className="relative bg-[#1c1c1e]/70 backdrop-blur-2xl border border-white/10 p-2 rounded-full flex items-center shadow-2xl shadow-black/50 focus-within:border-white/20 focus-within:bg-[#1c1c1e]/90 transition-all duration-300"
                >
                    {/* Terminal 提示符 */}
                    <div className="pl-5 pr-2 text-blue-400 font-mono font-bold animate-pulse">
                        &gt;_
                    </div>
                    {/* 输入框 */}
                    <input
                        type="text"
                        className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 py-3 px-2 text-lg w-full focus:outline-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholderText || (isFocused ? '' : '描述您的招聘需求...')}
                    />
                    {/* 苹果蓝高亮扫光按钮 */}
                    <button
                        type="submit"
                        className="btn-shine bg-[#0071e3] hover:bg-[#0077ED] text-white px-8 py-3.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-[0_0_15px_rgba(0,113,227,0.3)] border-none"
                    >
                        开始筛选
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* 登录后才显示：查看招聘历史 / 人才库入口 */}
                {isLoggedIn && (
                    <div className="flex justify-center mt-12 animate-fadeInUp delay-[600ms]">
                        <button
                            onClick={onOpenResumes}
                            className="px-6 py-2.5 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all duration-300 text-sm font-medium focus:outline-none flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            查看我的招聘历史与人才库
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
