import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { themes, ParallaxLayer } from '@/lib/themes';

interface ParallaxHeroProps {
    theme?: string; // Theme ID
    title?: string;
    className?: string;
}

const ParallaxHero: React.FC<ParallaxHeroProps> = ({
    theme = 'wilderness',
    title = 'HERO',
    className,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const layerRefs = useRef<(HTMLImageElement | HTMLDivElement | null)[]>([]);
    const textRef = useRef<HTMLDivElement>(null);
    const [xValue, setXValue] = useState(0);
    const [yValue, setYValue] = useState(0);
    const [rotateDegree, setRotateDegree] = useState(0);

    const currentTheme = themes[theme] || themes['wilderness'];
    const layers = currentTheme.layers;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newXValue = e.clientX - window.innerWidth / 2;
            const newYValue = e.clientY - window.innerHeight / 2;
            const newRotateDegree = (newXValue / (window.innerWidth / 2)) * 20;

            setXValue(newXValue);
            setYValue(newYValue);
            setRotateDegree(newRotateDegree);

            updateLayers(e.clientX, newXValue, newYValue, newRotateDegree);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [theme]); // Re-bind if theme changes (though logic is generic)

    const updateLayers = (
        cursorPosition: number,
        xVal: number,
        yVal: number,
        rotateDeg: number
    ) => {
        layerRefs.current.forEach((el, index) => {
            if (!el) return;

            const layer = layers[index];
            if (!layer) return; // Safety check

            const { speedX, speedY, speedZ, rotation } = layer;

            const computedLeft = parseFloat(
                getComputedStyle(el).left.replace('px', '')
            );
            const isInLeft = computedLeft < window.innerWidth / 2 ? 1 : -1;
            const zValue = (cursorPosition - computedLeft) * isInLeft * 0.1;

            el.style.transform = `perspective(2300px) translateZ(${zValue * speedZ
                }px) rotateY(${rotateDeg * rotation}deg) translateX(calc(-50% + ${-xVal * speedX
                }px)) translateY(calc(-50% + ${yVal * speedY}px))`;
        });

        if (textRef.current) {
            const textSpeedX = 0.07;
            const textSpeedY = 0.05;
            const textSpeedZ = 0.08;
            const textRotation = 0.04;

            const computedLeft = parseFloat(
                getComputedStyle(textRef.current).left.replace('px', '')
            );
            const isInLeft = computedLeft < window.innerWidth / 2 ? 1 : -1;
            const zValue = (cursorPosition - computedLeft) * isInLeft * 0.1;

            textRef.current.style.transform = `perspective(2300px) translateZ(${zValue * textSpeedZ
                }px) rotateY(${rotateDeg * textRotation}deg) translateX(calc(-50% + ${-xVal * textSpeedX
                }px)) translateY(calc(-50% + ${yVal * textSpeedY}px))`;
        }
    };

    return (
        <main
            ref={containerRef}
            className={cn(
                'relative h-screen w-screen overflow-hidden transition-colors duration-700',
                currentTheme.background,
                className
            )}
        >
            <div className="absolute inset-0 z-[100] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_65%,rgba(0,0,0,0.7))]" />

            {layers.map((layer, index) => {
                const style = {
                    width: layer.width,
                    top: layer.initialTop,
                    left: layer.initialLeft,
                    zIndex: layer.zIndex,
                    transform: 'translate(-50%, -50%)',
                };

                if (layer.type === 'image') {
                    return (
                        <img
                            key={`${theme}-${index}`}
                            ref={(el) => {
                                if (el) layerRefs.current[index] = el;
                            }}
                            src={layer.content as string}
                            alt={`layer-${index}`}
                            className={cn(
                                'absolute pointer-events-none transition-transform duration-[450ms] ease-out',
                                layer.className
                            )}
                            style={style}
                        />
                    );
                } else {
                    return (
                        <div
                            key={`${theme}-${index}`}
                            ref={(el) => {
                                if (el) layerRefs.current[index] = el;
                            }}
                            className={cn(
                                'absolute pointer-events-none transition-transform duration-[450ms] ease-out',
                                layer.className
                            )}
                            style={style}
                        >
                            {layer.content}
                        </div>
                    );
                }
            })}

            <div
                ref={textRef}
                className="absolute z-[9] text-white text-center pointer-events-auto transition-transform duration-[450ms] ease-out"
                style={{
                    top: 'calc(50% - 130px)',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <h1 className="font-black text-[20rem] leading-[0.8] max-lg:text-[15rem] max-md:text-[5.8rem] max-sm:text-[3.3rem]">
                    {title}
                </h1>
            </div>
        </main>
    );
};

export default ParallaxHero;
