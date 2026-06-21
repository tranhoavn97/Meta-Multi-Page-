import React, { useState, useRef } from "react";
import { 
  Sun, Moon, LayoutTemplate, Type, Settings2, Palette, Box, Check, Image as ImageIcon, Sliders, Layers, Focus, Upload, AlertCircle, RefreshCw
} from "lucide-react";
import { useThemeConfig, APP_THEMES, COLOR_OPTIONS, FONT_OPTIONS } from "../hooks/useThemeConfig";

interface ThemeSettingsTabProps {
  isDark?: boolean;
  setIsDark?: (dark: boolean) => void;
}

const DEFAULT_WALLPAPER_URL = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80";

export default function ThemeSettingsTab({}: ThemeSettingsTabProps) {
  const { config, setConfig } = useThemeConfig();
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
    const list = config.savedBgImages || [];
    if (!list.includes(imageUrl)) {
      const newList = [imageUrl, ...list].slice(0, 5);
      handleUpdate({ bgType: "image", bgImageUrl: imageUrl, savedBgImages: newList });
    } else {
      handleUpdate({ bgType: "image", bgImageUrl: imageUrl });
    }
  };

  // Handles raw image processing, scaling & jpeg compression for localStorage performance
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn một tệp hình ảnh hợp lệ (.png, .jpg, .jpeg, .webp)");
      return;
    }

    setIsProcessing(true);
    setUploadError("");

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError("Không thể đọc tệp hình ảnh này.");
      setIsProcessing(false);
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        setUploadError("Tệp hình ảnh bị lỗi hoặc không thể dựng.");
        setIsProcessing(false);
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Optimal aspect preservation downscaling bounds: 1024x576 is ideal for blurred backgrounds
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 576;
          
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
            // High-efficiency JPEG format compressing at 55% quality (~50KB payload)
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.55);
            addSavedImage(compressedBase64);
          } else {
            // Fallback to raw base64 if canvas context is unavailable
            addSavedImage(e.target?.result as string);
          }
        } catch (err) {
          console.error("Image optimization failed, using draft:", err);
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

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-hidden min-h-0 h-full text-foreground pb-6">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 lg:px-6 pb-24 flex flex-col gap-6 pt-4">
        
        {/* TOP LEVEL CHOOSE: GRADIENT VS IMAGE BACKGROUND */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-accent" />
                VẬT LIỆU NỀN ỨNG DỤNG (BACKGROUND CHANGER)
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">Chọn màu chuyển sắc nghệ thuật hoặc tải lên hình ảnh cá nhân</p>
            </div>
            
            {/* Toggle Tab Button between Gradient and Image */}
            <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 shrink-0 max-w-[260px]">
              <button
                type="button"
                onClick={() => handleUpdate({ bgType: "gradient" })}
                className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  bgType === "gradient" 
                    ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Màu Gradient
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ bgType: "image" })}
                className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  bgType === "image" 
                    ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Chọn ảnh của bạn
              </button>
            </div>
          </div>

          {/* RENDERING DEPENDS ON BG TYPE SELECTED */}
          {bgType === "gradient" ? (
            <div className="flex flex-wrap gap-2.5 pt-2">
              {Object.keys(APP_THEMES).map((themeKey) => {
                const themeName = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
                const isActive = config.bgTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => handleUpdate({ bgTheme: themeKey })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isActive 
                        ? 'border-2 border-accent text-accent bg-accent/10 shadow-accent/20' 
                        : 'glass-panel text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {themeName === 'Default' ? 'Mặc định' : themeName === 'NeonCyber' ? 'Neon Cyber' : themeName === 'Slate' ? 'Xám đá' : themeName === 'Sunset' ? 'Hoàng hôn' : themeName === 'Aurora' ? 'Cực quang' : themeName === 'Ocean' ? 'Đại dương' : themeName === 'Violet' ? 'Tím thẫm' : themeName === 'Emerald' ? 'Lục bảo' : themeName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-5 pt-2">
              
              {/* DRAG AND DROP FILE UPLOAD AREA */}
              <div 
                id="bg-upload-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer relative min-h-[120px] select-none ${
                  isDragging 
                    ? "border-[#1877F2] bg-[#1877F2]/10 scale-102" 
                    : "border-white/10 hover:border-white/25 bg-slate-900/20 hover:bg-slate-900/40"
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
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-[#1877F2] animate-spin" />
                    <span className="text-xs font-bold text-white">Đang nén & tối ưu hóa ảnh...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 shadow-sm">
                      <Upload className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Nhấp chuột hoặc kéo thả hình ảnh vào đây</span>
                      <span className="text-[10px] text-muted-foreground">Chấp nhận tất cả định dạng ảnh. Tự động tối ưu hóa hiệu năng cực mượt</span>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-xs font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Input custom image URL option */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Liên kết hình nền hiện tại:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentImageUrl.startsWith("data:") ? "Ảnh tự tải lên (Đang mã hóa an toàn Base64)" : currentImageUrl}
                    disabled={currentImageUrl.startsWith("data:")}
                    onChange={(e) => handleUpdate({ bgImageUrl: e.target.value })}
                    placeholder="Nhấp vào khung tải tệp ở trên hoặc dán URL ảnh tại đây..."
                    className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:ring-1 focus:ring-[#1877F2]/60 focus:border-[#1877F2] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate({ bgImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80" })}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-xs font-bold transition-all shrink-0 cursor-pointer text-slate-300 hover:text-white"
                  >
                    Khôi phục gốc
                  </button>
                </div>
              </div>

              {/* SAVED USER WALLPAPERS */}
              <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-white/5">
                <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Hình nền đã tải lên của bạn:
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(config.savedBgImages || []).length === 0 ? (
                    <div className="col-span-full border border-dashed border-white/10 rounded-xl py-6 px-4 text-center text-slate-550 text-[11px] select-none">
                      Chưa có hình nền tự tải nào. Kéo thả hoặc bấm vào ô trên để tải lên.
                    </div>
                  ) : (
                    (config.savedBgImages || []).map((imgUrl, idx) => {
                      const isSelected = bgType === "image" && config.bgImageUrl === imgUrl;
                      return (
                        <div 
                          key={idx}
                          onClick={() => handleUpdate({ bgType: "image", bgImageUrl: imgUrl })}
                          className={`group relative rounded-xl aspect-[16/10] overflow-hidden border cursor-pointer transition-all ${
                            isSelected 
                              ? "border-accent ring-2 ring-accent/30 shadow-md scale-102" 
                              : "border-white/5 hover:border-white/10 opacity-70 hover:opacity-100"
                          }`}
                          title={`Hình ảnh tự tải ${idx + 1}`}
                        >
                          <img 
                            src={imgUrl} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {/* Remove custom wallpaper */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newList = (config.savedBgImages || []).filter((_, i) => i !== idx);
                              const fallbackUrl = config.bgImageUrl === imgUrl 
                                ? (newList.length > 0 ? newList[0] : DEFAULT_WALLPAPER_URL) 
                                : config.bgImageUrl;
                              handleUpdate({ bgImageUrl: fallbackUrl, savedBgImages: newList });
                            }}
                            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-red-650 hover:bg-red-700 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10 text-[9px]"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                          
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMIZE GLASSMORPHISM - SLIDERS AREA */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-6 transition-all">
          <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">TUỲ CHỈNH ĐỘ TRONG SUỐT, BLUR & BO GÓC SQUIRCLE</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Blurring amount */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-foreground">Cường độ tán xạ Blur của ứng dụng</span>
                  <span className="text-[10px] text-muted-foreground">Độ mờ hậu cảnh dạng kính Cupertino</span>
                </div>
                <span className="bg-accent/10 px-2 py-0.5 rounded-md text-xs font-bold text-accent font-mono">{blurAmount} px</span>
              </div>
              <input 
                type="range" 
                min="0" max="40" 
                value={blurAmount}
                onChange={(e) => handleUpdate({ blurAmount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
                <span>0px (Trong suốt)</span>
                <span>24px (Mượt mà)</span>
                <span>40px (Siêu dày)</span>
              </div>
            </div>

            {/* SQUIRCLE Bo góc chuẩn Apple */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-foreground">Độ bo góc ứng dụng (Border Radius)</span>
                  <span className="text-[10px] text-muted-foreground">Bo góc cong mềm mượt theo Apple macOS Big Sur</span>
                </div>
                <span className="bg-accent/10 px-2 py-0.5 rounded-md text-xs font-bold text-accent font-mono">{borderRadius} px</span>
              </div>
              <input 
                type="range" 
                min="4" max="32" 
                value={borderRadius}
                onChange={(e) => handleUpdate({ borderRadius: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
                <span>4px (Sắc cạnh)</span>
                <span>20px (macOS)</span>
                <span>32px (Bong bóng)</span>
              </div>
            </div>

            {/* Glass panels opacity */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-foreground">Độ đục của kính mờ (Glass Opacity)</span>
                  <span className="text-[10px] text-muted-foreground">Độ trong suốt của bề mặt các tấm panel màn hình</span>
                </div>
                <span className="bg-accent/10 px-2 py-0.5 rounded-md text-xs font-bold text-accent font-mono">{config.glassOpacity}%</span>
              </div>
              <input 
                type="range" 
                min="5" max="95" 
                value={config.glassOpacity}
                onChange={(e) => handleUpdate({ glassOpacity: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
                <span>5% (Siêu mỏng)</span>
                <span>45% (Hài hòa)</span>
                <span>95% (Hầu như đục)</span>
              </div>
            </div>

            {/* Dark overlay multiplier */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-foreground">Cường độ che mờ bóng tối (Overlay Shade)</span>
                  <span className="text-[10px] text-muted-foreground">Độ sẫm tối của lớp phủ nền để bảo vệ mắt</span>
                </div>
                <span className="bg-accent/10 px-2 py-0.5 rounded-md text-xs font-bold text-accent font-mono">{config.bgOverlay}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.bgOverlay}
                onChange={(e) => handleUpdate({ bgOverlay: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
                <span>0% (Sáng tỏ)</span>
                <span>85% (Bảo vệ mắt)</span>
                <span>100% (Tối hẳn)</span>
              </div>
            </div>

          </div>
        </div>

        {/* MÀU SẮC SẮC THÁI CHỦ ĐẠO */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-5 transition-all w-full">
          <div className="flex gap-4 items-center mb-2">
            <div className="w-12 h-12 rounded-full shrink-0 shadow-lg border border-white/20" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === config.primaryColorName)?.hex }} />
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-accent" />
                MÀU SẮC CHỦ ĐẠO & ĐÈN LOGO (ACCENT COLOR)
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">
                Màu sắc dải lăng kính tương tác & điểm nhấn nút bấm: <span className="text-foreground font-extrabold">{config.primaryColorName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {COLOR_OPTIONS.map((color) => {
              const isActive = config.primaryColorName === color.name;
              return (
                <div key={color.name} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleUpdate({ primaryColorName: color.name })}>
                  <div className={`w-10 h-10 rounded-full transition-all flex items-center justify-center p-0.5 ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-white/20'}`}>
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

        {/* CỠ PHÔNG & BỘ MẶT CHỮ (TYPOGRAPHY ACCENTS) */}
        <div className="glass-panel p-5 xl:p-6 flex flex-col gap-6 transition-all">
          <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
            <Type className="w-4 h-4 text-accent" />
            <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">PHÔNG CHỮ VÀ KIỂU CHỮ (FONT ENGINE)</h3>
          </div>

          <div className="flex flex-col gap-5 pt-1">
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold text-foreground">Cỡ chữ hệ thống</span>
              <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 max-w-lg w-full">
                {[
                  { label: "Cực gọn (13px)", val: "small" },
                  { label: "Tiêu chuẩn (14px)", val: "base" },
                  { label: "Dành cho màn lớn (15px)", val: "large" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleUpdate({ fontSize: opt.val })}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm ${config.fontSize === opt.val ? 'bg-[#1877F2]/15 border border-[#1877F2]/30 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[12px] font-bold text-foreground">Bộ mặt chữ (Font Family)</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => handleUpdate({ fontFamily: font.name })}
                    className={`py-3 px-3 rounded-2xl text-[12px] font-bold transition-all text-center border shadow-sm cursor-pointer ${config.fontFamily === font.name ? 'border-[#1877F2] bg-[#1877F2]/10 text-white shadow-[#1877F2]/10' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
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
    </div>
  );
}
