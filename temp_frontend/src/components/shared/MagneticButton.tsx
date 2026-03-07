import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 磁吸按钮：鼠标靠近时按钮会微微跟随光标偏移
 */
export function MagneticButton({
    children,
    className,
    onClick,
    type = 'button',
    disabled = false,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        setPosition({
            x: (clientX - (left + width / 2)) * 0.15,
            y: (clientY - (top + height / 2)) * 0.15,
        });
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPosition({ x: 0, y: 0 })}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            onClick={onClick}
            className={className}
            type={type}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}
