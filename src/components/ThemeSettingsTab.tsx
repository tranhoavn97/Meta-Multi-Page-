import React, { useState, useRef } from "react";
import { 
  Sun, Moon, LayoutTemplate, Type, Settings2, Palette, Box, Check, Image as ImageIcon, Sliders, Layers, Focus, Upload, AlertCircle, RefreshCw
} from "lucide-react";
import { useThemeConfig, APP_THEMES, COLOR_OPTIONS, FONT_OPTIONS, ThemeConfig } from "../hooks/useThemeConfig";

interface ThemeSettingsTabProps {
  config: ThemeConfig;
  setConfig: (config: ThemeConfig) => void;
  isDark?: boolean;
  setIsDark?: (dark: boolean) => void;
}

const DEFAULT_WALLPAPER_URL = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80";

export default function ThemeSettingsTab({ config, setConfig, isDark, setIsDark }: ThemeSettingsTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (updates: Partial<typeof config>) => {
    setConfig({ ...config, ...updates });
  };

  const bgType = config.bgType || "gradient";
  const currentImageUrl = config.bgImageUrl || DEFAULT_WALLPAPER_URL;
  const blurAmount = config.blurAmount !== undefined ? config.blurAmount : 24;
  const borderRadius = config.borderRadius !== undefined ? config.borderRadius : 20;

  const addSavedImage = (imageUrl: string) => {
    setConfig({
      ...config,
      bgType: "image",
      bgImageUrl: imageUrl,
      savedBgImages: [imageUrl] // Temporarily keep max 1 image
    });
  };

  // Handles raw image processing, scaling & webp compression for localStorage performance
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn ảnh hợp lệ (.png, .jpg, .webp)");
      return;
    }

    setIsProcessing(true);
    setUploadError("");

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError("Không thể đọc tệp hình ảnh.");
      setIsProcessing(false);
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        setUploadError("Tệp hình ảnh bị lỗi.");
        setIsProcessing(false);
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width / height > MAX_WIDTH / MAX_HEIGHT) {
              width = MAX_WIDTH;
              height = Math.round(img.height * (MAX_WIDTH / img.width));
            } else {
              height = MAX_HEIGHT;
              width = Math.round(img.width * (MAX_HEIGHT / img.height));
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/webp", 0.45);
            addSavedImage(compressedBase64);
          } else {
            addSavedImage(e.target?.result as string);
          }
        } catch (err) {
          console.error("Image optimization failed:", err);
          addSavedImage(e.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const panelClass = "glass p-4 flex flex-col gap-4 relative";

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-hidden min-h-0 h-full text-foreground pb-6">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 lg:px-4 pb-24 flex flex-col gap-4 pt-2">
        
        {/* TOP LEVEL CHOOSE: GRADIENT VS IMAGE BACKGROUND */}
        <div className={panelClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                 <ImageIcon className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-[13px] font-bold text-white">Nền Ứng Dụng</h3>
            </div>
            
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleUpdate({ bgType: "gradient" })}
                className={`flex-1 py-1 px-3.5 rounded-lg text-xs font-bold transition-all ${
                  bgType === "gradient" 
                    ? "bg-accent/15 text-accent border border-accent/20" 
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                Màu sắc
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ bgType: "image" })}
                className={`flex-1 py-1 px-3.5 rounded-lg text-xs font-bold transition-all ${
                  bgType === "image" 
                    ? "bg-accent/15 text-accent border border-accent/20" 
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                Hình ảnh
              </button>
            </div>
          </div>

          {bgType === "gradient" ? (
            <div className="flex flex-wrap gap-2">
              {Object.keys(APP_THEMES).map((themeKey) => {
                const themeName = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
                const isActive = config.bgTheme === themeKey;
                const labels: Record<string, string> = {
                  default: 'Mặc định', neonCyber: 'Neon', slate: 'Xám', sunset: 'Hoàng hôn', aurora: 'Cực quang', ocean: 'Đại dương', violet: 'Tím', emerald: 'Lục bảo'
                };
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => handleUpdate({ bgTheme: themeKey })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      isActive 
                        ? 'border-accent/40 text-accent bg-accent/10 shadow-sm' 
                        : 'border-white/5 bg-black/20 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {labels[themeKey] || themeName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div 
                id="bg-upload-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full sm:w-[150px] h-[60px] border border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative shrink-0 ${
                  isDragging 
                    ? "border-accent bg-accent/10" 
                    : "border-white/15 hover:border-white/30 bg-black/20 hover:bg-black/40"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  onClick={(e) => e.stopPropagation()}
                  accept="image/*"
                  className="hidden" 
                />
                
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-300">Tải ảnh lên</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="text-rose-400 text-[11px] font-bold">{uploadError}</div>
              )}

              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentImageUrl.startsWith("data:") ? "Ảnh tự tải (Base64)" : currentImageUrl}
                    disabled={currentImageUrl.startsWith("data:")}
                    onChange={(e) => handleUpdate({ bgImageUrl: e.target.value })}
                    placeholder="URL ảnh..."
                    className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate({ bgImageUrl: DEFAULT_WALLPAPER_URL })}
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 hover:bg-white/5 text-[11px] font-bold transition-all text-slate-300 shrink-0"
                  >
                    Mặc định
                  </button>
                </div>
                
                {(config.savedBgImages || []).length > 0 && (
                  <div className="flex gap-2 items-center">
                    {(config.savedBgImages || []).map((imgUrl, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleUpdate({ bgType: "image", bgImageUrl: imgUrl })}
                        className={`w-12 h-8 rounded-md overflow-hidden border cursor-pointer relative group ${
                          bgType === "image" && config.bgImageUrl === imgUrl ? "border-accent ring-1 ring-accent/50" : "border-white/10 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newList = (config.savedBgImages || []).filter((_, i) => i !== idx);
                            const fallbackUrl = config.bgImageUrl === imgUrl ? (newList.length > 0 ? newList[0] : DEFAULT_WALLPAPER_URL) : config.bgImageUrl;
                            handleUpdate({ bgImageUrl: fallbackUrl, savedBgImages: newList });
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMIZE GLASSMORPHISM */}
        <div className={panelClass}>
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.04]">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="text-[13px] font-bold text-white">Hiệu Ứng Glassmorphism</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-slate-200">Độ mờ hậu cảnh (Blur)</span>
                <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono border border-accent/20">{blurAmount}px</span>
              </div>
              <input 
                type="range" min="0" max="100" value={blurAmount}
                onChange={(e) => handleUpdate({ blurAmount: parseInt(e.target.value) })}
                className="w-full h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-slate-200">Độ đục (Glass Opacity)</span>
                <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono border border-accent/20">{config.glassOpacity}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={config.glassOpacity}
                onChange={(e) => handleUpdate({ glassOpacity: parseInt(e.target.value) })}
                className="w-full h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-slate-200">Phủ tối (Overlay Shade)</span>
                <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono border border-accent/20">{config.bgOverlay}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={config.bgOverlay}
                onChange={(e) => handleUpdate({ bgOverlay: parseInt(e.target.value) })}
                className="w-full h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-slate-200">Bo góc (Border Radius)</span>
                <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono border border-accent/20">{borderRadius}px</span>
              </div>
              <input 
                type="range" min="8" max="32" value={borderRadius}
                onChange={(e) => handleUpdate({ borderRadius: parseInt(e.target.value) })}
                className="w-full h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        </div>

        {/* ACCENT COLORS */}
        <div className={panelClass}>
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.04]">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-[13px] font-bold text-white">Màu Điểm Nhấn</h3>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {COLOR_OPTIONS.map((color) => {
              const isActive = config.primaryColorName === color.name;
              return (
                <div key={color.name} onClick={() => handleUpdate({ primaryColorName: color.name })}
                     className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center p-[2px] transition-all ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-[#071928]' : 'hover:ring-1 hover:ring-white/20'}`}>
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: color.hex }}>
                      {isActive && <Check className="w-4 h-4 mx-auto mt-[6px] text-[#06202A] stroke-[4px]" />}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold ${isActive ? 'text-accent' : 'text-slate-500'}`}>{color.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TYPOGRAPHY */}
        <div className={panelClass}>
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.04]">
            <Type className="w-4 h-4 text-accent" />
            <h3 className="text-[13px] font-bold text-white">Phông Chữ</h3>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-[11.5px] font-bold text-slate-200">Cỡ chữ</span>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  {[
                    { label: "13px", val: "small" },
                    { label: "14px", val: "base" },
                    { label: "15px", val: "large" }
                  ].map((opt) => (
                    <button
                      key={opt.val} type="button" onClick={() => handleUpdate({ fontSize: opt.val })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${config.fontSize === opt.val ? 'bg-accent/15 text-accent border border-accent/20' : 'text-slate-400 hover:text-white border border-transparent'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-[2] flex flex-col gap-2">
                <span className="text-[11.5px] font-bold text-slate-200">Bộ mặt chữ</span>
                <div className="flex flex-wrap gap-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.name} type="button" onClick={() => handleUpdate({ fontFamily: font.name })}
                      style={{ fontFamily: font.name === 'Hệ thống' ? 'system-ui' : font.value.split(',')[0] }}
                      className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all border ${config.fontFamily === font.name ? 'border-accent/40 text-accent bg-accent/10' : 'border-white/5 bg-black/20 text-slate-400'}`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
