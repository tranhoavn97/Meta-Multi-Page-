import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T> {
  value: T;
  label: string;
}

export interface CustomDropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
  align?: "left" | "right";
  width?: "auto" | "trigger" | number;
}

export function CustomDropdown<T>({
  value,
  options,
  onChange,
  label,
  disabled = false,
  align = "left",
  width = "trigger",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Estimated dropdown height, default to 200px max
      const estimatedHeight = Math.min(options.length * 32 + 12, 260); 

      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX;
      let minWidthTarget = width === "trigger" ? rect.width : (typeof width === "number" ? width : undefined);

      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
          // Open upwards
          top = rect.top + window.scrollY - estimatedHeight - 4;
      }
      
      let dropdownWidth = minWidthTarget ? `${minWidthTarget}px` : "auto";
      
      const newStyle: React.CSSProperties = {
          position: "absolute",
          top: `${top}px`,
          minWidth: dropdownWidth,
          maxWidth: "260px",
      };

      if (align === "right") {
          newStyle.left = "auto";
          newStyle.right = `${window.innerWidth - rect.right - window.scrollX}px`;
      } else {
          newStyle.left = `${left}px`;
      }
      
      if (width === "trigger") {
         newStyle.width = `${rect.width}px`;
      }

      setDropdownStyle(newStyle);
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, align, width, options.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        // Also check if the click was inside the dropdown menu (it's in a portal)
        const dropdownElements = document.querySelectorAll('[data-dropdown-menu]');
        let clickedInsideDropdown = false;
        dropdownElements.forEach(el => {
          if (el.contains(e.target as Node)) clickedInsideDropdown = true;
        });
        
        if (!clickedInsideDropdown) {
          setIsOpen(false);
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          inline-flex h-9 items-center justify-between gap-2 rounded-xl
          border border-white/10 bg-slate-950/55 px-3
          text-[11px] font-semibold text-slate-100 shadow-sm backdrop-blur-xl
          transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400/40
          ${disabled ? 'disabled:bg-slate-700/45 disabled:text-slate-400 disabled:border-white/5 disabled:cursor-not-allowed' : 'hover:bg-slate-900/75 hover:border-white/15 cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-1.5 truncate">
            {label && <span className="text-slate-400 font-medium shrink-0 pr-1">{label}</span>}
            <span className="text-white font-bold truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            data-dropdown-menu
            role="listbox"
            style={dropdownStyle}
            className="
              fixed z-[9999] w-max rounded-xl border border-white/10
              bg-[#071525]/[0.98] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)]
              backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100
            "
          >
            {options.map((opt, i) => {
              const isSelected = value === opt.value;
              return (
                <div
                  key={String(opt.value) + i}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2
                    text-left text-[11px] font-semibold transition-colors
                    ${isSelected 
                      ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/15" 
                      : "border border-transparent text-slate-200 hover:bg-white/[0.07] hover:text-white"
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
