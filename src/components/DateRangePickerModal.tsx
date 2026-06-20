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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Light Theme matching the screenshot slightly but with app colors */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-[650px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header Inputs */}
        <div className="p-4 border-b border-slate-700/60 flex items-center gap-4 bg-slate-950/40">
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-3 h-10 transition-colors focus-within:border-blue-500">
            <input 
              type="text" 
              readOnly 
              value={fromInputValue} 
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-sm text-slate-100 outline-none w-full"
            />
          </div>
          
          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-3 h-10 transition-colors focus-within:border-blue-500">
            <input 
              type="text" 
              readOnly 
              value={toInputValue} 
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-sm text-slate-100 outline-none w-full"
            />
            <CalendarIcon className="w-4 h-4 text-slate-400 ml-2" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 flex justify-center bg-slate-900">
          <DayPicker
            mode="range"
            defaultMonth={month}
            numberOfMonths={2}
            selected={dateRange}
            onSelect={handleSelect}
            locale={vi}
            showOutsideDays={true}
            className="text-slate-200 select-none"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-slate-100",
              caption_label: "text-sm font-bold capitalize",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex justify-center items-center rounded-md hover:bg-slate-800",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-slate-400 rounded-md w-9 font-bold text-[12px] uppercase",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-600/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 transition-all",
              day: "h-9 w-9 p-0 font-medium hover:bg-slate-800 rounded-md transition-colors aria-selected:opacity-100",
              day_selected: "bg-blue-600 text-white hover:bg-blue-500 focus:bg-blue-600 font-bold",
              day_today: "text-blue-400 bg-blue-500/10 font-bold",
              day_outside: "text-slate-600 opacity-50",
              day_disabled: "text-slate-600 opacity-50",
              day_range_middle: "aria-selected:bg-slate-800 aria-selected:text-blue-100 aria-selected:rounded-none !bg-transparent",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-950/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-bold transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!dateRange?.from}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
