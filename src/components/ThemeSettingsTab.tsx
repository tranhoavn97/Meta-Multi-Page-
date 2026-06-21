import React from "react";
import { 
  Sun, Moon, LayoutTemplate, Type, Settings2, Palette, Box, Check, Image as ImageIcon
} from "lucide-react";
import { useThemeConfig, APP_THEMES, COLOR_OPTIONS, FONT_OPTIONS } from "../hooks/useThemeConfig";

interface ThemeSettingsTabProps {
  // Permanently True, props kept optional for backwards compatibility
  isDark?: boolean;
  setIsDark?: (dark: boolean) => void;
}

export default function ThemeSettingsTab({}: ThemeSettingsTabProps) {

  const { config, setConfig } = useThemeConfig();

  const handleUpdate = (updates: Partial<typeof config>) => {
    setConfig({ ...config, ...updates });
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-hidden min-h-0 h-full text-foreground pb-6">
      
      {/* HEADER SECTION */}
      <div className="flex-shrink-0 px-4 pt-4 lg:px-6 lg:pt-6">
        <h2 className="text-2xl font-black tracking-tight mb-1 text-foreground">TUỲ BIẾN GIAO DIỆN</h2>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Đặt cấu hình màu sắc, phông nền mờ, bo góc và họa tiết nghệ thuật
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 lg:px-6 pb-20 flex flex-col gap-8">

        {/* ẢNH NỀN ỨNG DỤNG */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">ẢNH NỀN ỨNG DỤNG (THEME)</h3>
              <p className="text-xs font-semibold text-muted-foreground">Chọn màu nền nghệ thuật của ứng dụng</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {Object.keys(APP_THEMES).map((themeKey) => {
              const themeName = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
              const isActive = config.bgTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => handleUpdate({ bgTheme: themeKey })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    isActive 
                      ? 'border-2 border-accent text-accent bg-accent/10 shadow-accent/20' 
                      : 'glass-panel text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {themeName === 'Default' ? 'Mặc định' : themeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* MÀU SẮC SẮC THÁI CHỦ ĐẠO */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-5 transition-all w-full">
          <div className="flex gap-4 items-center mb-2">
            <div className="w-12 h-12 rounded-full shrink-0 shadow-lg border border-white/20" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === config.primaryColorName)?.hex }} />
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">MÀU SẮC SẮC THÁI CHỦ ĐẠO</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                Đặt tông màu chỉ thị thiết kế: <span className="text-foreground font-bold">{config.primaryColorName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {COLOR_OPTIONS.map((color) => {
              const isActive = config.primaryColorName === color.name;
              return (
                <div key={color.name} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleUpdate({ primaryColorName: color.name })}>
                  <div className={`w-10 h-10 rounded-full transition-all flex items-center justify-center p-0.5 ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:scale-110'}`}>
                    <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: color.hex }}>
                      {isActive && <Check className="w-5 h-5 mx-auto mt-2 text-white drop-shadow-md stroke-[3px]" />}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black tracking-wider uppercase transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {color.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CÁC THANH TRƯỢT OPACITY & OVERLAY */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-8 transition-all">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">ĐỘ TRONG TẤM KÍNH MỜ (GLASS OPACITY)</h3>
              <span className="text-[11px] font-bold font-mono">{config.glassOpacity}%</span>
            </div>
            <input 
              type="range" 
              min="10" max="100" 
              value={config.glassOpacity}
              onChange={(e) => handleUpdate({ glassOpacity: parseInt(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">CHE PHỦ LỚP NỀN (BACKGROUND OVERLAY)</h3>
              <span className="text-[11px] font-bold font-mono">{config.bgOverlay}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={config.bgOverlay}
              onChange={(e) => handleUpdate({ bgOverlay: parseInt(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>

        {/* CƯỜNG ĐỘ TÁN XẠ BLUR */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
          <div className="flex flex-col gap-1">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">CƯỜNG ĐỘ TÁN XẠ BLUR</h3>
            <p className="text-xs font-semibold text-muted-foreground">Chỉnh độ tán nhòe của tấm kính thủy tinh</p>
          </div>
          <div className="flex bg-background/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-border shrink-0 gap-1 overflow-x-auto min-w-[280px]">
            {["8px", "16px", "24px", "32px"].map((size) => (
              <button
                key={size}
                onClick={() => handleUpdate({ blurSize: size })}
                className={`flex-1 py-1.5 px-4 rounded-full text-xs font-bold transition-all shadow-sm ${config.blurSize === size ? 'bg-card border border-border text-foreground' : 'text-muted-foreground hover:bg-muted border border-transparent'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* CỠ PHÔNG & BỘ MẶT CHỮ */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-8 transition-all">
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">CỠ PHÔNG CHỮ</h3>
            <div className="flex bg-background/50 backdrop-blur-md p-1 rounded-2xl border border-border max-w-lg w-full">
              {[
                { label: "Cực gọn", val: "small" },
                { label: "Tiêu chuẩn", val: "base" },
                { label: "Mở rộng", val: "large" }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleUpdate({ fontSize: opt.val })}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-center shadow-sm ${config.fontSize === opt.val ? 'bg-card border border-border text-foreground' : 'text-muted-foreground hover:bg-muted border border-transparent'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">BỘ MẶT CHỮ (FONT FAMILY)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => handleUpdate({ fontFamily: font.name })}
                  className={`py-3 px-3 rounded-2xl text-[13px] font-bold transition-all text-center border shadow-sm ${config.fontFamily === font.name ? 'border-accent bg-accent/5 text-foreground shadow-accent/10' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
                  style={{ fontFamily: font.name === 'Hệ thống' ? 'system-ui' : font.value.split(',')[0] }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
