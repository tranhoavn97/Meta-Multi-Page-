import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, Check } from "lucide-react";

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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2.5 bg-background border rounded-xl px-3.5 h-10 text-[12px] font-bold tracking-wide outline-none text-foreground cursor-pointer transition-all select-none min-w-[160px] shadow-sm ${
          isOpen ? "border-accent ring-1 ring-accent/20" : "border-border hover:border-border/80"
        }`}
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90 text-accent" : "rotate-0"}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-[99] min-w-full w-max glass-card border border-border rounded-xl shadow-lg p-1.5 overflow-hidden transition-all">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value, opt.label);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] font-bold tracking-wide transition-all flex items-center justify-between gap-3 cursor-pointer ${
                value === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-foreground hover:glass-panel"
              }`}
            >
              <span className="whitespace-nowrap">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-accent stroke-[3.5px] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
