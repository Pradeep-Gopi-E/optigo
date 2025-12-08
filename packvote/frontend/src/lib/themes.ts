export interface ParallaxLayer {
    type: 'image' | 'component';
    content: string | React.ReactNode; // URL for image, or component
    speedX: number;
    speedY: number;
    speedZ: number;
    rotation: number;
    distance: number;
    zIndex: number;
    initialTop: string;
    initialLeft: string;
    width: string;
    className?: string;
    opacity?: number;
}

export interface ThemeConfig {
    id: string;
    name: string;
    background: string; // CSS gradient or color
    layers: ParallaxLayer[];
}

// Default Wilderness Theme (Existing)
export const wildernessTheme: ThemeConfig = {
    id: 'wilderness',
    name: 'Wilderness',
    background: 'bg-gradient-to-b from-sky-900 to-sky-700',
    layers: [
        {
            type: 'image',
            content: 'https://i.ibb.co/9mHk68Gj/background.png',
            speedX: 0.03, speedY: 0.038, speedZ: 0, rotation: 0, distance: -200, zIndex: 1,
            initialTop: 'calc(50% - 50px)', initialLeft: 'calc(50% + 0px)', width: '3200px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/DHhNwG0X/fog-7.png',
            speedX: 0.27, speedY: 0.32, speedZ: 0, rotation: 0, distance: 850, zIndex: 2,
            initialTop: 'calc(50% - 100px)', initialLeft: 'calc(50% + 300px)', width: '1900px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/4gT3LR9K/mountain-10.png',
            speedX: 0.095, speedY: 0.005, speedZ: 0, rotation: 0, distance: 1110, zIndex: 3,
            initialTop: 'calc(50% + 169px)', initialLeft: 'calc(50% + 330px)', width: '1200px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/rW6cjXV/fog-6.png',
            speedX: 0.25, speedY: 0.28, speedZ: 0, rotation: 0, distance: 1400, zIndex: 4,
            initialTop: 'calc(50% + 285px)', initialLeft: 'calc(50%)', width: '2200px', className: 'opacity-30'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/zHWDdxRR/mountain-9.png',
            speedX: 0.125, speedY: 0.155, speedZ: 0.15, rotation: 0.02, distance: 1700, zIndex: 5,
            initialTop: 'calc(50% + 313px)', initialLeft: 'calc(50% - 557px)', width: '670px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/jFSMJ2t/fog-5.png',
            speedX: 0.16, speedY: 0.105, speedZ: 0, rotation: 0, distance: 1900, zIndex: 7,
            initialTop: 'calc(50% + 360px)', initialLeft: 'calc(50% + 40px)', width: '650px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/Fq5CHqZ6/mountain-7.png',
            speedX: 0.1, speedY: 0.1, speedZ: 0, rotation: 0.09, distance: 2000, zIndex: 19,
            initialTop: 'calc(50% + 223px)', initialLeft: 'calc(50% + 495px)', width: '738px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/N2TjCDLQ/mountain-6.png',
            speedX: 0.065, speedY: 0.05, speedZ: 0.05, rotation: 0.12, distance: 2300, zIndex: 18,
            initialTop: 'calc(50% + 120px)', initialLeft: 'calc(50% + 590px)', width: '408px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/23Xc3QwX/fog-4.png',
            speedX: 0.135, speedY: 0.1, speedZ: 0, rotation: 0, distance: 2400, zIndex: 11,
            initialTop: 'calc(50% + 223px)', initialLeft: 'calc(50% + 460px)', width: '590px', className: 'opacity-50'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/SSfDbsF/mountain-5.png',
            speedX: 0.08, speedY: 0.05, speedZ: 0.13, rotation: 0.1, distance: 2550, zIndex: 12,
            initialTop: 'calc(50% + 320px)', initialLeft: 'calc(50% + 230px)', width: '725px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/chZkMKzX/fog-3.png',
            speedX: 0.11, speedY: 0.018, speedZ: 0, rotation: 0, distance: 2800, zIndex: 13,
            initialTop: 'calc(50% + 210px)', initialLeft: 'calc(50% + 5px)', width: '1600px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/39PKgGNS/mountain-4.png',
            speedX: 0.059, speedY: 0.024, speedZ: 0.35, rotation: 0.14, distance: 3200, zIndex: 15,
            initialTop: 'calc(50% + 196px)', initialLeft: 'calc(50% - 698px)', width: '1100px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/rKHGSD9S/mountain-3.png',
            speedX: 0.04, speedY: 0.018, speedZ: 0.32, rotation: 0.05, distance: 3400, zIndex: 20,
            initialTop: 'calc(50% - 20px)', initialLeft: 'calc(50% + 750px)', width: '630px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/bj0s7gRP/fog-2.png',
            speedX: 0.15, speedY: 0.0115, speedZ: 0, rotation: 0, distance: 3600, zIndex: 16,
            initialTop: 'calc(50% - 20px)', initialLeft: 'calc(50% + 698px)', width: '1100px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/7tHMfwZH/mountain-2.png',
            speedX: 0.0235, speedY: 0.013, speedZ: 0.42, rotation: 0.15, distance: 3800, zIndex: 17,
            initialTop: 'calc(50% + 256px)', initialLeft: 'calc(50% + 528px)', width: '800px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/Knh5tBS/mountain-1.png',
            speedX: 0.027, speedY: 0.018, speedZ: 0.53, rotation: 0.2, distance: 4000, zIndex: 18,
            initialTop: 'calc(50% + 196px)', initialLeft: 'calc(50% - 728px)', width: '1100px'
        },
        {
            type: 'image',
            content: 'https://i.ibb.co/Y41vTxSN/fog-1.png',
            speedX: 0.12, speedY: 0.01, speedZ: 0, rotation: 0, distance: 4200, zIndex: 21,
            initialTop: 'calc(100% - 355px)', initialLeft: 'calc(50% + 100px)', width: '1900px', className: 'opacity-50'
        },
    ]
};

// Ocean Theme
export const oceanTheme: ThemeConfig = {
    id: 'ocean',
    name: 'Ocean Depth',
    background: 'bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900',
    layers: [
        {
            type: 'image',
            content: '/themes/ocean/ocean_bg.png',
            speedX: 0.02, speedY: 0.02, speedZ: 0, rotation: 0, distance: -200, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '110vw'
        },
        {
            type: 'image',
            content: '/themes/ocean/ocean_ray.png',
            speedX: 0.03, speedY: 0.03, speedZ: 0, rotation: 0, distance: 0, zIndex: 2,
            initialTop: '50%', initialLeft: '50%', width: '110vw', className: 'opacity-60 mix-blend-screen'
        },
        {
            type: 'image',
            content: '/themes/ocean/ocean_mg.png',
            speedX: 0.06, speedY: 0.04, speedZ: 0.05, rotation: 0.01, distance: 200, zIndex: 3,
            initialTop: '55%', initialLeft: '50%', width: '110vw', className: 'mix-blend-screen'
        },
        {
            type: 'image',
            content: '/themes/ocean/ocean_fg.png',
            speedX: 0.12, speedY: 0.08, speedZ: 0.1, rotation: 0.02, distance: 500, zIndex: 4,
            initialTop: '60%', initialLeft: '50%', width: '110vw', className: 'mix-blend-screen'
        }
    ]
};

// Space Theme
export const spaceTheme: ThemeConfig = {
    id: 'space',
    name: 'Space Galaxy',
    background: 'bg-gradient-to-b from-black via-purple-900 to-black',
    layers: [
        {
            type: 'image',
            content: '/themes/space/background.png',
            speedX: 0.01, speedY: 0.01, speedZ: 0, rotation: 0, distance: -200, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '120vw'
        }
    ]
};

// Cyberpunk Theme
export const cyberpunkTheme: ThemeConfig = {
    id: 'cyberpunk',
    name: 'Cyberpunk City',
    background: 'bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900',
    layers: [
        {
            type: 'image',
            content: '/themes/cyberpunk/background.png',
            speedX: 0.02, speedY: 0.02, speedZ: 0, rotation: 0, distance: -100, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '120vw'
        }
    ]
};

// Forest Theme
export const forestTheme: ThemeConfig = {
    id: 'forest',
    name: 'Enchanted Forest',
    background: 'bg-gradient-to-b from-emerald-900 to-teal-900',
    layers: [
        {
            type: 'image',
            content: '/themes/forest/background.png',
            speedX: 0.02, speedY: 0.02, speedZ: 0, rotation: 0, distance: -100, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '120vw'
        }
    ]
};

// Tropical Theme
export const tropicalTheme: ThemeConfig = {
    id: 'tropical',
    name: 'Tropical Sunset',
    background: 'bg-gradient-to-b from-orange-400 via-pink-500 to-purple-600',
    layers: [
        {
            type: 'image',
            content: '/themes/tropical/background.png',
            speedX: 0.02, speedY: 0.02, speedZ: 0, rotation: 0, distance: -100, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '120vw'
        }
    ]
};

// Winter Theme
export const winterTheme: ThemeConfig = {
    id: 'winter',
    name: 'Winter Mountains',
    background: 'bg-gradient-to-b from-slate-300 via-blue-200 to-white',
    layers: [
        {
            type: 'image',
            content: '/themes/winter/background.png',
            speedX: 0.02, speedY: 0.02, speedZ: 0, rotation: 0, distance: -100, zIndex: 1,
            initialTop: '50%', initialLeft: '50%', width: '120vw'
        }
    ]
};

export const themes: Record<string, ThemeConfig> = {
    wilderness: wildernessTheme,
    ocean: oceanTheme,
    space: spaceTheme,
    cyberpunk: cyberpunkTheme,
    forest: forestTheme,
    tropical: tropicalTheme,
    winter: winterTheme
};
