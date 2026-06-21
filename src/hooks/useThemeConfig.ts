import { useState, useEffect } from "react";

export const APP_THEMES = {
  default: { g1: "rgba(59, 130, 246, 0.2)", g2: "rgba(147, 51, 234, 0.2)", g3: "rgba(236, 72, 153, 0.15)" },
  aurora: { g1: "rgba(16, 185, 129, 0.25)", g2: "rgba(59, 130, 246, 0.25)", g3: "rgba(139, 92, 246, 0.25)" },
  ocean: { g1: "rgba(14, 165, 233, 0.2)", g2: "rgba(59, 130, 246, 0.2)", g3: "rgba(6, 182, 212, 0.2)" },
  violet: { g1: "rgba(139, 92, 246, 0.25)", g2: "rgba(168, 85, 247, 0.2)", g3: "rgba(217, 72, 153, 0.2)" },
  emerald: { g1: "rgba(16, 185, 129, 0.2)", g2: "rgba(5, 150, 105, 0.2)", g3: "rgba(52, 211, 153, 0.2)" },
  slate: { g1: "rgba(100, 116, 139, 0.2)", g2: "rgba(71, 85, 105, 0.2)", g3: "rgba(148, 163, 184, 0.2)" },
  sunset: { g1: "rgba(249, 115, 22, 0.2)", g2: "rgba(236, 72, 153, 0.2)", g3: "rgba(234, 179, 8, 0.2)" },
  neonCyber: { g1: "rgba(6, 182, 212, 0.35)", g2: "rgba(244, 63, 94, 0.3)", g3: "rgba(139, 92, 246, 0.35)" }
};

export const COLOR_OPTIONS = [
  { name: "Cyan Neon", hex: "#00F3FF", sec: "#B000FF" },
  { name: "Pink Neon", hex: "#FF007F", sec: "#00F3FF" },
  { name: "Lime Neon", hex: "#39FF14", sec: "#00F3FF" },
  { name: "Xanh dương", hex: "#0052FF", sec: "#4D7CFF" },
  { name: "Bạc hà", hex: "#10B981", sec: "#34D399" },
  { name: "Oải hương", hex: "#8B5CF6", sec: "#A78BFA" },
  { name: "Hồng sen", hex: "#EC4899", sec: "#F472B6" },
  { name: "Cam nhạt", hex: "#F97316", sec: "#FB923C" },
  { name: "Ngọc Lục Bảo", hex: "#059669", sec: "#10B981" },
  { name: "Lục lam", hex: "#06B6D4", sec: "#22D3EE" },
  { name: "Xám sang", hex: "#64748B", sec: "#94A3B8" }
];

export const FONT_OPTIONS = [
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Be Vietnam", value: "'Be Vietnam Pro', sans-serif" },
  { name: "Manrope", value: "'Manrope', sans-serif" },
  { name: "Plus Jakarta", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Nunito", value: "'Nunito', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Hệ thống", value: "ui-sans-serif, system-ui, sans-serif" }
];

export interface ThemeConfig {
  bgTheme: string;
  primaryColorName: string;
  glassOpacity: number;
  bgOverlay: number;
  blurSize: string;
  fontSize: string; // 'small', 'base', 'large'
  fontFamily: string;
  bgType?: 'gradient' | 'image';
  bgImageUrl?: string;
  blurAmount?: number;
  borderRadius?: number;
}

const defaultThemeConfig: ThemeConfig = {
  bgTheme: "ocean",
  primaryColorName: "Cyan Neon",
  glassOpacity: 45,
  bgOverlay: 85,
  blurSize: "24px",
  fontSize: "base",
  fontFamily: "Inter",
  bgType: "gradient",
  bgImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
  blurAmount: 24,
  borderRadius: 20
};

export function useThemeConfig() {
  const [config, setConfigState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("app_theme_config");
    return saved ? { ...defaultThemeConfig, ...JSON.parse(saved) } : defaultThemeConfig;
  });

  const setConfig = (newConfig: ThemeConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem("app_theme_config", JSON.stringify(newConfig));
    } catch (e) {
      console.warn("Storage quota exceeded of localStorage, only applying theme in state", e);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    
    // Apply bg gradient (from themes)
    const selectedThemeVars = APP_THEMES[config.bgTheme as keyof typeof APP_THEMES] || APP_THEMES.default;
    root.style.setProperty("--bg-gradient-1", selectedThemeVars.g1);
    root.style.setProperty("--bg-gradient-2", selectedThemeVars.g2);
    root.style.setProperty("--bg-gradient-3", selectedThemeVars.g3);

    // Apply main accent color
    const selectedColor = COLOR_OPTIONS.find(c => c.name === config.primaryColorName) || COLOR_OPTIONS[0];
    root.style.setProperty("--accent", selectedColor.hex);
    root.style.setProperty("--accent-sec", selectedColor.sec);

    // Convert hex to rgb for glow variables
    const hexToRgb = (hex: string): string => {
      const cleaned = hex.replace("#", "");
      if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        return `${r}, ${g}, ${b}`;
      }
      if (cleaned.length === 6) {
        const r = parseInt(cleaned.substring(0, 2), 16);
        const g = parseInt(cleaned.substring(2, 4), 16);
        const b = parseInt(cleaned.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
      return "0, 243, 255";
    };
    const rgbVal = hexToRgb(selectedColor.hex);
    root.style.setProperty("--accent-rgb", rgbVal);

    // Apply glass opacity
    const alphaGlass = config.glassOpacity / 100;
    const alphaBorder = Math.min(alphaGlass + 0.15, 1);
    if (isDark) {
      root.style.setProperty("--glass", `rgba(4, 12, 38, ${alphaGlass})`);
      root.style.setProperty("--glass-border", `rgba(0, 243, 255, ${alphaBorder * 0.18})`);
      root.style.setProperty("--card", `rgba(3, 9, 32, ${Math.max(alphaGlass - 0.12, 0.22)})`);
    } else {
      root.style.setProperty("--glass", `rgba(255, 255, 255, ${alphaGlass})`);
      root.style.setProperty("--glass-border", `rgba(255, 255, 255, ${alphaBorder * 0.8})`);
      root.style.setProperty("--card", `rgba(255, 255, 255, ${Math.max(alphaGlass - 0.15, 0.4)})`);
    }

    // Apply bg overlay
    const overlayAlpha = config.bgOverlay / 100;
    if (isDark) {
      root.style.setProperty("--bg", `rgba(2, 6, 22, ${overlayAlpha})`);
    } else {
      root.style.setProperty("--bg", `rgba(248, 250, 252, ${overlayAlpha})`);
    }

    // Apply blur size
    const finalBlurAmount = config.blurAmount !== undefined ? config.blurAmount : 24;
    const finalBorderRadius = config.borderRadius !== undefined ? config.borderRadius : 20;
    
    // Instead of predefined static styles, inject custom dynamic properties
    let styleEl = document.getElementById("theme-dynamic-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-dynamic-styles";
      document.head.appendChild(styleEl);
    }
    
    let baseFontSize = "14px";
    if (config.fontSize === "small") baseFontSize = "13px";
    if (config.fontSize === "large") baseFontSize = "15px";

    const fontVal = FONT_OPTIONS.find(f => f.name === config.fontFamily)?.value || FONT_OPTIONS[0].value;

    styleEl.innerHTML = `
      :root {
        --font-sans: ${fontVal};
        --font-display: ${fontVal};
      }
      html {
        font-size: ${baseFontSize};
      }
      
      /* GLASS & BLUR ACCENTS */
      .neu-panel, .glass-panel, .neu-input, .neu-button, aside, main, .mac-dropdown {
        backdrop-filter: blur(${finalBlurAmount}px) !important;
        -webkit-backdrop-filter: blur(${finalBlurAmount}px) !important;
      }
      
      /* SQUIRCLE APPLE STANDARD BORDERS */
      .glass-card, aside, main {
        border-radius: ${finalBorderRadius}px !important;
      }
      
      .glass-panel, .mac-dropdown {
        border-radius: ${Math.max(finalBorderRadius - 6, 10)}px !important;
      }
      
      .neu-input, .mac-select {
        border-radius: ${Math.max(finalBorderRadius - 8, 8)}px !important;
      }
      
      /* FUTURISTIC NEON GLASS UI EFFECTS */
      .glass-card {
        border: 1px solid rgba(${rgbVal}, 0.22) !important;
        box-shadow: 0 10px 35px 0 rgba(0, 0, 0, 0.25), 0 0 15px rgba(${rgbVal}, 0.08) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glass-card:hover {
        border-color: rgba(${rgbVal}, 0.4) !important;
        box-shadow: 0 15px 45px 0 rgba(0, 0, 0, 0.35), 0 0 25px rgba(${rgbVal}, 0.2) !important;
      }
      
      .glass-panel {
        border: 1px solid rgba(${rgbVal}, 0.15) !important;
        box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.15), 0 0 10px rgba(${rgbVal}, 0.06) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glass-panel:hover {
        border-color: rgba(${rgbVal}, 0.3) !important;
        box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.2), 0 0 18px rgba(${rgbVal}, 0.15) !important;
      }
      
      /* IOS / MACOS PREMIUM BUTTONS */
      .neu-button-primary {
        background: var(--accent) !important;
        box-shadow: 0 4px 14px 0 rgba(${rgbVal}, 0.35) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        border-radius: 9999px !important;
        font-weight: 700 !important;
        cursor: pointer;
      }
      .neu-button-primary:hover {
        box-shadow: 0 6px 20px 0 rgba(${rgbVal}, 0.55), 0 4px 15px rgba(0, 0, 0, 0.12) !important;
        transform: scale(1.025) !important;
        background: var(--accent) !important;
        filter: brightness(1.08);
      }
      .neu-button-primary:active {
        transform: scale(0.975) !important;
        opacity: 0.92 !important;
      }
      
      .neu-button-secondary {
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        color: #ffffff !important;
        border-radius: 9999px !important;
        font-weight: 600 !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        cursor: pointer;
      }
      .neu-button-secondary:hover {
        background: rgba(255, 255, 255, 0.12) !important;
        border-color: rgba(255, 255, 255, 0.18) !important;
        transform: scale(1.02) !important;
      }
      .neu-button-secondary:active {
        transform: scale(0.98) !important;
      }
      
      /* PRETTY MAC DROPDOWNS & SELECT */
      .mac-select {
        background-color: rgba(15, 23, 42, 0.45) !important;
        border: 1px solid rgba(${rgbVal}, 0.2) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        color: #f1f5f9 !important;
        font-weight: 600 !important;
        outline: none !important;
        transition: all 0.2s ease !important;
        cursor: pointer;
      }
      .mac-select:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 10px rgba(${rgbVal}, 0.3) !important;
      }
      
      /* PREMIUM PROGRESS BAR WITH GLOW */
      .pretty-progress-track {
        background: rgba(255, 255, 255, 0.04) !important;
        border: 1px solid rgba(255, 255, 255, 0.06) !important;
        border-radius: 9999px !important;
        overflow: hidden !important;
        position: relative !important;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.3) !important;
      }
      .pretty-progress-bar {
        background: linear-gradient(90deg, var(--accent) 0%, var(--accent-sec) 100%) !important;
        box-shadow: 0 0 12px 2px rgba(${rgbVal}, 0.5) !important;
        border-radius: 9999px !important;
        transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        height: 100% !important;
        position: relative;
      }
      .pretty-progress-bar::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.25) 50%,
          transparent
        ) !important;
        background-size: 200% 100% !important;
        animation: loading-shine 1.5s infinite linear !important;
      }
      @keyframes loading-shine {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      .neu-input:focus, .neu-input:focus-within {
        border-color: rgba(${rgbVal}, 0.5) !important;
        box-shadow: 0 0 12px rgba(${rgbVal}, 0.2) !important;
      }
    `;

  }, [config]);

  // Hook into dark mode change to re-trigger effect (needed since variable brightness differ between light/dark)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setConfigState(prev => ({ ...prev }));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return { config, setConfig };
}
