import { useState, useEffect } from 'react';
import { ArrowRight, Radar } from 'lucide-react';
import { START_SUGGESTIONS } from '../types';

/**
 * 首页：居中布局 + 大字体 + indigo 配色
 */
export function LandingPage({ onStart }: { onStart: (role: string) => void }) {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Typewriter effect state
    const [placeholderText, setPlaceholderText] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isFocused || input) {
            setPlaceholderText('');
            return;
        }

        const currentString = START_SUGGESTIONS[placeholderIndex];
        let timeout: ReturnType<typeof setTimeout>;

        const type = () => {
            setCharIndex((prevCharIndex) => {
                if (isDeleting) {
                    if (prevCharIndex > 0) {
                        setPlaceholderText(currentString.substring(0, prevCharIndex - 1));
                        timeout = setTimeout(type, 50); // 删除速度
                        return prevCharIndex - 1;
                    } else {
                        setIsDeleting(false);
                        setPlaceholderIndex((prev) => (prev + 1) % START_SUGGESTIONS.length);
                        return 0;
                    }
                } else {
                    if (prevCharIndex < currentString.length) {
                        setPlaceholderText(currentString.substring(0, prevCharIndex + 1));
                        timeout = setTimeout(type, 120); // 打字速度
                        return prevCharIndex + 1;
                    } else {
                        // 展示完整文字后停顿 2 秒，再开始删除
                        timeout = setTimeout(() => {
                            setIsDeleting(true);
                        }, 2000);
                        return prevCharIndex;
                    }
                }
            });
        };

        // 启动打字循环（切词后停顿 500ms 再开始下一句）
        timeout = setTimeout(type, isDeleting ? 50 : 500);

        return () => clearTimeout(timeout);
        // 只在切换焦点、输入内容或切词时重建计时器，防止 charIndex 的高频更新引发死循环重渲染
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, input, placeholderIndex, isDeleting]);

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
            </div>
        </div>
    );
}
