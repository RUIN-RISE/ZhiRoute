import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (code: string) => Promise<void>;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('请输入有效的内测码');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await onLogin(code);
            onClose();
        } catch (err: any) {
            setError(err.message || '内测码验证失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-none"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        {/* 装饰性背景光 */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 shadow-inner">
                                <ShieldCheck className="w-8 h-8 text-blue-400" />
                            </div>

                            {/* Header */}
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight text-white">内测验证</h2>
                                <p className="text-zinc-400 text-sm">
                                    JobOS 目前处于私测阶段，请输入您的内测码以继续。
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="w-full space-y-4">
                                <div className="relative group">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value);
                                            if (error) setError(null);
                                        }}
                                        placeholder="输入内测码..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-center tracking-[0.2em] font-mono font-bold text-lg"
                                    />
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-xs mt-2 font-medium"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !code.trim()}
                                    className="w-full btn-shine bg-[#0071e3] hover:bg-[#0077ED] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,113,227,0.2)] active:scale-95"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            验证内测码
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-zinc-500 text-xs">
                                没有内测码？<a href="#" className="text-blue-400 hover:underline">申请加入候补名单</a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
