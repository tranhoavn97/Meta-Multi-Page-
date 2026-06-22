import React, { useState } from "react";
import { format, parse, isValid, isAfter, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { DayPicker, DateRange } from "react-day-picker";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, SlidersHorizontal, ArrowRight } from "lucide-react";

interface DateRangePickerModalProps {
  initialFrom: string; // YYYY-MM-DD
  initialTo: string;   // YYYY-MM-DD
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}

export default function DateRangePickerModal({
  initialFrom,
  initialTo,
  onClose,
  onApply,
}: DateRangePickerModalProps) {
  // Parse initial dates correctly
  const parsedFrom = initialFrom ? parse(initialFrom, 'yyyy-MM-dd', new Date()) : undefined;
  const parsedTo = initialTo ? parse(initialTo, 'yyyy-MM-dd', new Date()) : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parsedFrom && isValid(parsedFrom) ? parsedFrom : undefined,
    to: parsedTo && isValid(parsedTo) ? parsedTo : undefined,
  });

  const [month, setMonth] = useState<Date>(
    parsedTo && isValid(parsedTo) ? parsedTo : new Date()
  );

  const handleApply = () => {
    if (dateRange?.from) {
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      const toStr = format(dateRange.to || dateRange.from, "yyyy-MM-dd");
      onApply(fromStr, toStr);
    } else {
      onApply("", "");
    }
  };

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const fromInputValue = dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : "";
  const toInputValue = dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card border border-border shadow-2xl rounded-[32px] w-full max-w-[650px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header Inputs */}
        <div className="p-4 border-b border-border flex items-center gap-4 glass-panel/30">
          <div className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 h-10 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 shadow-sm">
            <input 
              type="text" 
              readOnly 
              value={fromInputValue} 
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-sm text-foreground outline-none w-full"
            />
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          
          <div className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 h-10 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 shadow-sm">
            <input 
              type="text" 
              readOnly 
              value={toInputValue} 
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-sm text-foreground outline-none w-full"
            />
            <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 py-6 flex justify-center bg-card">
          <DayPicker
            mode="range"
            defaultMonth={month}
            numberOfMonths={2}
            selected={dateRange}
            onSelect={handleSelect}
            locale={vi}
            showOutsideDays={true}
            className="text-foreground select-none"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-foreground",
              caption_label: "text-[15px] font-bold capitalize",
              nav: "space-x-1 flex items-center",
              nav_button: "h-8 w-8 bg-transparent p-0 flex justify-center items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-lg w-10 font-bold text-[13px] uppercase tracking-wider",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 transition-all",
              day: "h-10 w-10 p-0 font-medium hover:bg-muted rounded-xl transition-colors aria-selected:opacity-100",
              day_selected: "bg-accent text-white hover:bg-accent focus:bg-accent font-bold shadow-md",
              day_today: "text-accent bg-accent/10 font-bold rounded-xl",
              day_outside: "text-muted-foreground/30",
              day_disabled: "text-muted-foreground/30",
              day_range_middle: "aria-selected:bg-muted aria-selected:text-foreground aria-selected:rounded-none !bg-transparent outline-none",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-[13px] font-bold transition-all shadow-sm"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!dateRange?.from}
            className="px-6 py-2.5 btn-primary disabled:opacity-50 text-white rounded-xl text-[13px] font-bold transition-all shadow-md"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
