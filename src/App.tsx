import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Facebook, 
  Settings, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Clock, 
  CheckSquare, 
  Square, 
  RotateCw, 
  ShieldAlert, 
  CheckCircle, 
  XOctagon, 
  Info,
  LogOut,
  ExternalLink,
  Lock,
  ListFilter,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  FileText,
  SlidersHorizontal,
  Image as ImageIcon,
  Video,
  Play,
  ThumbsUp,
  MessageSquare,
  Share2,
  TrendingUp,
  Activity,
  X,
  Users,
  Briefcase,
  Sun,
  Moon,
  Loader2,
  Palette
} from "lucide-react";
import { FacebookPage, FacebookPost, FilterCriteria, DeletionLog } from "./types";
import { safeFetchJson } from "./utils/safeFetchJson";
import { useToast } from "./components/Toast";
import ThemeSettingsTab from "./components/ThemeSettingsTab";
import { useThemeConfig } from "./hooks/useThemeConfig";
import DateRangePickerModal from "./components/DateRangePickerModal";

// ==========================================
// CUSTOM UI COMPONENTS (UNIFIED DESIGN)
// ==========================================

function CustomDatePicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [navDate, setNavDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setNavDate(d);
      }
    }
  }, [value]);

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

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  
  const getFirstDayIndex = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  const totalDays = getDaysInMonth(year, month);
  const firstDayWeeklyIndex = getFirstDayIndex(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const totalDaysInPrev = getDaysInMonth(prevMonthYear, prevMonth);
  for (let i = firstDayWeeklyIndex - 1; i >= 0; i--) {
    const d = totalDaysInPrev - i;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${prevMonthYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const paddingNeeded = 42 - days.length;
  for (let d = 1; d <= paddingNeeded; d++) {
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  const changeMonth = (offset: number) => {
    const newDate = new Date(year, month + offset, 1);
    setNavDate(newDate);
  };

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setNavDate(today);
    onChange(todayStr);
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return "dd/mm/yyyy";
    const parts = value.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  };

  const vietnameseMonths = [
    "Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
    "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"
  ];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-between w-full h-9 bg-background border border-border hover:glass-panel disabled:border-muted focus:border-accent rounded-xl px-3 text-xs text-left text-foreground disabled:opacity-35 cursor-pointer font-bold select-none transition-all shadow-sm"
      >
        <span className={`${value ? "text-foreground" : "text-muted-foreground"} font-semibold font-mono`}>
          {displayValue()}
        </span>
        <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[99] w-[270px] glass-card border border-border rounded-2xl shadow-xl p-4 text-foreground select-none transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-xs font-bold tracking-wide">
              {vietnameseMonths[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-muted-foreground mt-2 font-mono">
            {["H", "B", "T", "N", "S", "B", "C"].map((d, idx) => (
              <span key={idx} className={idx >= 5 ? "text-rose-500 font-extrabold" : ""}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mt-1 text-center font-mono">
            {days.map(({ day, isCurrentMonth, dateStr }, index) => {
              const isSelected = value === dateStr;
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(dateStr)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-accent text-white shadow-md border border-accent/20"
                      : isToday
                      ? "bg-accent/10 text-accent ring-1 ring-accent/30 font-extrabold"
                      : isCurrentMonth
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border text-[11px] font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-500 hover:text-rose-400 hover:underline cursor-pointer"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-accent hover:text-accent/80 hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  options: { value: number; label: string }[];
}) {
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

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 bg-transparent hover:text-accent focus:text-accent h-7 px-1 text-xs outline-none text-foreground font-bold cursor-pointer transition-all select-none min-w-[50px]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-accent ${isOpen ? "rotate-90 text-accent" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[115%] z-[99] w-[160px] bg-card/90 backdrop-blur-3xl border border-glass-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-1 ease-out animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-100 ring-1 ring-white/5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:translate-x-0.5 transition-all flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] font-bold"
                  : "text-foreground hover:bg-white/10"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface RateLimitStatus {
  maxUsage: number;
  type: "app" | "page" | "business" | "none";
  estimatedTimeToRegainAccess: number; // in seconds
}

export function parseRateLimitHeader(appHeader: string | null, pageHeader: string | null, bizHeader: string | null): RateLimitStatus {
  let maxUsage = 0;
  let type: "app" | "page" | "business" | "none" = "none";
  let estimatedTimeToRegainAccess = 0;

  const getMaxPct = (obj: any): number => {
    if (!obj) return 0;
    try {
      if (typeof obj === "string") {
        if (obj.startsWith("{")) {
          const parsed = JSON.parse(obj);
          let maxVal = 0;
          for (const key of Object.keys(parsed)) {
            const val = parseFloat(parsed[key]);
            if (!isNaN(val) && val > maxVal) maxVal = val;
          }
          return maxVal;
        }
        const val = parseFloat(obj);
        return isNaN(val) ? 0 : val;
      } else if (typeof obj === "object") {
        let maxVal = 0;
        for (const key of Object.keys(obj)) {
          const val = parseFloat(obj[key]);
          if (!isNaN(val) && val > maxVal) maxVal = val;
        }
        return maxVal;
      }
    } catch (e) {}
    return 0;
  };

  const appPct = getMaxPct(appHeader);
  if (appPct > maxUsage) {
    maxUsage = appPct;
    type = "app";
  }

  const pagePct = getMaxPct(pageHeader);
  if (pagePct > maxUsage) {
    maxUsage = pagePct;
    type = "page";
  }

  if (bizHeader) {
    try {
      const bizObj = JSON.parse(bizHeader);
      for (const key of Object.keys(bizObj)) {
        const items = bizObj[key];
        if (Array.isArray(items)) {
          for (const item of items) {
            const val = Math.max(item.call_count || 0, item.total_cputime || 0, item.total_time || 0);
            if (val > maxUsage) {
              maxUsage = val;
              type = "business";
            }
            if (item.estimated_time_to_regain_access && item.estimated_time_to_regain_access > estimatedTimeToRegainAccess) {
              estimatedTimeToRegainAccess = item.estimated_time_to_regain_access * 60;
            }
          }
        }
      }
    } catch (e) {}
  }

  return { maxUsage, type, estimatedTimeToRegainAccess };
}

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (v: any) => void;
  reject: (err: any) => void;
  label: string;
  type: "pages" | "posts" | "delete";
  pageId?: string;
}

class RequestQueue {
  private activeCount = 0;
  private queue: QueueItem[] = [];
  private processedCount = 0;
  private restTimer: any = null;
  private countdownInterval: any = null;
  
  // States that we want to expose to React UI via a listener
  public isResting = false;
  public restTimeLeft = 0;
  public currentRequestRunning = "";
  public isPaused = false;
  public isSafeMode = true; // Enabled by default (Requirement 12)
  
  // Callback listener to notify React UI of state changes
  private onStateChange: (() => void) | null = null;

  constructor() {}

  public setListener(listener: () => void) {
    this.onStateChange = listener;
  }

  private notify() {
    if (this.onStateChange) this.onStateChange();
  }

  public getRemainingCount() {
    return this.queue.length;
  }

  async enqueue(
    fn: () => Promise<any>, 
    label: string, 
    type: "pages" | "posts" | "delete",
    pageId?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, label, type, pageId });
      this.notify();
      this.process();
    });
  }

  private triggerRest(seconds: number, reason: string) {
    if (this.isResting) return;
    this.isResting = true;
    this.restTimeLeft = seconds;
    this.currentRequestRunning = `Đang nghỉ: ${reason}`;
    this.notify();

    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.restTimeLeft--;
      if (this.restTimeLeft <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      this.notify();
    }, 1000);

    if (this.restTimer) clearTimeout(this.restTimer);
    this.restTimer = setTimeout(() => {
      this.isResting = false;
      this.restTimeLeft = 0;
      this.currentRequestRunning = "";
      this.notify();
      this.process();
    }, seconds * 1000);
  }

  public pauseQueue(reason: string) {
    this.isPaused = true;
    this.currentRequestRunning = `Đang TẠM DỪNG (Rate Limit: ${reason})`;
    this.notify();
  }

  public resumeQueue() {
    this.isPaused = false;
    this.currentRequestRunning = "";
    this.notify();
    this.process();
  }

  private getDelay(): number {
    if (this.isSafeMode) {
      return 2000; // 2 seconds in SAFE MODE (Requirement 11)
    } else {
      // Random delay between 1500ms and 3000ms (Requirement 3)
      return Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500;
    }
  }

  private process() {
    // Enforce maxConcurrency = 1 (Requirement 1)
    if (this.activeCount >= 1) return;
    if (this.isResting || this.isPaused) return;
    if (this.queue.length === 0) {
      if (this.activeCount === 0) {
        this.currentRequestRunning = "";
        this.notify();
      }
      return;
    }

    const req = this.queue.shift()!;
    this.activeCount++;
    this.currentRequestRunning = req.label;
    this.notify();

    const runTask = async () => {
      try {
        const result = await req.fn();
        req.resolve(result);

        // Check response/error for Rate Limit signals (Requirement 9)
        const isLimited = this.checkRateLimitSignal(result);
        if (isLimited) {
          this.pauseQueue(result?.error?.message || "Rate limit reached");
          req.reject(new Error("Rate limit pause triggered"));
          return;
        }

        // Successfully completed request, increment counts
        this.processedCount++;

        // Handle cooldown triggers
        const limitRequests = 20; // 20 requests
        const restDuration = this.isSafeMode ? 30 : 5; // 30s in Safe Mode, 5s in Normal Mode

        // After each Fanpage: rest for 30s in Safe Mode, 5s in Normal Mode
        if (req.type === "posts") {
          const restTime = this.isSafeMode ? 30 : 5;
          this.triggerRest(restTime, `Nghỉ sau khi rà soát Fanpage (${restTime}s)`);
        } else if (this.processedCount >= limitRequests) {
          this.processedCount = 0;
          this.triggerRest(restDuration, `Đã chạy ${limitRequests} requests. Nghỉ hồi phục (${restDuration}s)`);
        } else {
          // Normal delay between requests (Requirement 3 & 11)
          const delay = this.getDelay();
          this.triggerRest(Math.ceil(delay / 1000), `Giãn cách request (${delay}ms)`);
        }

      } catch (err: any) {
        req.reject(err);
        const isLimited = this.checkRateLimitSignal(err);
        if (isLimited) {
          this.pauseQueue(err.message || "Rate limit reached");
        } else {
          const delay = this.getDelay();
          this.triggerRest(Math.ceil(delay / 1000), `Giãn cách request sau lỗi (${delay}ms)`);
        }
      } finally {
        this.activeCount--;
        this.notify();
      }
    };

    runTask();
  }

  private checkRateLimitSignal(dataOrError: any): boolean {
    if (!dataOrError) return false;
    const isErr = dataOrError instanceof Error;
    const responseJson = isErr ? (dataOrError as any).responseJson : dataOrError;
    const status = isErr ? (dataOrError as any).status : null;
    
    let errorCode = responseJson?.errorCode || responseJson?.error?.code || dataOrError?.errorCode || dataOrError?.error?.code;
    let message = isErr ? dataOrError.message : "";
    if (responseJson?.error?.message) {
      message = responseJson.error.message;
    } else if (dataOrError?.error?.message) {
      message = dataOrError.error.message;
    }

    const msgLower = (message || "").toLowerCase();
    const isRateLimited = 
      status === 429 ||
      errorCode === 4 ||
      errorCode === 613 ||
      msgLower.includes("application request limit reached") ||
      msgLower.includes("calls to this api have exceeded");

    return !!isRateLimited;
  }

  clear() {
    this.queue.forEach(req => req.reject(new Error("Queue cleared")));
    this.queue = [];
    this.processedCount = 0;
    this.notify();
  }
}

export const requestQueue = new RequestQueue();

function CustomSelectStr({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; label: string }[];
}) {
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

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 bg-transparent hover:text-accent focus:text-accent h-7 px-1 text-xs outline-none text-foreground font-bold cursor-pointer transition-all select-none min-w-[50px]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-accent ${isOpen ? "rotate-90 text-accent" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[115%] z-[99] w-[160px] bg-card/90 backdrop-blur-3xl border border-glass-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-1 ease-out animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-100 ring-1 ring-white/5 select-none">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:translate-x-0.5 transition-all flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] font-bold"
                  : "text-foreground hover:bg-white/10"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `Có thể thử lại sau ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function App() {
  const toast = useToast();
  const { config, setConfig } = useThemeConfig(); // Instantiate global theme styles

  const isDark = true;
  const setIsDark = () => {};

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // OAuth / Credentials state
  const [appId, setAppId] = useState<string>(() => {
    return localStorage.getItem("meta_app_id") || "";
  });
  const [appSecret, setAppSecret] = useState<string>(() => {
    return localStorage.getItem("meta_app_secret") || "";
  });
  const [userToken, setUserToken] = useState<string>(() => {
    return localStorage.getItem("meta_user_token") || "";
  });

  // Pages & Posts state
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pageSearchQuery, setPageSearchQuery] = useState<string>("");
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const cleanString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const filteredPages = useMemo((): FacebookPage[] => {
    const query = cleanString(pageSearchQuery.trim());
    if (!query) return pages;
    return pages.filter(
      page => cleanString(page.name || "").includes(query) || (page.id || "").includes(query)
    );
  }, [pages, pageSearchQuery]);

  // Request Queue reactive states for UI (Requirement 10)
  const [queueRunning, setQueueRunning] = useState<string>("");
  const [queueRemaining, setQueueRemaining] = useState<number>(0);
  const [queueRestTime, setQueueRestTime] = useState<number>(0);
  const [queueIsPaused, setQueueIsPaused] = useState<boolean>(false);
  const [safeMode, setSafeMode] = useState<boolean>(true); // SAFE MODE enabled by default (Requirement 12)

  // Listen to Request Queue state changes
  useEffect(() => {
    requestQueue.setListener(() => {
      setQueueRunning(requestQueue.currentRequestRunning);
      setQueueRemaining(requestQueue.getRemainingCount());
      setQueueRestTime(requestQueue.restTimeLeft);
      setQueueIsPaused(requestQueue.isPaused);
    });
    // Set initial safe mode
    requestQueue.isSafeMode = safeMode;
  }, [safeMode]);
  
  // Statuses
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentlyDeletingId, setCurrentlyDeletingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Meta API rate limiting and Polling states
  const [currentUsageMax, setCurrentUsageMax] = useState<number>(0);
  const [jobsErrorCount, setJobsErrorCount] = useState<number>(0);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [hasRunningJobs, setHasRunningJobs] = useState<boolean>(false);

  // Filters State
  const [filters, setFilters] = useState<FilterCriteria>({
    olderThanDays: 30,
    enableOlderThan: false,
    dateFrom: "",
    dateTo: "",
    enableDateRange: false,
    keyword: "",
    enableKeyword: false,
    maxPostsToFetch: 100,
    maxPostsToShow: 300,
    timeRangePreset: "all",
    contentType: "all",
  });
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState<boolean>(false);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [tempDateFrom, setTempDateFrom] = useState<string>("");
  const [tempDateTo, setTempDateTo] = useState<string>("");

  // Local state for keyword input to make UI Typing instantaneous and lag-free
  const [keywordInput, setKeywordInput] = useState<string>(filters.keyword);

  // Synchronize local input state with filters keyword if changed externally
  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  // Debounced effect for keyword filtering to avoid recalculation on heavy loops
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters(f => {
        const hasKeyword = keywordInput.trim().length > 0;
        if (f.keyword === keywordInput && f.enableKeyword === hasKeyword) return f;
        return { ...f, keyword: keywordInput, enableKeyword: hasKeyword };
      });
    }, 150); // Fast 150ms debounce response

    return () => clearTimeout(delayDebounce);
  }, [keywordInput]);

  // Logs & Progress
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<"all" | "error" | "success">("all");
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentPageName: string }>({ current: 0, total: 0, currentPageName: "" });
  const [deletedCountSession, setDeletedCountSession] = useState<number>(0);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [doubleConfirm, setDoubleConfirm] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [videoDeleteOption, setVideoDeleteOption] = useState<"post_only" | "all">("post_only");
  const hasVideoSelected = useMemo(() => {
    return posts.some(p => selectedPostIds.includes(p.id) && (p.itemType === "video" || p.itemType === "reel"));
  }, [posts, selectedPostIds]);

  // Active Tab state for UI views integration
  const [activeTab, setActiveTab] = useState<"posts" | "theme">("posts");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // References for logging & scroll
  const logContainerRef = useRef<HTMLDivElement>(null);
  const postListScrollRef = useRef<HTMLDivElement>(null);
  const [postListScrollTop, setPostListScrollTop] = useState(0);
  const [postListContainerHeight, setPostListContainerHeight] = useState(500);
  const scanCancelledRef = useRef<boolean>(false);
  const deleteCancelledRef = useRef<boolean>(false);

  // Save Config to LocalStorage
  const saveCredentials = () => {
    localStorage.setItem("meta_app_id", appId);
    localStorage.setItem("meta_app_secret", appSecret);
    localStorage.setItem("meta_user_token", userToken);
    addLog("system", "Đã lưu cài đặt Meta Credentials vào thiết bị.", "success");
    toast.success("Cài đặt Meta Credentials đã được lưu cục bộ cực kỳ an toàn.", "Lưu cài đặt");
    setShowConfig(false);
  };

  // Reset Credentials
  const clearCredentials = () => {
    localStorage.removeItem("meta_app_id");
    localStorage.removeItem("meta_app_secret");
    localStorage.removeItem("meta_user_token");
    sessionStorage.clear();
    setAppId("");
    setAppSecret("");
    setUserToken("");
    setPages([]);
    setPosts([]);
    setSelectedPageIds([]);
    setSelectedPostIds([]);
    setLogs([]);
    addLog("system", "Đã xóa sạch bộ nhớ tài khoản Facebook.", "success");
    toast.info("Đã đăng xuất và xóa sạch cấu hình khỏi trình duyệt của bạn.", "Đăng xuất thành công");
  };

  const handleAuthError = (errMsg: string) => {
    const msg = typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg);
    if (msg.includes("Session has expired") || msg.includes("Error validating access token") || msg.includes("OAuthException")) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại Facebook.", "Hết hạn phiên");
      localStorage.removeItem("meta_user_token");
      sessionStorage.clear();
      setUserToken("");
      setPages([]);
      setPosts([]);
      setSelectedPageIds([]);
      return true;
    }
    return false;
  };

  // Listen to tab visibility to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Poll /api/jobs/active dynamically matching user's specific constraints (Requirement 15)
  useEffect(() => {
    if (jobsErrorCount >= 2) return;
    if (!hasRunningJobs) return;
    if (!isTabVisible) return;

    let timerId: any = null;

    const performPoll = async () => {
      try {
        const res = await fetch("/api/jobs/active");
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}`);
        }
        const data = await res.json();
        
        // Reset error count on successful communication
        setJobsErrorCount(0);

        // Check if there are active jobs
        const running = !!(data && data.activeJobsCount && data.activeJobsCount > 0);
        setHasRunningJobs(running);
      } catch (err: any) {
        setJobsErrorCount(prev => {
          const nextVal = prev + 1;
          if (nextVal >= 2) {
            addLog("system", `Đã dừng kiểm tra trạng thái tiến trình nền do API báo lỗi 2 lần liên tiếp: ${err.message}`, "failed");
          }
          return nextVal;
        });
      }
    };

    let currentInterval = 2000; // 2s when job is running

    const runLoop = () => {
      performPoll().finally(() => {
        timerId = setTimeout(runLoop, currentInterval);
      });
    };

    timerId = setTimeout(runLoop, currentInterval);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [hasRunningJobs, isTabVisible, jobsErrorCount]);

  const handleRateLimitOrUsage = (dataOrError: any, pageName?: string, isDeleteAction: boolean = false) => {
    const isErr = dataOrError instanceof Error;
    const responseJson = isErr ? (dataOrError as any).responseJson : dataOrError;
    const status = isErr ? (dataOrError as any).status : null;
    
    // Extract message and error codes
    let message = isErr ? dataOrError.message : "";
    let errorCode = responseJson?.errorCode || responseJson?.error?.code || dataOrError?.errorCode || dataOrError?.error?.code;
    
    if (responseJson?.error?.message) {
      message = responseJson.error.message;
    } else if (dataOrError?.error?.message) {
      message = dataOrError.error.message;
    }
    
    const msgLower = (message || "").toLowerCase();
    const isRateLimited = 
      status === 429 ||
      errorCode === 4 ||
      errorCode === 613 ||
      msgLower.includes("application request limit reached") ||
      msgLower.includes("calls to this api have exceeded");

    const retryAfterSeconds = isErr 
      ? ((dataOrError as any).retryAfterSeconds || responseJson?.retryAfterSeconds || null)
      : (dataOrError?.retryAfterSeconds || null);

    // 1. If rate limited, return true so the caller can handle it
    if (isRateLimited) {
      return true; // was rate limited
    }

    // 2. Read usage info and adjust behavior / warn / halt
    const info = responseJson?.rateLimitInfo || responseJson?._rateLimitInfo || dataOrError?.rateLimitInfo || dataOrError?._rateLimitInfo;
    if (info) {
      const parseUsagePct = (headerVal: any): number => {
        if (!headerVal) return 0;
        try {
          if (typeof headerVal === "string") {
            if (headerVal.startsWith("{")) {
              const parsed = JSON.parse(headerVal);
              let maxVal = 0;
              for (const key of Object.keys(parsed)) {
                const val = parseFloat(parsed[key]);
                if (!isNaN(val) && val > maxVal) maxVal = val;
              }
              return maxVal;
            }
            const val = parseFloat(headerVal);
            return isNaN(val) ? 0 : val;
          } else if (typeof headerVal === "object") {
            let maxVal = 0;
            for (const key of Object.keys(headerVal)) {
              const val = parseFloat(headerVal[key]);
              if (!isNaN(val) && val > maxVal) maxVal = val;
            }
            return maxVal;
          }
        } catch (e) {}
        return 0;
      };

      const appPct = parseUsagePct(info.appUsage);
      const pagePct = parseUsagePct(info.pageUsage);
      const bizPct = parseUsagePct(info.businessUsage);
      const usageMax = Math.max(appPct, pagePct, bizPct);

      setCurrentUsageMax(usageMax);

      // Log the usage and limit types
      let limitType = "app";
      if (pagePct === usageMax) limitType = "page";
      if (bizPct === usageMax) limitType = "business";

      // Concurrency is strictly 1 to avoid rate limits, handled by the request queue

      // 6. Usage >= 85%: Stop loading next Page, show warn (unless isDeleteAction is true)
      if (usageMax >= 85 && !isDeleteAction) {
        scanCancelledRef.current = true;
        addLog("system", `Cảnh báo: Mức sử dụng API đã đạt ${usageMax.toFixed(1)}% (${limitType}). Dừng tải các Page tiếp theo.`, "skipped");
        toast.warning(`Mức sử dụng API sắp đạt giới hạn (${usageMax.toFixed(1)}%). Đã dừng tải tiếp.`, "Cảnh báo giới hạn");
      }

      // 7. Usage >= 95%: Stop all tasks, lock download/delete buttons (unless isDeleteAction is true)
      if (usageMax >= 95 && !isDeleteAction) {
        scanCancelledRef.current = true;
        deleteCancelledRef.current = true;
        requestQueue.clear();
        addLog("system", `Nguy hiểm: Mức sử dụng API đã đạt ${usageMax.toFixed(1)}% (${limitType}). Đã dừng toàn bộ tác vụ và khóa chức năng.`, "failed");
        toast.error(`Sử dụng API đạt mức nguy hiểm ${usageMax.toFixed(1)}%. Khóa mọi nút bấm.`, "Nguy hiểm giới hạn");
      }
    }

    return false; // not rate limited
  };

  // Dedicated fetch with exponential backoff & Rate Limit detection compliance (Requirement 2 & 10)
  const fetchWithBackoff = async (url: string, options: any = {}, retryCount = 0): Promise<any> => {
    try {
      const data = await safeFetchJson(url, options);

      // Check rate limit and usage from response data
      const pageName = options?.pageName || "API Request";
      const isLimited = handleRateLimitOrUsage(data, pageName);
      if (isLimited) {
        throw new Error("Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.");
      }

      if (data && data.error) {
        const customErr = new Error(data.error.message || "Meta API Error") as any;
        customErr.isMetaApiError = true;
        customErr.status = 200;
        throw customErr;
      }

      return data;
    } catch (err: any) {
      const pageName = options?.pageName || "API Request";
      const isLimited = handleRateLimitOrUsage(err, pageName);
      if (isLimited) {
        throw new Error("Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.");
      }

      const status = err.status;
      const responseJson = err.responseJson;
      const errorCode = responseJson?.errorCode || responseJson?.error?.code;

      const isNetworkError = (status === undefined || status === null || status === 0) && !err.isMetaApiError;
      const isGatewayError = (status === 502 || status === 503 || status === 504);
      const shouldRetry = (isNetworkError || isGatewayError) && 
                          (errorCode !== 4 && errorCode !== 613 && errorCode !== 190) &&
                          (status !== 429 && status !== 401 && status !== 403);

      if (!shouldRetry || retryCount >= 2) {
        throw err;
      }

      // Backoff intervals: 5s, 15s
      const backoffDelays = [5000, 15000];
      const backoffDelay = backoffDelays[retryCount] || 15000;

      addLog("system", `Có lỗi xảy ra: ${err.message}. Đang thử lại lần ${retryCount + 1}/2 sau ${backoffDelay / 1000} giây...`, "processing");
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      return fetchWithBackoff(url, options, retryCount + 1);
    }
  };

  // Custom log adder helper with access token filter (Requirement 11)
  const addLog = (postId: string, message: string, status: DeletionLog["status"]) => {
    const timeString = new Date().toLocaleTimeString("vi-VN");
    // Sanitary function to wipe credentials
    const sanitizeMessage = (msg: string): string => {
      if (!msg) return "";
      return msg.replace(/(access_token|token|user_token|userToken)=[^&/\s"']+/gi, "$1=[HIDDEN]");
    };
    const sanitizedMsg = sanitizeMessage(message);

    const newLog: DeletionLog = {
      id: Math.random().toString(36).substring(2, 9),
      postId,
      postMessageSnippet: sanitizedMsg,
      pageName: "Hệ thống",
      status,
      timestamp: timeString
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Initial load
  useEffect(() => {
    // Clean up old rate limit state from localStorage
    localStorage.removeItem("meta_rate_limit_unlock_time");
    localStorage.removeItem("meta_rate_limit_strike_count");

    const checkSetupAndFetch = async () => {
      // Check if redirect has returned with token
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      let activeToken = userToken;
      if (tokenFromUrl) {
        setUserToken(tokenFromUrl);
        activeToken = tokenFromUrl;
        localStorage.setItem("meta_user_token", tokenFromUrl);
        addLog("system", "Phát hiện mã thông báo đăng nhập Facebook mới từ OAuth.", "success");
        toast.success("Đăng nhập bằng tài khoản Facebook thành công via OAuth!", "Đăng nhập");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      addLog("system", "Khởi tạo Meta Page Manager thành công. Đang tải trang tự động...", "pending");
      
      try {
        const checkUrl = "/api/check-pages";
        const options: any = { method: "POST" };
        if (activeToken) {
          options.headers = { "Content-Type": "application/json" };
          options.body = JSON.stringify({ user_token: activeToken });
        }
        
        const checkData = await requestQueue.enqueue(
          () => safeFetchJson(checkUrl, options),
          "Kiểm tra kết nối tài khoản",
          "pages"
        );
        if (checkData.success) {
          const userName = checkData.user?.name || "Meta Account";
          addLog("system", `Kết nối Vercel API & Facebook thành công (Khoản: ${userName}).`, "success");
          toast.success(`Kết nối API thành công với tài khoản "${userName}"`, "Hệ thống");
          fetchPages(activeToken);
        } else {
          addLog("system", `Lưu ý kết nối: ${checkData.error || "Chưa cấu hình Token"}`, "skipped");
          if (activeToken) {
            if (!handleAuthError(checkData.error || "")) {
              toast.error(`Cách kết nối API thất bại: ${checkData.error || "Token không hợp lệ"}`, "Lỗi kết nối");
            }
          } else {
            toast.info("Vui lòng click vào nút Đăng nhập Facebook hoặc cấu hình Token để bắt đầu.", "Chào mừng");
          }
          fetchPages(activeToken);
        }
      } catch (err: any) {
        addLog("system", `Thông báo hệ thống: ${err.message}`, "skipped");
        if (!handleAuthError(err.message)) {
          toast.error(`Kết nối API và Facebook thất bại: ${err.message}`, "Lỗi hệ thống");
        }
        fetchPages(activeToken);
      }
    };

    checkSetupAndFetch();
  }, []);

  // Set up Message Listener for OAuth Popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "OAUTH_AUTH_SUCCESS") {
        const receivedToken = event.data.token;
        if (receivedToken) {
          setUserToken(receivedToken);
          localStorage.setItem("meta_user_token", receivedToken);
          addLog("system", "Nhận Access Token thành công từ Meta Popup Window.", "success");
          toast.success("Nhận mã Access Token thành công từ Facebook Popup!", "OAuth Thành công");
          fetchPages(receivedToken);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [appId, appSecret]);

  // Scroll to bottom of logs on change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Measure container height for virtual scrolling
  useEffect(() => {
    if (postListScrollRef.current) {
      setPostListContainerHeight(postListScrollRef.current.clientHeight);
    }
  }, [posts, activeTab, filters]);

  // Initiate OAuth window action
  const handleOAuthLogin = async () => {
    setApiError(null);
    addLog("system", "Đang khởi tạo liên kết OAuth với Facebook...", "pending");
    try {
      const urlParams = new URLSearchParams();
      if (appId) urlParams.append("app_id", appId);
      if (appSecret) urlParams.append("app_secret", appSecret);

      const data = await safeFetchJson(`/api/auth/url?${urlParams.toString()}`);

      if (data.error) {
        setApiError(data.error);
        addLog("system", `Lỗi: ${data.error}`, "failed");
        return;
      }

      // Open Popup
      const width = 600;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        "FacebookOAuthPopup",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        addLog("system", "Trình duyệt chặn cửa sổ bật lên (Popup blocked). Vui lòng cấu hình thủ công hoặc cho phép popup.", "failed");
        setApiError("Trình duyệt đã chặn popup đăng nhập. Vui lòng cấp quyền bật popup hoặc nhập User Token thủ công.");
      } else {
        addLog("system", "Đã mở cửa sổ đăng nhập Facebook OAuth. Vui lòng hoàn tất xác thực trên cửa sổ mới.", "processing");
      }
    } catch (err: any) {
      setApiError(err.message || "Không thể khởi tạo OAuth URL");
      addLog("system", `Không thể kết nối API OAuth Server: ${err.message}`, "failed");
    }
  };

  // Fetch listed Pages with cache tracking (Requirement 7)
  const fetchPages = async (tokenToUse?: string, forceRefresh = false) => {
    const activeToken = tokenToUse || userToken;

    // Check Cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedPagesStr = sessionStorage.getItem("meta_cached_pages");
      if (cachedPagesStr) {
        try {
          const cachedPages = JSON.parse(cachedPagesStr);
          if (cachedPages && cachedPages.length > 0) {
            setPages(cachedPages);
            addLog("system", `[Cache] Tải thành công ${cachedPages.length} Fanpages quản lý từ bộ nhớ đệm.`, "success");
            return;
          }
        } catch (e) {
          // parse failed, fetch fresh
        }
      }
    }

    setLoadingPages(true);
    setApiError(null);
    addLog("system", "Đang tải danh sách các Facebook Fanpages quản lý từ /api/pages...", "pending");
    
    try {
      const urlParams = new URLSearchParams();
      if (activeToken) {
        urlParams.append("user_token", activeToken);
      }
      
      // Use our global requestQueue for pages loading (Requirement 2 & 10)
      const data = await requestQueue.enqueue(
        () => fetchWithBackoff(`/api/pages?${urlParams.toString()}`),
        "Tải danh sách Fanpages",
        "pages"
      );

      if (data.error) {
        setApiError(data.error);
        addLog("system", `Lỗi API lấy trang: ${data.error}`, "failed");
        if (!handleAuthError(data.error)) {
          toast.error(`Không thể tải Fanpages: ${data.error}`, "Lỗi");
        }
        return;
      }

      if (data.data) {
        setPages(data.data);
        // Cache to sessionStorage
        sessionStorage.setItem("meta_cached_pages", JSON.stringify(data.data));
        addLog("system", `Đã tải thành công ${data.data.length} Fanpages quản lý từ Meta API và lưu vào bộ đệm.`, "success");
        toast.success(`Đã tải thành công ${data.data.length} Fanpages quản lý.`, "Tải Fanpage");
      } else {
        setPages([]);
        addLog("system", "Không tìm thấy Fanpage nào liên kết.", "skipped");
        toast.warning("Không tìm thấy Fanpage nào liên kết với tài khoản này.", "Thông báo");
      }
    } catch (err: any) {
      if (err.message?.includes("giới hạn request")) {
        return;
      }

      setApiError(err.message);
      addLog("system", `Lỗi tải danh sách Fanpage: ${err.message}`, "failed");
      if (!handleAuthError(err.message)) {
        toast.error(`Không thể tải Fanpages: ${err.message}`, "Lỗi kết nối");
      }
    } finally {
      setLoadingPages(false);
    }
  };

  // Run automatically when token changes
  useEffect(() => {
    if (userToken) {
      fetchPages();
    }
  }, [userToken]);

  // Fetch posts from SELECTED pages with concurrency and cache (Requirement 3, 7, 8, 9, 10 & 2)
  const fetchPostsFromSelectedPages = async (forceRefresh = false) => {
    if (selectedPageIds.length === 0) {
      addLog("system", "Yêu cầu hành động thất bại: Vui lòng tích chọn ít nhất 1 Fanpage bên cột Trái.", "skipped");
      toast.warning("Yêu cầu hành động thất bại: Vui lòng tích chọn ít nhất 1 Fanpage bên cột Trái.", "Chưa chọn Fanpage");
      return;
    }

    setLoadingPosts(true);
    setApiError(null);
    setSelectedPostIds([]);
    scanCancelledRef.current = false;
    addLog("system", `Bắt đầu tải các bài viết từ ${selectedPageIds.length} Fanpage đã chọn...`, "pending");
    toast.info(`Bắt đầu tải bài viết từ ${selectedPageIds.length} Fanpage...`, "Quét bài viết");

    let allFetchedPosts: FacebookPost[] = [];
    setScanProgress({ current: 0, total: selectedPageIds.length, currentPageName: "Đang khởi tạo..." });

    const pageIdQueue = [...selectedPageIds];
    const maxConcurrency = 2; // Tối đa 2 Page được quét cùng lúc (Requirement 3)
    let index = 0;

    const scanSinglePage = async (pageId: string) => {
      if (scanCancelledRef.current) return;

      const pageInfo = pages.find(p => p.id === pageId);
      if (!pageInfo) return;

      const currentIdx = index++;
      setScanProgress(p => ({ ...p, current: currentIdx, currentPageName: pageInfo.name }));

      // Check Cache first if not forcing refresh (Requirement 14)
      if (!forceRefresh) {
        const cachedPostsStr = sessionStorage.getItem(`meta_posts_cache_${pageId}`);
        const cachedTimeStr = sessionStorage.getItem(`meta_posts_cache_${pageId}_time`);
        if (cachedPostsStr && cachedTimeStr) {
          const cacheAge = Date.now() - parseInt(cachedTimeStr, 10);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
            try {
              const cachedPostsList = JSON.parse(cachedPostsStr);
              if (Array.isArray(cachedPostsList) && cachedPostsList.length > 0) {
                allFetchedPosts = [...allFetchedPosts, ...cachedPostsList];
                addLog("system", `[Cache] Tải thành công ${cachedPostsList.length} bài viết của page "${pageInfo.name}" từ bộ nhớ đệm (vẫn trong hạn 5 phút).`, "success");
                return;
              }
            } catch (e) {
              // cache invalid, fetch fresh
            }
          }
        }
      }

      // Fresh fetch (Requirement 9)
      addLog("system", `[Meta API] Đang tải trực tiếp bài viết từ Page: "${pageInfo.name}"...`, "processing");

      try {
        const urlParams = new URLSearchParams();
        urlParams.append("pageId", pageId);
        urlParams.append("limit", filters.maxPostsToFetch.toString());
        urlParams.append("contentType", filters.contentType);
        if (pageInfo.access_token) {
          urlParams.append("user_token", pageInfo.access_token);
        }

        const data = await requestQueue.enqueue(
          () => fetchWithBackoff(`/api/posts?${urlParams.toString()}`, { pageName: pageInfo.name }),
          `Tải bài viết page: ${pageInfo.name}`,
          "posts",
          pageInfo.id
        );

        if (data.error) {
          addLog("system", `Lỗi tải bài viết Page [${pageInfo.name}]: ${data.error}`, "failed");
          return;
        }

        if (data.data && data.data.length > 0) {
          const mapped: FacebookPost[] = data.data.map((item: any) => ({
            id: item.id,
            postId: item.postId,
            sourceObjectId: item.sourceObjectId,
            itemType: item.itemType || "post",
            message: item.message,
            created_time: item.created_time,
            permalink_url: item.permalink_url,
            full_picture: item.full_picture,
            status_type: item.status_type,
            attachments: item.attachments,
            pageId: pageInfo.id,
            pageName: pageInfo.name,
            pageAccessToken: pageInfo.access_token,
            likes: item.likes,
            comments: item.comments,
            shares: item.shares,
            thumbnail: item.thumbnail
          }));

          allFetchedPosts = [...allFetchedPosts, ...mapped];
          
          // Cache posts list (Requirement 14)
          sessionStorage.setItem(`meta_posts_cache_${pageId}`, JSON.stringify(mapped));
          sessionStorage.setItem(`meta_posts_cache_${pageId}_time`, Date.now().toString());
          addLog("system", `Đọc thành công ${data.data.length} bài từ "${pageInfo.name}" và lưu vào bộ nhớ đệm.`, "success");
        } else {
          addLog("system", `Fanpage "${pageInfo.name}" không có bài viết nào hoặc không thể đọc.`, "skipped");
        }
      } catch (err: any) {
        if (err.responseJson && err.responseJson.isDetailedError) {
          const detail = err.responseJson;
          const msg = `Lỗi Page "${detail.pageName}" (${detail.pageId}). Lỗi Meta API: ${detail.error}. Endpoint: ${detail.endpoint}`;
          addLog("system", msg, "failed");
          if (!handleAuthError(detail.error)) {
             toast.error(msg, "Lỗi API Facebook");
          }
        } else {
          addLog("system", `Lỗi kết nối Page [${pageInfo.name}]: ${err.message}`, "failed");
          if (!handleAuthError(err.message)) {
             toast.error(`Lỗi kết nối Page ${pageInfo.name}: ${err.message}`, "Lỗi");
          }
        }
      }
    };

    // Worker queue pattern execution
    const worker = async () => {
      while (pageIdQueue.length > 0 && !scanCancelledRef.current) {
        const pageId = pageIdQueue.shift()!;
        await scanSinglePage(pageId);
      }
    };

    const spawnCount = Math.min(maxConcurrency, pageIdQueue.length);
    const workers = Array.from({ length: spawnCount }, () => worker());
    await Promise.all(workers);

    // Sort and Deduplicate
    allFetchedPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    const uniquePostsMap = new Map<string, FacebookPost>();
    for (const p of allFetchedPosts) {
      if (!uniquePostsMap.has(p.id)) {
        uniquePostsMap.set(p.id, p);
      }
    }
    const uniquePosts = Array.from(uniquePostsMap.values());

    setPosts(uniquePosts);
    setLoadingPosts(false);
    setScanProgress(p => ({ ...p, current: selectedPageIds.length, currentPageName: "Hoàn tất!" }));

    addLog("system", `Tổng hợp xong! Tìm thấy tổng số ${uniquePosts.length} bài viết hợp lệ.`, "success");
    if (uniquePosts.length > 0) {
      toast.success(`Tổng hợp xong! Tìm thấy tổng số ${uniquePosts.length} bài viết khác nhau.`, "Đã quét xong");
    } else {
      toast.info("Không tìm thấy bài viết nào phù hợp trên các Fanpage đã chọn.", "Kết quả trống");
    }
  };

  // Auto loaded posts once pages & selection is resolved or API filters change
  useEffect(() => {
    if (selectedPageIds.length > 0 && pages.length > 0) {
      fetchPostsFromSelectedPages();
    } else {
      setPosts([]);
      setSelectedPostIds([]);
    }
  }, [selectedPageIds, filters.maxPostsToFetch, filters.contentType]);

  // Handle Page checkbox toggle
  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds(prev => 
      prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
    );
  };

  // Helper selectors - Memoized and heavily optimized for maximum speed
  const filteredPosts = useMemo((): FacebookPost[] => {
    // 1. Precompute loop invariants to avoid repeated properties access, new Date calls, and toLowerCase() calls inside the array filter loop.
    const enableKeyword = filters.enableKeyword && filters.keyword.trim().length > 0;
    const kw = enableKeyword ? filters.keyword.trim().toLowerCase() : "";

    const enableOlderThan = filters.enableOlderThan;
    const olderThanDays = filters.olderThanDays;
    const nowTime = Date.now();

    const enableDateRange = filters.enableDateRange;
    const fromTime = (enableDateRange && filters.dateFrom) ? new Date(filters.dateFrom).getTime() : null;
    const toTime = (enableDateRange && filters.dateTo) ? new Date(filters.dateTo).getTime() + 86399999 : null; // add 1 day minus 1ms

    return posts.filter(post => {
      let postTime: number | null = null;

      // 1. Check keyword
      if (enableKeyword) {
        const text = (post.message || "").toLowerCase();
        if (!text.includes(kw)) return false;
      }

      // 2. Older than X days
      if (enableOlderThan) {
        postTime = new Date(post.created_time).getTime();
        const diffTime = Math.abs(nowTime - postTime);
        const diffDays = Math.ceil(diffTime / 86400000);
        if (diffDays <= olderThanDays) return false;
      }

      // 3. Date range matching
      if (enableDateRange) {
        if (postTime === null) {
          postTime = new Date(post.created_time).getTime();
        }
        if (fromTime !== null && postTime < fromTime) return false;
        if (toTime !== null && postTime > toTime) return false;
      }

      return true;
    });
  }, [posts, filters]);
  const displayedPosts = filteredPosts.slice(0, filters.maxPostsToShow);

  // Calculate engagement metrics for currently displayed posts
  const totalLikes = displayedPosts.reduce((sum, p) => sum + (p.likes?.summary?.total_count || 0), 0);
  const totalComments = displayedPosts.reduce((sum, p) => sum + (p.comments?.summary?.total_count || 0), 0);
  const totalShares = displayedPosts.reduce((sum, p) => sum + (p.shares?.count || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;

  // Handle Toggle Selection
  const togglePostSelection = (postId: string) => {
    setSelectedPostIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  // Select/Deselect All Filtered
  const selectAllFiltered = () => {
    const displayedIds = displayedPosts.map(p => p.id);
    const allSelected = displayedIds.every(id => selectedPostIds.includes(id));

    if (allSelected) {
      // Deselect all that are displayed
      setSelectedPostIds(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      // Select all displayed that are not already selected
      setSelectedPostIds(prev => {
        const union = new Set([...prev, ...displayedIds]);
        return Array.from(union);
      });
    }
  };

  // Preset quick filter triggers
  const setPresetOlderThan = (days: number) => {
    setFilters(f => ({
      ...f,
      enableOlderThan: true,
      olderThanDays: days,
      enableDateRange: false
    }));
    addLog("system", `Đã bật bộ lọc hiển thị bài viết đăng trước đó trên ${days} ngày.`, "success");
  };

  // Batch deletion process (with individual custom delay between requests)
  const executeBatchDeletion = async () => {
    if (!doubleConfirm) {
      alert("Bạn phải tự tay tick xác nhận 'Hành động không thể hoàn tác' trước khi xóa!");
      toast.warning("Vui lòng tick chọn 'Hành động không thể hoàn tác' trước khi bắt đầu xóa.", "Xác nhận yêu cầu");
      return;
    }

    setShowConfirmModal(false);
    setIsDeleting(true);
    deleteCancelledRef.current = false;
    setProgress({ current: 0, total: selectedPostIds.length });
    
    addLog("queue", `--- PHIÊN KHỞI CHẠY TIẾN TRÌNH XÓA<sup>*</sup> HÀNG LOẠT ---`, "processing");
    addLog("queue", `Tổng số lượng bài viết đang đợi xóa: ${selectedPostIds.length}`, "pending");
    toast.info(`Bắt đầu tiến trình xóa hàng loạt ${selectedPostIds.length} bài viết...`, "Xóa bài viết");

    let countSuccess = 0;
    let countFail = 0;
    let countSkipped = 0;
    let wasCancelled = false;
    const affectedPageIds = new Set<string>();

    for (let i = 0; i < selectedPostIds.length; i++) {
      if (deleteCancelledRef.current) {
        wasCancelled = true;
        addLog("queue", `Tiến trình xóa bị dừng tại bài viết thứ ${i + 1}/${selectedPostIds.length}`, "skipped");
        break;
      }

      const postId = selectedPostIds[i];
      const post = posts.find(p => p.id === postId);

      if (!post) {
        setProgress(p => ({ ...p, current: i + 1 }));
        continue;
      }

      setCurrentlyDeletingId(postId);
      affectedPageIds.add(post.pageId);

      const snippet = post.message 
          ? (post.message.length > 50 ? `${post.message.substring(0, 50)}...` : post.message)
          : "[Bài viết hình ảnh/video không có tiêu đề]";

      addLog(postId, `[${i+1}/${selectedPostIds.length}] Đang xóa bài trên Page "${post.pageName}"...`, "processing");

      try {
        const deleteSource = videoDeleteOption === "all";
        
        const data = await requestQueue.enqueue(
          async () => {
            return await safeFetchJson("/api/delete-post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId: post.postId || post.id,
                sourceObjectId: post.sourceObjectId,
                pageId: post.pageId,
                itemType: post.itemType,
                confirm: true,
                deleteSource: deleteSource,
                userToken: post.pageAccessToken
              })
            });
          },
          `Xóa bài viết: ${post.postId || post.id} trên page ${post.pageName}`,
          "delete",
          post.pageId
        );

        // Check if rate limited, pass true for isDeleteAction
        const isLimited = handleRateLimitOrUsage(data, post.pageName, true);
        if (isLimited) {
          countFail++;
          wasCancelled = true;
          break;
        }

        if (data.success === true && data.verified === true) {
          countSuccess++;
          let logMsg = "";
          if (post.itemType === "video" || post.itemType === "reel") {
            if (deleteSource) {
              logMsg = `Đã xoá video gốc: [ID: ${postId}]: "${snippet}"`;
            } else {
              logMsg = `Chỉ xoá post wrapper: [ID: ${postId}]: "${snippet}"`;
            }
          } else {
            logMsg = `Đã xoá bài đăng: [ID: ${postId}]: "${snippet}"`;
          }
          addLog(postId, logMsg, "success");

          // Remove the successfully deleted and verified item from UI
          setPosts(prev => prev.filter(p => p.id !== postId));

          // Clear cache of Page
          sessionStorage.removeItem(`meta_posts_cache_${post.pageId}`);
          sessionStorage.removeItem(`meta_posts_cache_${post.pageId}_time`);
        } else if (data.success === true && data.verified === false) {
          countFail++;
          addLog(postId, `Xác minh xoá thất bại: Meta nhận lệnh nhưng chưa xác minh được nội dung đã bị xoá.`, "failed");
        } else {
          const errCode = data.errorCode || data.error?.code;
          const errMsg = data.error?.message || "";
          const isNotCreatedByApp = errCode === 200 || errMsg.toLowerCase().includes("this post wasn't created by the application");

          if (isNotCreatedByApp) {
            countSkipped++;
            addLog(postId, `Bài viết không do ứng dụng này tạo (Lỗi #200): [ID: ${postId}] [Page: ${post.pageName}]`, "skipped");
          } else {
            countFail++;
            let logMsg = `Thất bại khi xóa [ID: ${postId}] [Page: ${post.pageName}]: ${data.error?.message || data.error || "Lỗi Meta API"}`;
            if (errCode === "DELETE_NOT_CONFIRMED") {
              logMsg = `Meta chưa xác nhận xoá: [ID: ${postId}].`;
            } else if (errCode === "DELETE_VERIFICATION_FAILED") {
              logMsg = `Xác minh xoá thất bại: [ID: ${postId}].`;
            }
            addLog(postId, logMsg, "failed");

            if (errCode === 4 || errCode === 613) {
              wasCancelled = true;
              break;
            }
          }
        }
      } catch (err: any) {
        const errCode = err.responseJson?.errorCode || err.responseJson?.error?.code || err.errorCode || err.error?.code;
        const errMsg = (err.message || "").toLowerCase();
        const isNotCreatedByApp = errCode === 200 || errMsg.includes("this post wasn't created by the application");

        if (isNotCreatedByApp) {
          countSkipped++;
          addLog(postId, `Bài viết không do ứng dụng này tạo (Lỗi #200): [ID: ${postId}] [Page: ${post.pageName}]`, "skipped");
        } else {
          countFail++;
          addLog(postId, `Lỗi mạng khi xóa [ID: ${postId}]: ${err.message}`, "failed");
          
          const isLimited = handleRateLimitOrUsage(err, post.pageName, true);
          if (isLimited) {
            wasCancelled = true;
            break;
          }
        }
      }

      setProgress(p => ({ ...p, current: i + 1 }));

      // The requestQueue itself handles delays and rest periods between requests.
    }

    setCurrentlyDeletingId(null);
    setIsDeleting(false);
    setDeletedCountSession(prev => prev + countSuccess);
    
    if (wasCancelled) {
      addLog("queue", `Đã dừng tác vụ xoá hàng loạt! Thành công: ${countSuccess}, Thất bại: ${countFail}${countSkipped > 0 ? `, Bỏ qua: ${countSkipped}` : ""}.`, "failed");
      toast.warning(`Tiến trình xoá đã bị dừng lại. Đã xoá thành công ${countSuccess} bài.`, "Đã dừng xoá");
    } else {
      addLog("queue", `Hoàn thành tác vụ xóa hàng loạt! Thành công: ${countSuccess}, Thất bại: ${countFail}${countSkipped > 0 ? `, Bỏ qua: ${countSkipped}` : ""}.`, "success");
      
      if (countSuccess > 0 && countFail === 0) {
        if (countSkipped > 0) {
          toast.warning(`Đã xóa xong: ${countSuccess} bài thành công, ${countSkipped} bài không do app tạo (bỏ qua).`, "Xóa hoàn tất");
        } else {
          toast.success(`Đã xóa thành công toàn bộ ${countSuccess} bài viết trên các Fanpage!`, "Xóa thành công");
        }
      } else if (countSuccess > 0 && countFail > 0) {
        toast.warning(`Đã xóa xong: ${countSuccess} bài thành công, ${countFail} bài thất bại${countSkipped > 0 ? `, ${countSkipped} bài bỏ qua` : ""}.`, "Xóa hoàn tất");
      } else {
        if (countSuccess === 0 && countFail === 0 && countSkipped > 0) {
          toast.info(`Tiến trình hoàn tất. Đã bỏ qua ${countSkipped} bài viết không do ứng dụng này tạo.`, "Không có gì thay đổi");
        } else {
          toast.error(`Xóa thất bại toàn bộ ${countFail} bài viết. Vui lòng kiểm tra lại quyền Token.`, "Xóa thất bại");
        }
      }
    }
    
    // Requirement 13: Không tự động quét lại toàn bộ Page sau khi xoá.
    // Chỉ refresh các Page vừa xử lý và chỉ sau 3–5 giây.
    if (affectedPageIds.size > 0) {
      addLog("queue", "Chuẩn bị làm mới các trang bị ảnh hưởng sau 4 giây...", "pending");
      setTimeout(async () => {
        // Collect pages list
        const pagesToRefresh = Array.from(affectedPageIds);
        addLog("queue", `Bắt đầu làm mới ${pagesToRefresh.length} trang có bài bị xoá...`, "processing");
        
        let allFetchedPosts: FacebookPost[] = [];
        for (const pageId of pagesToRefresh) {
          const pageInfo = pages.find(p => p.id === pageId);
          if (!pageInfo) continue;
          
          try {
            const urlParams = new URLSearchParams();
            urlParams.append("pageId", pageId);
            urlParams.append("limit", filters.maxPostsToFetch.toString());
            urlParams.append("contentType", filters.contentType);
            if (pageInfo.access_token) {
              urlParams.append("user_token", pageInfo.access_token);
            }
            
            // Bypass cache to load fresh posts
            const data = await requestQueue.enqueue(
              () => fetchWithBackoff(`/api/posts?${urlParams.toString()}`, { pageName: pageInfo.name }),
              `Làm mới bài viết page: ${pageInfo.name}`,
              "posts",
              pageInfo.id
            );
            if (data.data) {
              const mapped: FacebookPost[] = data.data.map((item: any) => ({
                id: item.id,
                postId: item.postId,
                sourceObjectId: item.sourceObjectId,
                itemType: item.itemType || "post",
                message: item.message,
                created_time: item.created_time,
                permalink_url: item.permalink_url,
                full_picture: item.full_picture,
                status_type: item.status_type,
                attachments: item.attachments,
                pageId: pageInfo.id,
                pageName: pageInfo.name,
                pageAccessToken: pageInfo.access_token,
                likes: item.likes,
                comments: item.comments,
                shares: item.shares,
                thumbnail: item.thumbnail
              }));
              allFetchedPosts = [...allFetchedPosts, ...mapped];
              sessionStorage.setItem(`meta_posts_cache_${pageId}`, JSON.stringify(mapped));
              sessionStorage.setItem(`meta_posts_cache_${pageId}_time`, Date.now().toString());
            }
          } catch (err) {
            console.error(`Error refreshing page ${pageId}:`, err);
          }
        }
        
        // Merge remaining posts from pages that were not affected
        const unaffectedPageIds = selectedPageIds.filter(id => !affectedPageIds.has(id));
        for (const pageId of unaffectedPageIds) {
          const cachedPostsStr = sessionStorage.getItem(`meta_posts_cache_${pageId}`);
          if (cachedPostsStr) {
            try {
              const list = JSON.parse(cachedPostsStr);
              if (Array.isArray(list)) {
                allFetchedPosts = [...allFetchedPosts, ...list];
              }
            } catch (e) {}
          }
        }
        
        // Sort and Deduplicate
        allFetchedPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
        const uniquePostsMap = new Map<string, FacebookPost>();
        for (const p of allFetchedPosts) {
          if (!uniquePostsMap.has(p.id)) {
            uniquePostsMap.set(p.id, p);
          }
        }
        setPosts(Array.from(uniquePostsMap.values()));
        addLog("queue", "Đã cập nhật giao diện các trang bị ảnh hưởng xong.", "success");
      }, 4000); // 4 seconds delay (requirement: 3–5 giây)
    }

    setSelectedPostIds([]);
    setDoubleConfirm(false);
  };

  return (
    <div className={`relative h-screen min-h-screen lg:min-h-0 bg-transparent text-foreground flex flex-col select-none overflow-hidden font-sans`}>
      {/* BACKGROUND LAYER - Aurora dynamic themes & customizable image wallpapers */}
      <div className="absolute inset-0 z-[1] pointer-events-none w-full h-full overflow-hidden">
        {config?.bgType === 'image' ? (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
            style={{ 
              backgroundImage: `url(${config?.bgImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80'})`,
              filter: `blur(${config?.blurAmount !== undefined ? config.blurAmount * 0.2 : 4}px)` // elegant background layer blur depth
            }}
          />
        ) : (
          <div
            className="absolute inset-x-0 top-0 h-full w-full z-0 opacity-45 blur-[120px] transition-all duration-1000 ease-in-out"
            style={{
              background: `
                radial-gradient(circle at 10% 15%, var(--bg-gradient-1) 0%, transparent 55%),
                radial-gradient(circle at 90% 85%, var(--bg-gradient-2) 0%, transparent 55%),
                radial-gradient(circle at 50% 50%, var(--bg-gradient-3) 0%, transparent 45%)
              `,
            }}
          />
        )}
        
        {/* Transparent dark cover layer corresponding to dynamically customizable bgOverlay slider */}
        <div 
          className="absolute inset-0 z-[2] transition-colors duration-500"
          style={{ backgroundColor: `rgba(2, 6, 22, ${(config?.bgOverlay ?? 85) / 100})` }}
        />

        {/* Dot pattern matching the background */}
        <div 
          className="absolute inset-0 z-[3] opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col p-3 gap-3 md:gap-4 overflow-hidden min-h-0 flex-1">
      
        {/* HEADER / HORIZONTAL NAVIGATION */}
        <header className="relative w-full glass-card px-5 py-3.5 rounded-[24px] border border-transparent shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-30">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 bg-[#1877F2]/10 border border-[#1877F2]/25 rounded-xl flex items-center justify-center shadow-sm">
              <Facebook className="w-5 h-5 text-[#1877F2] fill-current" />
            </div>
            <div>
              <h1 className="text-[16px] font-sans font-semibold tracking-tight text-foreground">
                Meta Page
              </h1>
              {userToken ? (
                <div className="flex items-center gap-1.5 mt-0.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Đã kết nối</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOAuthLogin}
                  className="flex items-center gap-1.5 mt-0.5 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 rounded-full w-fit transition-all duration-300 pointer-events-auto cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Chưa kết nối</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            {/* Tab: Bài viết */}
            <button
               id="tab-posts"
               type="button"
               onClick={() => {
                 setActiveTab("posts");
                 addLog("system", "Chuyển sang trang: Quản lý bài viết", "success");
               }}
               className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer border ${
                 activeTab === "posts"
                   ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                   : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
               }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                activeTab === "posts"
                  ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                  : "bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              }`}>
                <FileText className="w-3 h-3 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <span className={`text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "posts" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                Bài viết
              </span>
            </button>

            {/* Tab: Tuỳ biến */}
            <button
               id="tab-theme"
               type="button"
               onClick={() => {
                 setActiveTab("theme");
                 addLog("system", "Chuyển sang trang: Tùy biến giao diện", "success");
               }}
               className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer border ${
                 activeTab === "theme"
                   ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                   : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
               }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                activeTab === "theme"
                  ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  : "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              }`}>
                <Palette className="w-3 h-3 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <span className={`text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "theme" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                Tuỳ biến
              </span>
            </button>
          </nav>

          {/* Action Buttons & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Nút cài đặt API */}
            <button 
              id="btn-settings"
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer border ${
                showConfig 
                  ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm" 
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                showConfig 
                  ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              }`}>
                <Settings className="w-3 h-3 transition-transform duration-300 group-hover:rotate-45" />
              </div>
              <span className={`text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${showConfig ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                Cài đặt API
              </span>
            </button>

            {/* Logout/Login Button */}
            <button 
              type="button"
              onClick={() => {
                if (userToken) {
                  setShowLogoutConfirm(true);
                } else {
                  handleOAuthLogin();
                }
              }}
              title={userToken ? "Đăng xuất tài khoản" : "Cấu hình liên kết OAuth"}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-bold text-[13px] cursor-pointer ${
                userToken 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 shadow-sm" 
                  : "bg-blue-500/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/30 shadow-sm"
              }`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>{userToken ? "Đăng xuất" : "Đăng nhập Facebook"}</span>
            </button>
          </div>
        </header>

        {/* RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-20 w-full">

          {/* QUEUE STATUS MONITORING BAR (Requirement 10, 11, 12) */}
          <div className="mb-3.5 flex flex-col md:flex-row items-center justify-between gap-3 bg-card/60 backdrop-blur-md border border-border rounded-2xl p-3.5 shadow-sm relative z-20 shrink-0">
            {/* Left: Queue Status Indicators */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                queueIsPaused 
                  ? "bg-rose-950/20 text-rose-400 border border-rose-500/25"
                  : queueRestTime > 0
                  ? "bg-amber-950/20 text-amber-400 border border-amber-500/25 animate-pulse"
                  : queueRunning 
                  ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/25 animate-pulse"
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground select-none">Tiến trình Meta API</span>
                  {queueIsPaused ? (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Tạm dừng</span>
                  ) : queueRestTime > 0 ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Nghỉ ({queueRestTime}s)</span>
                  ) : queueRunning ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Đang chạy</span>
                  ) : (
                    <span className="bg-muted text-muted-foreground border border-border text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Sẵn sàng</span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground truncate mt-0.5 leading-tight font-mono">
                  {queueRunning || "Hàng đợi trống - Sẵn sàng nhận lệnh"}
                </p>
              </div>
            </div>

            {/* Middle: Queue Stats Badges */}
            <div className="flex items-center gap-2 select-none w-full md:w-auto overflow-x-auto py-1 sm:py-0">
              <div className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 flex flex-col gap-0.5 text-center min-w-[70px] shadow-sm">
                <span className="text-[8.5px] uppercase font-bold text-muted-foreground tracking-wider">Hàng đợi</span>
                <span className="text-sm font-extrabold text-foreground font-mono">{queueRemaining}</span>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 flex flex-col gap-0.5 text-center min-w-[70px] shadow-sm">
                <span className="text-[8.5px] uppercase font-bold text-muted-foreground tracking-wider">Chạy tiếp</span>
                <span className="text-xs font-bold text-foreground font-mono">{queueRestTime > 0 ? `${queueRestTime}s` : "Ngay"}</span>
              </div>
              {queueIsPaused && (
                <button
                  type="button"
                  onClick={() => requestQueue.resumeQueue()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer uppercase tracking-wider select-none active:scale-95 border border-emerald-500/10"
                >
                  Tiếp tục chạy
                </button>
              )}
            </div>

            {/* Right: SAFE MODE Control Toggle */}
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto border-t md:border-t-0 border-border pt-2 md:pt-0 justify-between md:justify-end">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-tight">Chế độ an toàn</span>
                <span className="text-[9px] text-muted-foreground leading-normal mt-0.5">SAFE MODE: tránh chặn tài khoản vĩnh viễn</span>
              </div>
              <button
                type="button"
                onClick={() => setSafeMode(!safeMode)}
                className={`relative w-12 h-6.5 rounded-full transition-all duration-300 shadow-inner flex items-center p-0.5 cursor-pointer border ${
                  safeMode 
                    ? "bg-amber-600 border-amber-500/20 shadow-amber-950/30" 
                    : "bg-muted border-border"
                }`}
              >
                <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  safeMode ? "translate-x-5.5" : "translate-x-0"
                }`}>
                  <Lock className={`w-3 h-3 ${safeMode ? "text-amber-600" : "text-muted-foreground"}`} />
                </div>
              </button>
            </div>
          </div>
          
          {/* ERROR ALERT BOX */}
          {apiError && (
            <div className="mb-3 backdrop-blur-md bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-xl flex items-start gap-3 text-rose-100 shadow-md shrink-0 relative z-20">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <span className="font-semibold block text-[12px] text-rose-300">Sự cố kết nối hoặc xác thực:</span>
                <p className="mt-1 font-mono text-[10px] sm:text-[11px] opacity-80 truncate max-w-full" title={apiError}>{apiError}</p>
              </div>
            </div>
          )}

          {/* MAIN CONTAINER */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-3.5 items-stretch overflow-hidden">
        
            {/* SUB-SIDEBAR: PAGES LIST */}
            <aside className={`w-full xl:w-[260px] 2xl:w-[280px] bg-card rounded-[20px] p-4 flex flex-col shadow-sm border border-border overflow-hidden min-h-0 xl:h-full shrink-0 ${activeTab === 'posts' ? '' : 'hidden'}`}>
          <div className="flex flex-col gap-2.5 mb-4 pb-3 border-b border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono font-bold flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-accent" />
                Danh sách Pages ({pages.length})
              </span>
              {userToken && (
                <button 
                  id="btn-refresh-pages"
                  onClick={() => fetchPages()} 
                  title="Tải lại danh sách Fanpage" 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select / Deselect All Fanpages Control */}
            {userToken && pages.length > 0 && (
              <div className="flex gap-2">
                <button
                  id="btn-select-all-pages"
                  onClick={() => {
                    const pageIdsToSelect = filteredPages.map(p => p.id);
                    setSelectedPageIds(prev => {
                      const union = new Set([...prev, ...pageIdsToSelect]);
                      return Array.from(union);
                    });
                    addLog("system", `Đã chọn ${pageIdsToSelect.length} Fanpage đang hiển thị. Đang chuẩn bị tải bài viết...`, "success");
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl text-[10px] uppercase font-bold border transition-all flex items-center justify-center gap-1 ${
                    filteredPages.length > 0 && filteredPages.every(p => selectedPageIds.includes(p.id))
                      ? "btn-primary shadow-accent"
                      : "bg-[#252a37] text-slate-100 border-[#3b4354]/60 hover:bg-[#343b4e] hover:text-white"
                  }`}
                >
                  <Check className={`w-3 h-3 stroke-[3px] ${filteredPages.length > 0 && filteredPages.every(p => selectedPageIds.includes(p.id)) ? "text-white" : ""}`} />
                  <span className={filteredPages.length > 0 && filteredPages.every(p => selectedPageIds.includes(p.id)) ? "text-white" : ""}>Chọn tất cả</span>
                </button>
                <button
                  id="btn-deselect-all-pages"
                  onClick={() => {
                    if (pageSearchQuery.trim() === "") {
                      setSelectedPageIds([]);
                      addLog("system", "Đã hủy chọn toàn bộ các Fanpage.", "success");
                    } else {
                      const pageIdsToDeselect = filteredPages.map(p => p.id);
                      setSelectedPageIds(prev => prev.filter(id => !pageIdsToDeselect.includes(id)));
                      addLog("system", "Đã hủy chọn các Fanpage đang hiển thị.", "success");
                    }
                  }}
                  className="flex-1 py-2 px-2 bg-rose-700 hover:bg-rose-600 text-white border border-rose-600/20 rounded-xl text-[10px] uppercase font-bold transition-all text-center cursor-pointer shadow-md shadow-black/20"
                >
                  Bỏ chọn hết
                </button>
              </div>
            )}

            {/* Search Fanpage Input */}
            {userToken && pages.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Tìm nhanh fanpage..."
                    value={pageSearchQuery}
                    onChange={(e) => setPageSearchQuery(e.target.value)}
                    className="w-full bg-background hover:bg-background/80 border border-border hover:border-accent rounded-xl pl-8 pr-8 py-2 text-[11px] text-foreground placeholder-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  {pageSearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setPageSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Count of selected pages under the search bar */}
                <div className="flex items-center justify-between text-[11px] px-1 select-none">
                  <span className="text-muted-foreground font-medium">Đã chọn:</span>
                  <span className="bg-accent/10 text-accent font-bold px-2.5 py-0.5 rounded-full border border-accent/20 shadow-sm font-mono text-[10px]">
                    {selectedPageIds.length} / {pages.length} Fanpages
                  </span>
                </div>
              </div>
            )}
          </div>

          {!userToken ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-muted/50 rounded-2xl border border-dashed border-border">
              <Facebook className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vui lòng kết nối tài khoản Facebook để quét Fanpage quản lý.
              </p>
              <button
                id="btn-sidebar-login"
                onClick={handleOAuthLogin}
                className="mt-4 w-full py-2.5 bg-card hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Nhấn Thử Đăng nhập
              </button>
            </div>
          ) : loadingPages ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-muted-foreground mt-3">Đang kết nối Facebook...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <Info className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Không tìm thấy Account Fanpage nào trong mã thông báo này.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
              {filteredPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Không tìm thấy Fanpage nào phù hợp
                </div>
              ) : (
                filteredPages.map((page) => {
                  const isSelected = selectedPageIds.includes(page.id);
                  // Extract photo URL if possible
                  const picUrl = page.picture?.data?.url || `https://graph.facebook.com/${page.id}/picture?type=small`;
                  
                  return (
                    <div 
                      id={`page-card-${page.id}`}
                      key={page.id}
                      onClick={() => togglePageSelection(page.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-[14px] border transition-all cursor-pointer select-none group ${
                        isSelected 
                          ? "bg-muted border-accent/40 shadow-sm" 
                          : "bg-transparent border-transparent hover:bg-muted"
                      }`}
                    >
                      <img 
                        src={picUrl} 
                        alt="" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${page.id}`;
                        }}
                        className="w-9 h-9 rounded-full shadow-sm flex-shrink-0 object-cover bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground leading-tight group-hover:text-accent transition-colors">{page.name}</p>
                        <p className="text-[9.5px] text-muted-foreground truncate font-mono mt-0.5">ID: {page.id}</p>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 bg-accent rounded-lg flex items-center justify-center shadow-accent transition-all">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-border group-hover:border-accent/50 transition-colors"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {userToken && (
            <div className="mt-3 pt-3 border-t border-border/80 flex flex-col gap-1.5 shrink-0 bg-accent/5 p-2 px-2.5 rounded-xl border border-accent/10">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[10.5px]">
                <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Không thấy đủ {pages.length > 0 ? "67" : "tất cả"} Pages?</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal font-sans">
                Do Facebook yêu cầu cấp quyền cụ thể cho từng Trang. Hãy bấm <strong className="text-rose-400">Đăng xuất</strong> ở góc trên, sau đó <strong className="text-accent">Đăng nhập lại</strong>, chọn <strong className="text-white">"Chỉnh sửa cài đặt"</strong> để tích chọn toàn bộ Trang mới.
              </p>
            </div>
          )}

        </aside>

        {/* MAIN POST AREA & FILTERS */}
        <main className="flex-1 w-full flex flex-col gap-3 relative z-10 overflow-hidden min-h-0 h-full">
          
            <div className={`flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full ${activeTab === 'posts' ? '' : 'hidden'}`}>
              <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
              {/* TOP BAR: FILTERS CARD */}
              <section className="relative z-30 bg-card rounded-[18px] p-4 text-foreground shadow-sm border border-border shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-40">
                  {/* Left: Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto flex-wrap pb-1 sm:pb-0">
                    
                    {/* Filter: Date Range Selection / Dropdown */}
                    <div className="relative flex flex-1 sm:flex-none items-center gap-2 shrink-0" ref={timeDropdownRef}>
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border border-glass-border hover:border-accent/40 rounded-xl transition-all h-10 w-full shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] group">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none shrink-0 border-r border-glass-border pr-2">
                          thời gian
                        </span>
                        
                        <div 
                          className="relative h-7 pl-1.5 pr-1 flex items-center justify-between gap-2 cursor-pointer min-w-[110px] hover:text-accent transition-colors flex-1"
                          onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                        >
                          <span className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors">
                            {filters.timeRangePreset === "today" && "Hôm nay"}
                            {filters.timeRangePreset === "week" && "Tuần này"}
                            {filters.timeRangePreset === "month" && "Tháng này"}
                            {filters.timeRangePreset === "year" && "Năm nay"}
                            {filters.timeRangePreset === "all" && "Tất cả"}
                            {filters.timeRangePreset === "custom" && "Tuỳ chỉnh..."}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-accent ${showTimeDropdown ? "rotate-90 text-accent" : ""}`} />
                        </div>
                        
                        {filters.timeRangePreset === "custom" && filters.enableDateRange && (filters.dateFrom || filters.dateTo) && (
                           <div 
                             onClick={() => {
                               setTempDateFrom(filters.dateFrom);
                               setTempDateTo(filters.dateTo);
                               setShowCustomDateModal(true);
                             }}
                             className="text-[10px] text-accent font-bold bg-accent/10 hover:bg-accent/20 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-accent/20 whitespace-nowrap"
                             title="Sửa ngày tuỳ chỉnh"
                           >
                             {filters.dateFrom ? filters.dateFrom.split("-").reverse().join("/") : "..."} - {filters.dateTo ? filters.dateTo.split("-").reverse().join("/") : "..."}
                           </div>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      {showTimeDropdown && (
                        <>
                          <div className="absolute top-[115%] left-0 right-0 z-[100] bg-card/90 backdrop-blur-3xl border border-glass-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-1 min-w-[200px] ease-out animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-100 ring-1 ring-white/5">
                            {[
                              { id: "today", label: "Hôm nay" },
                              { id: "week", label: "Tuần này" },
                              { id: "month", label: "Tháng này" },
                              { id: "year", label: "Năm nay" },
                              { id: "all", label: "Từ trước đến nay" },
                              { id: "custom", label: "Tuỳ chỉnh..." }
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                className={`text-left px-3.5 py-2 rounded-lg text-xs font-semibold hover:translate-x-0.5 transition-all flex items-center justify-between cursor-pointer ${
                                  filters.timeRangePreset === preset.id 
                                    ? "bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] font-bold" 
                                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                }`}
                                onClick={() => {
                                  const val = preset.id;
                                  if (val === "custom") {
                                    setTempDateFrom(filters.dateFrom);
                                    setTempDateTo(filters.dateTo);
                                    setShowCustomDateModal(true);
                                  } else {
                                    const today = new Date();
                                    let dFrom = "";
                                    let dTo = "";
                                    if (val === "today") {
                                      dFrom = today.toISOString().split('T')[0];
                                      dTo = dFrom;
                                    } else if (val === "week") {
                                      const day = today.getDay();
                                      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                                      const monday = new Date(today.setDate(diff));
                                      dFrom = monday.toISOString().split('T')[0];
                                      dTo = new Date().toISOString().split('T')[0];
                                    } else if (val === "month") {
                                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                      dFrom = startOfMonth.toISOString().split('T')[0];
                                      dTo = new Date().toISOString().split('T')[0];
                                    } else if (val === "year") {
                                      const startOfYear = new Date(today.getFullYear(), 0, 1);
                                      dFrom = startOfYear.toISOString().split('T')[0];
                                      dTo = new Date().toISOString().split('T')[0];
                                    }
                                    
                                    setFilters(f => ({ 
                                      ...f, 
                                      timeRangePreset: val as any,
                                      dateFrom: dFrom,
                                      dateTo: dTo,
                                      enableDateRange: val !== "all"
                                    }));
                                    addLog("system", `Đã đổi bộ lọc thời gian thành: ${preset.label}`, "success");
                                  }
                                  setShowTimeDropdown(false);
                                }}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Filter: Max Limits config */}
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border border-glass-border hover:border-accent/40 rounded-xl transition-all h-10 shrink-0 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] group text-foreground">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none shrink-0 border-r border-glass-border pr-2">
                        tải
                      </span>
                      <div className="flex items-center gap-1">
                        <CustomSelect
                          value={filters.maxPostsToFetch}
                          onChange={(val) => setFilters(f => ({ ...f, maxPostsToFetch: val }))}
                          options={[
                            { value: 50, label: "50" },
                            { value: 100, label: "100" },
                            { value: 150, label: "150 (Tải thêm)" },
                            { value: 200, label: "200 (Tải thêm)" },
                            { value: 300, label: "300 (Tối đa)" }
                          ]}
                        />
                      </div>
                    </div>

                    {/* Filter: Content Type selection */}
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border border-glass-border hover:border-accent/40 rounded-xl transition-all h-10 shrink-0 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] group text-foreground">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none shrink-0 border-r border-glass-border pr-2">
                        Loại bài
                      </span>
                      <div className="flex items-center gap-1">
                        <CustomSelectStr
                          value={filters.contentType}
                          onChange={(val: any) => {
                            setFilters(f => ({ ...f, contentType: val }));
                            addLog("system", `Đã đổi bộ lọc loại nội dung thành: ${val === "all" ? "Tất cả" : val === "post" ? "Bài viết thường" : "Video/Reel"}`, "success");
                          }}
                          options={[
                            { value: "all", label: "Tất cả" },
                            { value: "post", label: "Bài viết thường" },
                            { value: "video", label: "Video/Reel" }
                          ]}
                        />
                      </div>
                    </div>

                    {/* Filter: Search Posts Keyword */}
                    <div className="relative flex flex-1 sm:flex-none items-center gap-2 shrink-0">
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border border-glass-border hover:border-accent/40 rounded-xl transition-all h-10 w-full sm:w-60 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] group">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none shrink-0 border-r border-glass-border pr-2">
                          Tìm bài
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm nhanh bài viết..."
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          className="bg-transparent text-xs text-foreground focus:outline-none w-full font-semibold border-none outline-none focus:ring-0 placeholder:text-muted-foreground/40"
                        />
                        {keywordInput && (
                          <button
                            type="button"
                            onClick={() => setKeywordInput("")}
                            className="p-0.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right: Stats Badges */}
                  <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-xl border border-border select-none font-medium text-foreground shadow-sm shrink-0 overflow-x-auto custom-scrollbar h-10">
                    {/* Stat 1: Selection */}
                    <div className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">Chọn:</span>
                      <span className="font-mono font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">{selectedPostIds.length}</span>
                      <span className="text-muted-foreground font-mono">/ {displayedPosts.length}</span>
                    </div>

                    <span className="w-px h-3.5 bg-border mx-1" />

                    {/* Stat 2: Total dynamic matches */}
                    <div className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">Lọc:</span>
                      <span className="font-mono font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">{filteredPosts.length}</span>
                    </div>

                    <span className="w-px h-3.5 bg-border mx-1" />

                    {/* Stat 3: Total cached posts in session */}
                    <div className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">Nạp:</span>
                      <span className="font-mono font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">{posts.length}</span>
                    </div>

                    <span className="w-px h-3.5 bg-border mx-1" />

                    {/* Stat 4: Deleted Count */}
                    <div className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">Xóa:</span>
                      <span className="font-mono font-black text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded leading-none">{deletedCountSession}</span>
                    </div>
                  </div>
                </div>

              </section>

          {/* POSTS SCREEN CONTAINER */}
          <section className="relative z-10 flex-1 bg-card border border-border rounded-[20px] overflow-hidden flex flex-col shadow-sm min-h-0">
            {/* Table/List Header */}
            <div className="px-4 py-3 border-b border-border bg-card flex justify-between items-center shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-accent" />
                  Danh sách bài viết từ các Page đã chọn
                </span>
              </div>
              
              {posts.length > 0 && (
                <div 
                  id="btn-toggle-select-all"
                  onClick={selectAllFiltered}
                  className="flex items-center gap-2 text-xs text-foreground hover:text-accent bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-xl border border-border cursor-pointer select-none transition-all font-medium"
                >
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id))
                        ? "bg-accent border-accent text-white shadow-sm" 
                        : "border-border hover:border-accent/40 bg-card"
                    }`}
                  >
                    {displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id)) && (
                      <Check className="w-2.5 h-2.5 stroke-[3px]" />
                    )}
                  </div>
                  <span>Chọn toàn bộ hiển thị ({displayedPosts.length})</span>
                </div>
              )}
            </div>

            {/* List Body */}
            <div 
              ref={postListScrollRef}
              onScroll={(e) => {
                const target = e.currentTarget;
                setPostListScrollTop(target.scrollTop);
                if (target.clientHeight !== postListContainerHeight) {
                  setPostListContainerHeight(target.clientHeight);
                }
              }}
              className="p-3 overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar bg-background/10 backdrop-blur-[24px] border border-border rounded-b-[24px] shadow-sm"
            >
              {loadingPosts ? (
                <div className="flex flex-col justify-center items-center gap-4 text-foreground h-full min-h-[300px] py-6 max-w-md mx-auto">
                  {/* Circular Spinner & Big Icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                    <Facebook className="w-6 h-6 text-accent absolute fill-current animate-pulse" />
                  </div>

                  {/* Progress Info Header */}
                  <div className="text-center space-y-0.5 mt-2">
                    <h3 className="font-bold text-xs tracking-wider text-muted-foreground uppercase opacity-80">Đang quét Fanpage hàng loạt</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                      Tiến trình: <span className="text-accent font-mono font-bold text-xs">{scanProgress.current}/{scanProgress.total}</span> Page hoàn thành
                    </p>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full pretty-progress-track h-4 overflow-hidden shadow-inner">
                    <div 
                      className="pretty-progress-bar"
                      style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Current Active Page Name & Detail badge */}
                  <div className="flex flex-col items-center gap-1.5 w-full animate-pulse mt-2">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Đang kiểm tra & tải bài viết:</span>
                    <div className="bg-accent/10 border border-accent/20 rounded-[10px] px-3 py-1 text-[11px] text-accent font-bold max-w-full truncate shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping shrink-0" />
                      {scanProgress.currentPageName || "Đang khởi tạo..."}
                    </div>
                  </div>

                  {/* Stop Scanning Button */}
                  <button
                    type="button"
                    onClick={() => {
                      scanCancelledRef.current = true;
                      addLog("system", "Đang gửi yêu cầu dừng quét...", "pending");
                    }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[10px] font-bold transition-all shadow-sm cursor-pointer select-none"
                  >
                    <XOctagon className="w-3.5 h-3.5 shrink-0" />
                    Dừng quét ngay
                  </button>

                  {/* Secondary info label */}
                  <p className="text-[10px] text-muted-foreground/80 text-center leading-relaxed mt-4 max-w-[80%]">
                    Hệ thống đang thu thập dữ liệu bài viết (lượt thích, bình luận, chia sẻ) từ API chính thức của Meta.
                  </p>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-3 h-full min-h-[300px] py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                    <Facebook className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] text-foreground">Chưa có bài viết nào</h3>
                    <p className="text-[11px] text-muted-foreground mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                      Để hiển thị bài đăng, vui lòng tích chọn các Fanpage. Hệ thống sẽ tự động tải tối đa <br/><span className="font-mono text-accent font-bold">{filters.maxPostsToFetch}</span> bài viết gốc.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-1.5">
                  {(() => {
                    const ROW_HEIGHT = 70; // safe row budget in px
                    const buffer = 10; // safety viewport buffer
                    const headerOffset = 36; // Table Header height + padding offset

                    const adjustedScrollTop = Math.max(0, postListScrollTop - headerOffset);
                    const startIndex = Math.max(0, Math.floor(adjustedScrollTop / ROW_HEIGHT) - buffer);
                    const endIndex = Math.min(displayedPosts.length, Math.ceil((adjustedScrollTop + postListContainerHeight) / ROW_HEIGHT) + buffer);

                    const visiblePosts = displayedPosts.slice(startIndex, endIndex);
                    const totalHeight = displayedPosts.length * ROW_HEIGHT;
                    const offsetY = startIndex * ROW_HEIGHT;

                    return (
                      <div 
                        className="relative w-full overflow-hidden" 
                        style={{ height: `${totalHeight}px` }}
                      >
                        <div 
                          className="absolute top-0 left-0 right-0"
                          style={{ 
                            transform: `translateY(${offsetY}px)`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px" // replaces space-y-1.5
                          }}
                        >
                          {visiblePosts.map((post) => {
                            const isChecked = selectedPostIds.includes(post.id);
                            const formattedDate = new Date(post.created_time).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            });

                            // Calculate how old in days
                            const diffTime = Math.abs(new Date().getTime() - new Date(post.created_time).getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            return (
                              <div 
                                id={`post-row-${post.id}`}
                                key={post.id}
                                onClick={() => currentlyDeletingId !== post.id && togglePostSelection(post.id)}
                                style={{ height: `${ROW_HEIGHT - 6}px` }}
                                className={`group grid grid-cols-[30px_44px_1fr_135px_50px] gap-2 items-center px-2 py-1.5 rounded-[16px] transition-all duration-200 border ${
                                  currentlyDeletingId === post.id
                                    ? "bg-rose-500/10 border-rose-500/40 shadow-[0_4px_12px_rgba(239,68,68,0.15)] animate-pulse cursor-wait"
                                    : isChecked 
                                      ? "bg-accent/15 border-accent/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md cursor-pointer" 
                                      : "bg-background/20 backdrop-blur-md border-border/30 dark:border-slate-800/40 hover:bg-white/5 dark:hover:bg-white/5 hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] cursor-pointer"
                                }`}
                              >
                                {/* Checkbox / Loading Spinner */}
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                  {currentlyDeletingId === post.id ? (
                                    <Loader2 className="w-4 h-4 text-rose-500 animate-spin stroke-[2.5]" />
                                  ) : (
                                    <div 
                                      onClick={() => togglePostSelection(post.id)}
                                      className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                                        isChecked 
                                          ? "bg-accent text-white shadow-sm" 
                                          : "border-2 border-border group-hover:border-accent/40"
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                                    </div>
                                  )}
                                </div>

                                {/* Thumbnail Column */}
                                <div className="relative shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                                  {post.full_picture ? (
                                    <div className="relative rounded overflow-hidden border border-border w-[38px] h-[38px] bg-muted shadow-sm">
                                      <img 
                                        src={post.full_picture} 
                                        alt="Preview" 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover rounded group-hover:brightness-110 transition-all duration-300"
                                      />
                                      {/* Video Play icon attachment overlay */}
                                      {post.status_type === "added_video" && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                          <Play className="w-3.5 h-3.5 fill-current text-white drop-shadow-sm animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="rounded border border-border bg-muted w-[38px] h-[38px] flex items-center justify-center text-muted-foreground/30 shadow-sm">
                                      <Facebook className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                {/* Content Column */}
                                <div className="flex flex-col gap-1 min-w-0 pr-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-accent/10 text-accent text-[8px] px-1.5 py-0.5 rounded leading-none font-bold border border-accent/20 truncate max-w-[120px] shadow-sm" title={post.pageName}>
                                      {post.pageName}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground/60 font-mono select-all">
                                      ID: {post.id}
                                    </span>
                                    {currentlyDeletingId === post.id && (
                                      <span className="bg-rose-500/15 text-rose-500 text-[8px] px-2 py-0.5 rounded flex items-center gap-1.5 font-extrabold uppercase tracking-widest border border-rose-500/25 shadow-sm shadow-rose-500/5 select-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                                        ĐANG XÓA...
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className={`text-[11px] font-medium leading-tight line-clamp-2 break-all ${currentlyDeletingId === post.id ? "text-rose-200/95" : "text-foreground"}`} title={post.message || ""}>
                                    {post.message ? (
                                      post.message
                                    ) : (
                                      <span className="italic text-muted-foreground/60 font-normal">[Đa phương tiện - Không có văn bản]</span>
                                    )}
                                  </p>
                                </div>

                                {/* Time */}
                                <div className={`text-center flex flex-col gap-0.5 shrink-0 select-none ${currentlyDeletingId === post.id ? "opacity-60" : ""}`}>
                                  <span className="text-[10px] font-mono font-medium text-foreground/80">{formattedDate}</span>
                                  <span className="text-[9px] text-muted-foreground/70 font-mono">({diffDays} ngày trước)</span>
                                </div>

                                {/* Action Button Link to Facebook */}
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                  {currentlyDeletingId === post.id ? (
                                    <span className="text-rose-500 text-[10px] uppercase font-mono animate-pulse">Wait</span>
                                  ) : post.permalink_url ? (
                                    <a 
                                      href={post.permalink_url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex items-center justify-center p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/15 transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground/40 text-[10px] italic">-</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </section>
          </div>

          {/* RIGHT SIDEBAR: PROGRESS AND LOGS */}
          <aside className="w-full xl:w-[260px] 2xl:w-[300px] bg-card rounded-[18px] p-4 shrink-0 flex flex-col gap-4 shadow-sm border border-border h-[auto] xl:h-full overflow-y-auto">
            {/* PROGRESS BAR PANEL */}
            <div className="flex flex-col gap-3 min-h-0 shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>{loadingPosts ? "Tải bài viết" : "Xoá bài viết"}</span>
                  <span className="font-mono text-accent text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded shadow-sm">
                    {loadingPosts 
                      ? (scanProgress.total > 0 ? `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` : "0%")
                      : (progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%")
                    }
                  </span>
                </div>
                
                <div className="w-full pretty-progress-track h-4 overflow-hidden shadow-inner">
                  <div 
                    className="pretty-progress-bar"
                    style={{ width: `${loadingPosts 
                      ? (scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0)
                      : (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {loadingPosts ? (
                      <><span className="text-accent font-black">{scanProgress.current}</span> / <span>{scanProgress.total}</span> trang</>
                    ) : (
                      <><span className="text-accent font-black">{progress.current}</span> / <span>{progress.total}</span> bài</>
                    )}
                  </span>
                </div>
                
                <div className="flex gap-2 w-full mt-2">
                  <button
                    id="btn-load-posts"
                    type="button"
                    onClick={() => fetchPostsFromSelectedPages(true)}
                    disabled={selectedPageIds.length === 0 || loadingPosts}
                    className="flex-1 py-2 btn-primary rounded-full font-bold text-[9px] xl:text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer select-none active:scale-95 shadow"
                  >
                    <RotateCw className={`w-3.5 h-3.5 shrink-0 ${loadingPosts ? "animate-spin" : ""}`} />
                    Tải bài viết
                  </button>

                  <button 
                    id="btn-delete-trigger"
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedPostIds.length === 0 || isDeleting}
                    className={`flex-1 py-2.5 rounded-full font-bold text-[9px] xl:text-[10px] tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 select-none active:scale-95 border ${
                      selectedPostIds.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent cursor-pointer shadow-md shadow-rose-950/25' 
                        : 'bg-muted/40 text-muted-foreground/40 border-transparent opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    {selectedPostIds.length > 0 ? `Xóa bài viết (${selectedPostIds.length})` : "Xóa bài viết"}
                  </button>
                </div>

                {(isDeleting || loadingPosts) && (
                  <div className="flex gap-2 w-full mt-1.5">
                    {isDeleting && (
                      <button
                        id="btn-stop-deletion"
                        type="button"
                        onClick={() => {
                          deleteCancelledRef.current = true;
                          addLog("queue", "Yêu cầu dừng tiến trình xóa bài viết...", "pending");
                        }}
                        className="w-full py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600/50 text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer shadow-sm"
                      >
                        Dừng xóa
                      </button>
                    )}
                    {loadingPosts && (
                      <button
                        type="button"
                        onClick={() => {
                          scanCancelledRef.current = true;
                          addLog("system", "Đang gửi yêu cầu dừng quét trang...", "pending");
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600/50 text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer shadow-sm"
                      >
                        Dừng nạp
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-rose-950/10 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[10px] font-medium leading-relaxed">
                  <span className="font-bold text-rose-500 uppercase block mb-0.5">Lưu ý:</span>
                  Xóa bài viết là VĨNH VIỄN.
                </div>
              </div>
            </div>

            {/* LIVE LOG CONSOLE TERMINAL */}
            <div className="flex-1 flex flex-col bg-muted/30 rounded-xl p-3 shadow-inner min-h-[150px] overflow-hidden border border-border">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2 shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-accent font-extrabold font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                  Terminal Logs
                </span>
                <button 
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] hover:underline text-muted-foreground hover:text-foreground font-bold"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Log Tabs */}
              <div className="flex gap-1 border-b border-border/40 pb-2 mb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLogTab("all")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-all flex items-center gap-1 shrink-0 ${
                    activeLogTab === "all"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-300 dark:border-slate-750"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  Tất cả
                  <span className="bg-slate-300/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-[9px] font-semibold min-w-[14px] text-center">
                    {logs.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogTab("success")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-all flex items-center gap-1 shrink-0 ${
                    activeLogTab === "success"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/30"
                      : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 border border-transparent"
                  }`}
                >
                  Thành công
                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px] font-semibold min-w-[14px] text-center">
                    {logs.filter(log => log.status === "success").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogTab("error")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-all flex items-center gap-1 shrink-0 ${
                    activeLogTab === "error"
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-500/30"
                      : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 border border-transparent"
                  }`}
                >
                  Lỗi
                  <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-semibold min-w-[14px] text-center">
                    {logs.filter(log => log.status === "failed" || log.status === "skipped").length}
                  </span>
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-accent p-1 custom-scrollbar pr-1.5"
              >
                {(() => {
                  const filtered = logs.filter((log) => {
                    if (activeLogTab === "error") return log.status === "failed" || log.status === "skipped";
                    if (activeLogTab === "success") return log.status === "success";
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-muted-foreground/50 italic py-1">
                        {activeLogTab === "error" 
                          ? "Không có nhật ký lỗi..." 
                          : activeLogTab === "success" 
                          ? "Không có nhật ký thành công..." 
                          : "Chưa có nhật ký..."}
                      </p>
                    );
                  }

                  return filtered.map((log) => {
                    let colorClass = "text-muted-foreground";
                    let prefix = "•";

                    if (log.status === "success") {
                      colorClass = "text-emerald-600 font-semibold";
                      prefix = "✔";
                    } else if (log.status === "failed") {
                       colorClass = "text-rose-600 font-bold";
                       prefix = "✘ LỖI";
                    } else if (log.status === "skipped") {
                       colorClass = "text-amber-500 font-medium";
                       prefix = "⚠ BỎ QUA";
                    } else if (log.status === "processing") {
                       colorClass = "text-amber-500 font-medium animate-pulse";
                       prefix = "➜";
                    } else if (log.status === "pending") {
                       colorClass = "text-blue-500 font-medium";
                       prefix = "⏱";
                    }

                    return (
                      <div key={log.id} className={`${colorClass} flex gap-1.5 leading-relaxed break-words`}>
                        <span className="shrink-0 text-muted-foreground">[{log.timestamp.split(" ")[1]}]</span>
                        <span className="shrink-0 font-bold">{prefix}</span>
                        <span>{log.postMessageSnippet}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </aside>
          </div>

            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 w-full h-full ${activeTab === 'theme' ? '' : 'hidden'}`}>
              <ThemeSettingsTab config={config} setConfig={setConfig} isDark={isDark} setIsDark={setIsDark} />
            </div>

        </main>
      </div>
      </div>

      {/* CUSTOM DATE MODAL */}
      {showCustomDateModal && (
        <DateRangePickerModal 
          initialFrom={tempDateFrom || filters.dateFrom}
          initialTo={tempDateTo || filters.dateTo}
          onClose={() => {
            setShowCustomDateModal(false);
          }}
          onApply={(from, to) => {
            setFilters(f => ({
              ...f,
              timeRangePreset: "custom",
              dateFrom: from,
              dateTo: to,
              enableDateRange: true
            }));
            setShowCustomDateModal(false);
            if (from || to) {
              addLog("system", `Đã đổi khung thời gian tuỳ chỉnh: ${from || "..."} đến ${to || "..."}`, "success");
            }
          }}
        />
      )}

      {/* MODAL 1: APP SETTINGS PANEL MODAL (Interactive Configuration override) */}
      {showConfig && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-[500px] border border-border">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-accent" />
                Cài đặt Meta API & Credentials
              </h2>
              <button 
                id="btn-close-settings"
                onClick={() => setShowConfig(false)}
                className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6 p-4 bg-muted/50 border border-border rounded-2xl shadow-sm">
              Hệ thống sử dụng Meta Graph API để phân tích. Bạn có thể tự mình cấu hình Meta App ID / Secret do bạn tạo để dùng riêng tư hoặc điền trực tiếp User Access Token.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Mốt tự bảo mật: Meta App ID</label>
                <input 
                  type="text" 
                  id="config-app-id"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Điền Meta App ID (ví dụ: 89431872124...)"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none shadow-sm transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Meta App Secret</label>
                <input 
                  type="password" 
                  id="config-app-secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Điền Meta App Secret"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none shadow-sm transition-all text-foreground"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-accent mb-1.5 uppercase tracking-wide">
                  Nhập trực tiếp Facebook User Token (GHI ĐÈ)
                </label>
                <textarea 
                  id="config-user-token"
                  rows={3}
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value)}
                  placeholder="Mã Access Token EAAB... (Lấy nhanh từ Trình rà lỗi Meta Graph API Explorer)"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none shadow-sm transition-all resize-none custom-scrollbar text-foreground"
                />
                <span className="text-[11px] text-muted-foreground font-medium block mt-2">
                  Cách này giúp bạn chạy trực tiếp hệ thống mà không qua cổng server trung gian.
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-border">
              <button 
                id="btn-save-settings"
                onClick={saveCredentials}
                className="flex-1 py-3 btn-primary rounded-xl font-bold text-[13px] tracking-wide transition-all shadow-md"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (Surgical Confirmation Overlays) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 md:p-8 rounded-[40px] shadow-2xl w-full max-w-[480px] text-center">
            <div className="w-16 h-16 bg-rose-950/20 border border-rose-500/25 text-rose-400 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-inner transform -rotate-6">
              <Trash2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">
              Xác nhận hủy hoại vĩnh viễn?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              Bạn đang chuẩn bị tiến hành xóa hàng loạt <b className="text-rose-400 font-mono text-sm bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-500/15">{selectedPostIds.length} bài đăng</b> khỏi các Fanpage. Hành động này sẽ triệt tiêu vĩnh viễn toàn bộ lượt Thích, Bình luận, và Chia sẻ đi kèm.
            </p>

            {hasVideoSelected && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-[20px] text-left mb-6 shadow-sm">
                <span className="block text-[12px] font-bold text-amber-500 mb-2 uppercase tracking-wider">
                  Tùy chọn xóa Video / Reel
                </span>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Một số nội dung được chọn là Video/Reel. Việc xóa bài viết trên Timeline không tự động xóa file video gốc trong thư viện của Fanpage. Vui lòng chọn cách xử lý:
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground select-none">
                    <input
                      type="radio"
                      name="video-delete-option"
                      checked={videoDeleteOption === "post_only"}
                      onChange={() => setVideoDeleteOption("post_only")}
                      className="accent-amber-500"
                    />
                    <span>Chỉ xóa bài đăng trên timeline (Giữ lại video gốc)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground select-none">
                    <input
                      type="radio"
                      name="video-delete-option"
                      checked={videoDeleteOption === "all"}
                      onChange={() => setVideoDeleteOption("all")}
                      className="accent-amber-500"
                    />
                    <span>Xóa cả bài đăng timeline và video gốc khỏi thư viện Page</span>
                  </label>
                </div>
              </div>
            )}

            {/* Checkbox safety safeguard constraint (confirm=true requirement) */}
            <div className="bg-rose-950/10 border border-rose-500/20 p-4 rounded-[20px] text-left mb-6 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div 
                  onClick={() => setDoubleConfirm(!doubleConfirm)}
                  className={`mt-0.5 w-5 h-5 rounded-[6px] flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                    doubleConfirm 
                      ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-950/45" 
                      : "border-border hover:border-rose-550 bg-background"
                  }`}
                >
                  {doubleConfirm && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                </div>
                <input 
                  type="checkbox" 
                  id="chk-double-confirm"
                  checked={doubleConfirm}
                  onChange={(e) => setDoubleConfirm(e.target.checked)}
                  className="sr-only"
                />
                <div className="text-[12px] text-rose-400 leading-relaxed font-semibold">
                  <span>Tôi hiểu đây là quyết định một chiều, không thể khôi phục và đồng ý xóa các bài viết đã chọn.</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button 
                id="btn-cancel-delete"
                onClick={() => {
                  setShowConfirmModal(false);
                  setDoubleConfirm(false);
                }}
                className="flex-1 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-full font-bold text-[13px] transition-all border border-border shadow-sm cursor-pointer"
              >
                Hủy bỏ
              </button>
              
              <button 
                id="btn-confirm-delete"
                onClick={executeBatchDeletion}
                disabled={!doubleConfirm}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-rose-950/15"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 md:p-8 rounded-[40px] shadow-2xl w-full max-w-[440px] text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-inner transform rotate-3">
              <LogOut className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">
              Xác nhận Đăng xuất?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              Bạn có muốn đăng xuất và xóa toàn bộ thông tin tài khoản Facebook đang lưu trữ trên trình duyệt này?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-full font-bold text-[13px] transition-all border border-border shadow-sm cursor-pointer"
              >
                Hủy bỏ
              </button>
              
              <button 
                onClick={() => {
                  clearCredentials();
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-[13px] transition-all cursor-pointer shadow-md shadow-rose-950/15"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
