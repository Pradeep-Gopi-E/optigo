import React from 'react';
import { cn } from '@/lib/utils';
import { LOGO_PATHS } from './logo-data';

interface LogoProps {
    className?: string;
    showText?: boolean; // Kept for compatibility, though the logo is self-contained now
    textClassName?: string;
}

export function Logo({ className, showText = true, textClassName }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <svg
                viewBox="0 0 2016 2112"
                preserveAspectRatio="xMidYMid meet"
                className="w-16 h-16 flex-shrink-0 text-primary fill-current"
                aria-label="Cohere Logo"
            >
                <g transform="translate(0,2112) scale(0.1,-0.1)">
                    {LOGO_PATHS.map((d, index) => (
                        <path
                            key={index}
                            d={d}
                            stroke="none"
                        />
                    ))}
                </g>
            </svg>

            {/* 
                The new logo is a complex graphic that might not explicitly say "Cohere" in a screen-reader friendly way 
                if we just rely on the path data. 
                The `aria-label` on the SVG helps.
                
                If `showText` is true, we render the text "Cohere" next to it.
                The previous implementation had "Cohere" INSIDE the SVG as a path, but the new SVG 
                seems to be a purely graphical logo (or a very stylized one).
                
                If the user wants the text "Cohere" to be visible NEXT to the logo, we keep this block.
            */}
            {showText && (
                <span className={cn("font-heading font-bold text-xl tracking-tight text-foreground", textClassName)}>
                    Cohere
                </span>
            )}
        </div>
    );
}
