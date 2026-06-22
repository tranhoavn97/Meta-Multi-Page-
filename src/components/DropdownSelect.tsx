import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  value: string;
  onChange: (val: string, label: string) => void;
  options: Option[];
}

export default function DropdownSelect({ value, onChange, options }: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 bg-background border rounded-xl px-3 h-9 text-[12px] font-bold tracking-wide outline-none text-foreground cursor-pointer transition-all select-none min-w-fit shadow-sm ${
          isOpen ? "border-accent ring-1 ring-accent/20" : "border-border hover:border-border/80"
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1.5 z-[999] min-w-full w-max max-w-[260px] max-h-[280px] overflow-y-auto overscroll-contain bg-card border border-border rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-top-1 zoom-in-[0.98] duration-150"
          role="listbox"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value, opt.label);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                value === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-accent stroke-[3.5px] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
