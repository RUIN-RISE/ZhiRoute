import { useState, useEffect, useRef, useCallback } from 'react';
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
export function LandingPage({ onStart, onOpenResumes }: { onStart: (role: string) => void, onOpenResumes: () => void }) {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderText, setPlaceholderText] = useState('');

    // 用 useRef 管理打字机内部状态，避免 React 重渲染触发定时器重建
    const typewriterRef = useRef({
        wordIndex: 0,     // 当前轮播到第几句
        charIndex: 0,     // 当前已打到第几个字符
        isDeleting: false, // 当前是否处于删除阶段
        isPaused: false,   // 是否处于停顿阶段
    });

    const rafRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);

    // 用 ref 追踪暂停状态，避免 tick 函数因依赖变化而重建
    const isPausingRef = useRef(false);
    isPausingRef.current = isFocused || input.length > 0;

    // tick 函数无任何外部依赖 — 整个生命周期只创建一次
    const tick = useCallback((timestamp: number) => {
        // 首帧初始化
        if (lastTickRef.current === 0) {
            lastTickRef.current = timestamp;
        }

        if (isPausingRef.current) {
            setPlaceholderText('');
            lastTickRef.current = timestamp;
            rafRef.current = requestAnimationFrame(tick);
            return;
        }

        const state = typewriterRef.current;
        const currentString = START_SUGGESTIONS[state.wordIndex];

        // 计算需要经过的时间间隔
        let interval: number;
        if (state.isPaused) {
            interval = state.isDeleting ? PAUSE_BEFORE_NEXT : PAUSE_AFTER_WORD;
        } else {
            interval = state.isDeleting ? DELETE_SPEED : TYPE_SPEED;
        }

        const elapsed = timestamp - lastTickRef.current;

        if (elapsed >= interval) {
            // 只推进一步，防止累积多步
            lastTickRef.current = timestamp;

            if (state.isPaused) {
                state.isPaused = false;
                if (state.isDeleting) {
                    state.isDeleting = false;
                    state.wordIndex = (state.wordIndex + 1) % START_SUGGESTIONS.length;
                }
            } else if (state.isDeleting) {
                state.charIndex = Math.max(0, state.charIndex - 1);
                setPlaceholderText(currentString.substring(0, state.charIndex));
                if (state.charIndex === 0) {
                    state.isPaused = true;
                }
            } else {
                state.charIndex = Math.min(currentString.length, state.charIndex + 1);
                setPlaceholderText(currentString.substring(0, state.charIndex));
                if (state.charIndex >= currentString.length) {
                    state.isPaused = true;
                    state.isDeleting = true;
                }
            }
        }

        rafRef.current = requestAnimationFrame(tick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

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

                {/* 直接进入简历库捷径 */}
                <div className="flex justify-center mt-12 animate-fadeInUp delay-[600ms]">
                    <button
                        onClick={onOpenResumes}
                        className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all duration-300 text-sm font-medium focus:outline-none"
                    >
                        直接进入简历库
                    </button>
                </div>
            </div>
        </div>
    );
}
