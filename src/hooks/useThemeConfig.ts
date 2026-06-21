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
}

const defaultThemeConfig: ThemeConfig = {
  bgTheme: "default",
  primaryColorName: "Xanh dương",
  glassOpacity: 65,
  bgOverlay: 40,
  blurSize: "24px",
  fontSize: "base",
  fontFamily: "Inter"
};

export function useThemeConfig(isDark: boolean) {
  const [config, setConfigState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("app_theme_config");
    return saved ? { ...defaultThemeConfig, ...JSON.parse(saved) } : defaultThemeConfig;
  });

  const setConfig = (newConfig: ThemeConfig) => {
    setConfigState(newConfig);
    localStorage.setItem("app_theme_config", JSON.stringify(newConfig));
  };

  useEffect(() => {
    const root = document.documentElement;
    
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
      return "59, 130, 246";
    };
    const rgbVal = hexToRgb(selectedColor.hex);
    root.style.setProperty("--accent-rgb", rgbVal);

    // Apply glass opacity
    const alphaGlass = config.glassOpacity / 100;
    const alphaBorder = Math.min(alphaGlass + 0.15, 1);
    root.style.setProperty("--glass", `rgba(15, 23, 42, ${alphaGlass})`);
    root.style.setProperty("--glass-border", `rgba(255, 255, 255, ${alphaBorder * 0.2})`);
    root.style.setProperty("--card", `rgba(15, 23, 42, ${Math.max(alphaGlass - 0.1, 0.2)})`);

    // Apply bg overlay
    const overlayAlpha = config.bgOverlay / 100;
    root.style.setProperty("--bg", `rgba(3, 7, 18, ${overlayAlpha})`);

    // Apply blur size
    
    // You cannot dynamically change CSS variables used in tailwind `backdrop-blur-*` utility classes easily unless extending the theme or overriding the style dynamically.
    // Instead, we will inject a custom style block
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
      .neu-panel, .glass-panel, .neu-input, .neu-button, aside, main {
        backdrop-filter: blur(${config.blurSize}) !important;
        -webkit-backdrop-filter: blur(${config.blurSize}) !important;
      }
      
      /* FUTURISTIC NEON GLASS UI EFFECTS */
      .glass-card {
        border: 1px solid rgba(${rgbVal}, 0.25) !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.22), 0 0 15px rgba(${rgbVal}, 0.1) !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      .glass-card:hover {
        border-color: rgba(${rgbVal}, 0.45) !important;
        box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.32), 0 0 22px rgba(${rgbVal}, 0.25) !important;
        transform: translateY(-2px) !important;
      }
      
      .glass-panel {
        border: 1px solid rgba(${rgbVal}, 0.18) !important;
        box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.18), 0 0 10px rgba(${rgbVal}, 0.08) !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      .glass-panel:hover {
        border-color: rgba(${rgbVal}, 0.38) !important;
        box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.25), 0 0 18px rgba(${rgbVal}, 0.2) !important;
        transform: translateY(-1px) !important;
      }
      
      .neu-button-primary, .btn-primary {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-sec) 100%) !important;
        box-shadow: 0 0 12px 1px rgba(${rgbVal}, 0.32) !important;
        border: 1px solid rgba(${rgbVal}, 0.3) !important;
        color: white !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      
      .neu-button-primary:hover, .btn-primary:hover {
        box-shadow: 0 0 20px 3px rgba(${rgbVal}, 0.48), 0 4px 12px rgba(0, 0, 0, 0.12) !important;
        transform: translateY(-2px) scale(1.02) !important;
        color: white !important;
      }
      
      .neu-input:focus, .neu-input:focus-within {
        border-color: rgba(${rgbVal}, 0.5) !important;
        box-shadow: 0 0 12px rgba(${rgbVal}, 0.2) !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
    `;

  }, [config, isDark]);

  return { config, setConfig };
}
