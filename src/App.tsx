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
  ChevronDown,
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
  Palette,
  KeyRound
} from "lucide-react";
import { FacebookPage, FacebookPost, FilterCriteria, DeletionLog } from "./types";
import { safeFetchJson } from "./utils/safeFetchJson";
import { useToast } from "./components/Toast";
import Tooltip from "./components/Tooltip";
import PageStatusTab from "./components/PageStatusTab";
import PageAdminsTab from "./components/PageAdminsTab";
import ThemeSettingsTab from "./components/ThemeSettingsTab";
import { useThemeConfig } from "./hooks/useThemeConfig";
import DateRangePickerModal from "./components/DateRangePickerModal";
import { CustomDropdown } from "./components/ui/CustomDropdown";

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
        className={`relative flex items-center justify-between w-full h-9 bg-background border border-border focus:border-accent rounded-xl px-3 text-xs text-left cursor-pointer font-bold select-none transition-all shadow-sm ${disabled ? 'bg-slate-700/45 text-slate-400 border-white/5 cursor-not-allowed' : 'text-foreground hover:glass'}`}
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

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 bg-transparent hover:text-accent focus:text-accent h-7 px-1 text-[11px] outline-none text-white font-bold cursor-pointer transition-all select-none min-w-fit"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1.5 z-[999] min-w-full w-max max-w-[260px] max-h-[280px] overflow-y-auto overscroll-contain bg-slate-800/95 backdrop-blur-3xl border border-slate-700/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1 ease-out animate-in fade-in slide-in-from-top-1 zoom-in-[0.98] duration-150 ring-1 ring-white/5"
          role="listbox"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                value === opt.value
                  ? "bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)]"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [appSecret, setAppSecret] = useState<string>("");
  const [userToken, setUserToken] = useState<string>("");
  const [showReconnectModal, setShowReconnectModal] = useState<boolean>(false);

  // Pages & Posts state
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pageSearchQuery, setPageSearchQuery] = useState<string>("");
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  
  // Statuses
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentlyDeletingId, setCurrentlyDeletingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Meta API rate limiting and Polling states
  const [isMetaRateLimited, setIsMetaRateLimited] = useState<boolean>(false);
  const [rateLimitUnlockTime, setRateLimitUnlockTime] = useState<number | null>(null);
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
    maxPostsToFetch: 500,
    maxPostsToShow: 500,
    timeRangePreset: "all",
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
        if (f.keyword === keywordInput) return f;
        return { ...f, keyword: keywordInput };
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

  // Active Tab state for Page Status and Admin/Business views integration
  const [activeTab, setActiveTab] = useState<"posts" | "status" | "admins" | "theme">("posts");
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
    addLog("system", "Đã lưu cài đặt Meta App ID vào thiết bị.", "success");
    toast.success("Cài đặt Meta App ID đã được lưu cục bộ an toàn.", "Lưu cài đặt");
    setShowConfig(false);
  };

  // Reset Credentials
  const clearCredentials = async () => {
    if (confirm("Bạn có muốn đăng xuất và xóa toàn bộ thông tin tài khoản đang lưu?")) {
      try {
        await safeFetchJson("/api/auth/logout");
      } catch (e) {
        console.warn("Failed sending logout request to backend:", e);
      }
      localStorage.removeItem("meta_app_id");
      localStorage.removeItem("meta_app_secret");
      localStorage.removeItem("meta_user_token");
      localStorage.removeItem("facebook_access_token");
      sessionStorage.removeItem("meta_cached_pages");
      setAppId("");
      setAppSecret("");
      setUserToken("");
      setPages([]);
      setPosts([]);
      setSelectedPageIds([]);
      setSelectedPostIds([]);
      setLogs([]);
      addLog("system", "Đã xóa sạch bộ nhớ tài khoản Facebook và phiên cookie.", "success");
      toast.info("Đã đăng xuất và xóa sạch cấu hình khỏi trình duyệt của bạn.", "Đăng xuất thành công");
    }
  };

  const handleAuthError = (errMsg: string) => {
    const msg = typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg);
    if (
      msg.includes("Session has expired") || 
      msg.includes("Error validating access token") || 
      msg.includes("OAuthException") ||
      msg.includes("UNAUTHORIZED") ||
      msg.includes("TOKEN_EXPIRED") ||
      msg.includes("hết hạn") ||
      msg.includes("hủy bỏ")
    ) {
      scanCancelledRef.current = true;
      deleteCancelledRef.current = true;
      setLoadingPosts(false);
      setIsDeleting(false);
      setUserToken("");
      setPages([]);
      setPosts([]);
      setSelectedPageIds([]);
      setSelectedPostIds([]);
      setShowReconnectModal(true);
      addLog("system", "Phát hiện phiên Facebook đã hết hạn hoặc chưa đăng nhập.", "failed");
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

  // Poll /api/jobs/active dynamically matching user's specific constraints (Requirement 6)
  useEffect(() => {
    if (jobsErrorCount >= 3) return;

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
          if (nextVal >= 3) {
            addLog("system", `Đã dừng kiểm tra trạng thái tiến trình nền do API báo lỗi 3 lần liên tiếp: ${err.message}`, "failed");
          }
          return nextVal;
        });
      }
    };

    // Determine poll interval dynamically based on requirements
    let currentInterval = 25000; // default 20-30s when no jobs are running

    if (!isTabVisible) {
      currentInterval = 60000; // max 60s when tab is hidden
    } else if (hasRunningJobs) {
      currentInterval = 2000; // 2s when job is running
    }

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

  // Meta Rate Limit Count down timer (Requirement 1)
  useEffect(() => {
    if (!rateLimitUnlockTime) return;
    const interval = setInterval(() => {
      if (Date.now() >= rateLimitUnlockTime) {
        setIsMetaRateLimited(false);
        setRateLimitUnlockTime(null);
        addLog("system", "Hết thời gian tạm khoá 10 phút. Bạn có thể tiếp tục thực hiện quét bài viết.", "success");
        toast.success("Hệ thống đã tự động mở khóa giới hạn Meta API. Bạn có thể quét tiếp.", "Đã mở khóa");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitUnlockTime]);

  const triggerMetaRateLimit = () => {
    setIsMetaRateLimited(true);
    setRateLimitUnlockTime(Date.now() + 10 * 60 * 1000); // 10 minutes
    addLog("system", "ỨNG DỤNG ĐÃ CHẠM GIỚI HẠN REQUEST CỦA META. TẠM KHÓA TOÀN BỘ YÊU CẦU TRONG 10 PHÚT.", "failed");
    toast.error("Ứng dụng bị tạm khóa quét trong 10 phút do chạm giới hạn API của Meta.", "Chạm giới hạn Meta");
  };

  const checkAndWarnUsage = (info: any, pageName: string) => {
    if (!info) return;

    const parseMaxPercentage = (headerVal: any): number => {
      if (!headerVal) return 0;
      try {
        if (typeof headerVal === "string") {
          if (headerVal.startsWith("{")) {
            const parsed = JSON.parse(headerVal);
            let maxPct = 0;
            for (const key in parsed) {
              const val = parseFloat(parsed[key]);
              if (!isNaN(val) && val > maxPct) {
                maxPct = val;
              }
            }
            return maxPct;
          } else {
            const val = parseFloat(headerVal);
            return isNaN(val) ? 0 : val;
          }
        } else if (typeof headerVal === "object") {
          let maxPct = 0;
          for (const key in headerVal) {
            const val = parseFloat(headerVal[key]);
            if (!isNaN(val) && val > maxPct) {
              maxPct = val;
            }
          }
          return maxPct;
        }
      } catch (e) {
        // ignored
      }
      return 0;
    };

    const appPct = parseMaxPercentage(info.appUsage);
    const pagePct = parseMaxPercentage(info.pageUsage);
    const bizPct = parseMaxPercentage(info.businessUsage);

    const maxPct = Math.max(appPct, pagePct, bizPct);

    if (maxPct > 80) {
      addLog("system", `Cảnh báo sử dụng API trên "${pageName}": ${maxPct.toFixed(1)}% (vượt mức cho phép 80%). Tự động dừng để đảm bảo an toàn.`, "skipped");
      toast.warning(`Tự động tạm dừng quét vì mức sử dụng API Meta của trang "${pageName}" đạt ${maxPct.toFixed(0)}%.`, "Nguy cơ giới hạn");
      scanCancelledRef.current = true;
    }
  };

  // Dedicated fetch with exponential backoff & Rate Limit detection compliance (Requirement 2 & 10)
  const fetchWithBackoff = async (url: string, options: any = {}, retryCount = 0): Promise<any> => {
    if (isMetaRateLimited) {
      throw new Error("Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.");
    }

    try {
      const data = await safeFetchJson(url, options);

      if (data && data.error) {
        const errorMsg = data.error?.message || data.error || "";
        const errorCode = data.errorCode || data.error?.code;

        if (errorCode === 4 || errorMsg.toLowerCase().includes("application request limit reached")) {
          triggerMetaRateLimit();
          throw new Error("Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.");
        }
      }
      return data;
    } catch (err: any) {
      const errCode = err.responseJson?.errorCode || err.responseJson?.error?.code;
      const errMsg = err.message || "";

      if (errCode === 4 || errMsg.toLowerCase().includes("application request limit reached")) {
        triggerMetaRateLimit();
        throw new Error("Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.");
      }

      // Max 3 retries
      if (retryCount >= 3) {
        throw err;
      }

      // Backoff intervals: 5s, 15s, 60s
      const backoffDelays = [5000, 15000, 60000];
      const backoffDelay = backoffDelays[retryCount] || 60000;

      addLog("system", `Có lỗi xảy ra: ${errMsg}. Đang thử lại lần ${retryCount + 1}/3 sau ${backoffDelay / 1000} giây...`, "processing");
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
    // Clear out sensitive client side cache for maximum security as requested
    localStorage.removeItem("meta_app_secret");
    localStorage.removeItem("meta_user_token");
    localStorage.removeItem("facebook_access_token");

    const checkSetupAndFetch = async () => {
      // Check if redirect has returned with success indicator
      const urlParams = new URLSearchParams(window.location.search);
      const oauthParam = urlParams.get("oauth");

      if (oauthParam === "success" || urlParams.has("token")) {
        addLog("system", "Phát hiện đăng nhập tài khoản Facebook thành công via OAuth.", "success");
        toast.success("Liên kết tài khoản Facebook thành công!", "Đăng nhập Facebook");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      addLog("system", "Khởi tạo Meta Page Manager thành công. Đang kết nối bảo mật...", "pending");
      
      try {
        const checkUrl = "/api/check-pages";
        const checkData = await safeFetchJson(checkUrl, { method: "POST" });
        if (checkData.success && checkData.status === "connected") {
          const userName = checkData.user?.name || "Meta Account";
          addLog("system", `Kết nối Vercel API & Facebook thành công (Tài khoản: ${userName}).`, "success");
          toast.success(`Kết nối API thành công với tài khoản "${userName}"`, "Hệ thống");
          setUserToken("connected_by_session_cookie");
          fetchPages();
        } else {
          addLog("system", `Chưa đăng nhập Facebook: ${checkData.error?.message || "Yêu cầu liên kết tài khoản Facebook"}`, "skipped");
          toast.info("Vui lòng click vào nút Đăng nhập Facebook để bắt đầu.", "Chào mừng");
          setUserToken("");
          fetchPages();
        }
      } catch (err: any) {
        addLog("system", `Thông báo hệ thống: ${err.message}`, "skipped");
        setUserToken("");
        if (!handleAuthError(err.message)) {
          toast.error(`Kết nối API Facebook lỗi: ${err.message}`, "Lỗi hệ thống");
        }
        fetchPages();
      }
    };

    checkSetupAndFetch();
  }, []);

  // Set up Message Listener for OAuth Popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "OAUTH_AUTH_SUCCESS") {
        addLog("system", "Xác thực tài khoản Facebook hoàn thành. Đang kiểm tra phiên kết nối...", "success");
        try {
          const checkData = await safeFetchJson("/api/check-pages", { method: "POST" });
          if (checkData.success && checkData.status === "connected") {
            const userName = checkData.user?.name || "Meta Account";
            addLog("system", `Kết nối Vercel API & Facebook thành công (Tài khoản: ${userName}).`, "success");
            toast.success(`Đăng nhập thành công với tài khoản "${userName}"`, "Hệ thống");
            setUserToken("connected_by_session_cookie");
            fetchPages(undefined, true);
          } else {
            addLog("system", "Không thể liên kết tài khoản Facebook: Xác thực thất bại.", "failed");
            toast.error("Không thể lấy thông tin đăng nhập Facebook.", "Lỗi");
          }
        } catch (err: any) {
          addLog("system", `Xác thực đăng nhập lỗi: ${err.message}`, "failed");
          toast.error(`Xác thực đăng nhập lỗi: ${err.message}`, "Lỗi hệ thống");
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

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
      // Use our fetchWithBackoff for pages loading (Requirement 2 & 10)
      const data = await fetchWithBackoff(`/api/pages`);

      if (data && data.rateLimitInfo) {
        checkAndWarnUsage(data.rateLimitInfo, "Danh sách Trang");
      }

      if (data.error) {
        if (data.errorCode === 4) {
          triggerMetaRateLimit();
          return;
        }
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
      const errCode = err.responseJson?.errorCode || err.responseJson?.error?.code;
      if (errCode === 4 || err.message?.includes("giới hạn request")) {
        triggerMetaRateLimit();
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

    if (isMetaRateLimited) {
      const remainingSec = Math.ceil(((rateLimitUnlockTime || 0) - Date.now()) / 1000);
      toast.error(`Ứng dụng đang trong thời gian tạm khóa 10 phút do giới hạn của Meta. Vui lòng chờ ${remainingSec > 0 ? remainingSec : 0}s nữa.`, "Giới hạn Request");
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
      if (scanCancelledRef.current || isMetaRateLimited) return;

      const pageInfo = pages.find(p => p.id === pageId);
      if (!pageInfo) return;

      const currentIdx = index++;
      setScanProgress(p => ({ ...p, current: currentIdx, currentPageName: pageInfo.name }));

          // Implement frontend caching handling
          const cacheKey = `meta_posts_cache_${pageId}_${filters.maxPostsToFetch}`;
          if (!forceRefresh) {
            const cachedPostsStr = sessionStorage.getItem(cacheKey);
            if (cachedPostsStr) {
              try {
                const cachedData = JSON.parse(cachedPostsStr);
                if (cachedData && cachedData.savedAt && (Date.now() - cachedData.savedAt < 5 * 60 * 1000)) {
                  allFetchedPosts = [...allFetchedPosts, ...cachedData.posts];
                  addLog("system", `[Cache] Tải thành công ${cachedData.posts.length} bài viết của page "${pageInfo.name}" từ bộ nhớ đệm.`, "success");
                  return;
                }
              } catch (e) {
                // cache invalid
              }
            }
          }

          addLog("system", `[Meta API] Đang tải trực tiếp bài viết từ Page: "${pageInfo.name}"...`, "processing");

          try {
            const urlParams = new URLSearchParams();
            pageId && urlParams.append("pageId", pageId);
            urlParams.append("limit", filters.maxPostsToFetch.toString());
            urlParams.append("forceRefresh", forceRefresh ? "true" : "false");

            const data = await fetchWithBackoff(`/api/posts?${urlParams.toString()}`);

            if (data && data.rateLimitInfo) {
              checkAndWarnUsage(data.rateLimitInfo, pageInfo.name);
            }

            if (data.error || data.status === 429) {
              if (data.errorCode === 4 || data.errorCode === 17 || data.status === 429) {
                triggerMetaRateLimit();
                return;
              }
              addLog("system", `Lỗi tải bài viết Page [${pageInfo.name}]: ${data.error}`, "failed");
              return;
            }

            if (data.data && data.data.length > 0) {
              const fetchedPosts = data.data;
              allFetchedPosts = [...allFetchedPosts, ...fetchedPosts];
              setPosts([...allFetchedPosts]); // Update posts state to reflect real-time count
              
              if (data.fromCache) {
                 addLog("system", `Hoàn thành tải ${fetchedPosts.length} bài viết từ "${pageInfo.name}" (Cache).`, "success");
              } else {
                 addLog("system", `Hoàn thành tải ${fetchedPosts.length} bài viết từ "${pageInfo.name}".`, "success");
                 
                 // Also cache in frontend for extra safety according to requirement
                 const cacheObj = { savedAt: Date.now(), posts: fetchedPosts };
                 sessionStorage.setItem(cacheKey, JSON.stringify(cacheObj));
              }
            } else {
              addLog("system", `Hoàn thành: Fanpage "${pageInfo.name}" không có bài viết nào hoặc không thể đọc.`, "skipped");
            }
          } catch (err: any) {
        const errCode = err.responseJson?.errorCode || err.responseJson?.error?.code;
        if (errCode === 4 || err.message?.includes("giới hạn request")) {
          triggerMetaRateLimit();
          return;
        }

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
      while (pageIdQueue.length > 0 && !scanCancelledRef.current && !isMetaRateLimited) {
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

  // Auto loaded posts once pages & selection is resolved
  useEffect(() => {
    if (selectedPageIds.length > 0 && pages.length > 0) {
      fetchPostsFromSelectedPages();
    } else {
      setPosts([]);
      setSelectedPostIds([]);
    }
  }, [selectedPageIds]);

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
    let wasCancelled = false;

    for (let i = 0; i < selectedPostIds.length; i++) {
      if (deleteCancelledRef.current) {
        wasCancelled = true;
        addLog("queue", `Tiến trình xóa bị dừng theo yêu cầu của người dùng tại bài viết thứ ${i + 1}/${selectedPostIds.length}`, "skipped");
        break;
      }

      const postId = selectedPostIds[i];
      const post = posts.find(p => p.id === postId);

      if (!post) {
        setProgress(p => ({ ...p, current: i + 1 }));
        continue;
      }

      setCurrentlyDeletingId(postId);

      const snippet = post.message 
          ? (post.message.length > 50 ? `${post.message.substring(0, 50)}...` : post.message)
          : "[Bài viết hình ảnh/video không có tiêu đề]";

      addLog(postId, `[${i+1}/${selectedPostIds.length}] Đang xóa bài trên Page "${post.pageName}"...`, "processing");

      try {
        const data = await safeFetchJson("/api/delete-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: postId,
            confirm: true,
            userToken: post.pageAccessToken
          })
        });

        if (data.success) {
          countSuccess++;
          addLog(postId, `Đã xóa thành công bài viết [ID: ${postId}]: "${snippet}"`, "success");
        } else {
          countFail++;
          addLog(postId, `Thất bại khi xóa [ID: ${postId}] [Page: ${post.pageName}]: ${data.error || "Lỗi Meta API"}`, "failed");
          if (handleAuthError(data.error || "")) break;
        }
      } catch (err: any) {
        countFail++;
        addLog(postId, `Lỗi mạng khi xóa [ID: ${postId}]: ${err.message}`, "failed");
        if (handleAuthError(err.message)) break;
      }

      setProgress(p => ({ ...p, current: i + 1 }));

      // Artificial Delay with 300ms - 500ms
      if (i < selectedPostIds.length - 1) {
        const delay = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setCurrentlyDeletingId(null);
    setIsDeleting(false);
    setDeletedCountSession(prev => prev + countSuccess);
    
    if (wasCancelled) {
      addLog("queue", `Đã dừng tác vụ xoá hàng loạt! Thành công: ${countSuccess}, Thất bại: ${countFail}.`, "failed");
      toast.warning(`Tiến trình xoá đã bị dừng lại. Đã xoá thành công ${countSuccess} bài.`, "Đã dừng xoá");
    } else {
      addLog("queue", `Hoàn thành tác vụ xóa hàng loạt! Thành công: ${countSuccess}, Thất bại: ${countFail}.`, "success");
      
      if (countSuccess > 0 && countFail === 0) {
        toast.success(`Đã xóa thành công toàn bộ ${countSuccess} bài viết trên các Fanpage!`, "Xóa thành công");
      } else if (countSuccess > 0 && countFail > 0) {
        toast.warning(`Đã xóa xong: ${countSuccess} bài thành công, ${countFail} bài thất bại.`, "Xóa hoàn tất");
      } else {
        toast.error(`Xóa thất bại toàn bộ ${countFail} bài viết. Vui lòng kiểm tra lại quyền Token.`, "Xóa thất bại");
      }
    }
    
    // Refresh posts of pages to clear deleted items
    fetchPostsFromSelectedPages();
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
          style={{ backgroundColor: `rgba(2, 6, 22, ${(config?.bgOverlay ?? 25) / 100})` }}
        />

        {/* Dot pattern matching the background */}
        <div 
          className="absolute inset-0 z-[3] opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-3 md:gap-4 overflow-hidden min-h-0 flex-1">
      
        {/* LEFT COMPACT/MAIN NAVIGATION SIDEBAR */}
        <aside className={`w-full transition-all duration-300 glass p-4 shrink-0 flex flex-col gap-5 relative z-30 h-auto md:h-full overflow-y-auto ${isSidebarCollapsed ? 'md:w-[80px]' : 'md:w-[195px] xl:w-[215px]'}`}>
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 w-full justify-between select-none px-1">
            <Tooltip 
              content={isSidebarCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"} 
              side="right" 
              description="Bật / Tắt Menu"
            >
              <div 
                className="flex items-center gap-3 overflow-hidden cursor-pointer group w-full"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-500 to-[#1877F2] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(24,119,242,0.4)] border border-blue-400/30 overflow-hidden transform group-hover:scale-[1.03] transition-all duration-300">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <Facebook className="w-5 h-5 text-white fill-current drop-shadow-md z-10" />
                </div>
                {!isSidebarCollapsed && (
                  <div className="hidden sm:flex flex-col min-w-0 justify-center">
                    <h1 className="text-[17px] font-black tracking-tight truncate pb-0.5 leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400 dark:from-white dark:to-slate-300">
                      Meta Sync
                    </h1>
                    <span className="text-[9px] font-black text-blue-500/80 dark:text-blue-400 tracking-[0.2em] uppercase font-mono truncate leading-none mt-1 transition-colors drop-shadow-sm">
                      Workspace
                    </span>
                  </div>
                )}
              </div>
            </Tooltip>
          </div>

          <div className="hidden sm:block w-full h-px bg-white/[0.06]" />

          {/* Group 1: Navigation Links */}
          <div className="flex flex-col gap-3 flex-1 w-full">
            {!isSidebarCollapsed && (
              <span className="hidden sm:block px-2 text-[9.5px] font-black tracking-widest text-slate-500 uppercase select-none">
                Menu chính
              </span>
            )}
            
            <nav className="flex flex-row md:flex-col gap-1.5 w-full justify-between md:justify-start">
              {/* Tab: Bài viết */}
              <Tooltip disabled={!isSidebarCollapsed} content="Bài viết" description="Quản lý và xoá nội dung" side="right">
                <button
                   id="tab-posts"
                   type="button"
                   onClick={() => {
                     setActiveTab("posts");
                     addLog("system", "Chuyển sang trang: Quản lý bài viết", "success");
                   }}
                   className={`group flex items-center justify-start gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer outline-none relative w-full border ${
                     activeTab === "posts"
                       ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                       : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                   }`}
                >
                  {activeTab === "posts" && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  )}
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    activeTab === "posts"
                      ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                      : "bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  }`}>
                    <FileText className="w-4 h-4 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`hidden sm:block text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "posts" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                      Bài viết
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Tab: Trạng thái API */}
              <Tooltip disabled={!isSidebarCollapsed} content="Trạng thái API" description="Kiểm tra quyền và kết nối" side="right">
                <button
                   id="tab-status"
                   type="button"
                   onClick={() => {
                     setActiveTab("status");
                     addLog("system", "Chuyển sang trang: Trạng thái Fanpage", "success");
                   }}
                   className={`group flex items-center justify-start gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer outline-none relative w-full border ${
                     activeTab === "status"
                       ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                       : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                   }`}
                >
                  {activeTab === "status" && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  )}
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    activeTab === "status"
                      ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      : "bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  }`}>
                    <Activity className="w-4 h-4 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`hidden sm:block text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "status" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                      Trạng thái API
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Tab: Quản trị viên */}
              <Tooltip disabled={!isSidebarCollapsed} content="Quản trị viên" description="Xem thành viên quản lý Page" side="right">
                <button
                   id="tab-admins"
                   type="button"
                   onClick={() => {
                     setActiveTab("admins");
                     addLog("system", "Chuyển sang trang: Quản trị viên Fanpage", "success");
                   }}
                   className={`group flex items-center justify-start gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer outline-none relative w-full border ${
                     activeTab === "admins"
                       ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                       : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                   }`}
                >
                  {activeTab === "admins" && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  )}
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    activeTab === "admins"
                      ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                      : "bg-purple-500/15 text-purple-400 group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  }`}>
                    <Users className="w-4 h-4 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`hidden sm:block text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "admins" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                      Quản trị viên
                    </span>
                  )}
                </button>
              </Tooltip>
            </nav>
          </div>

          <div className="hidden sm:block w-full h-px bg-white/[0.06]" />

          {/* Group 2: System Settings / Utilities */}
          <div className="flex flex-col gap-3">
            {!isSidebarCollapsed && (
              <span className="hidden sm:block px-2 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase select-none font-sans">
                Hệ thống
              </span>
            )}

            <nav className="flex flex-col gap-1.5 w-full">
              {/* Tab: Tuỳ biến */}
              <Tooltip disabled={!isSidebarCollapsed} content="Tuỳ biến" description="Thay đổi giao diện ứng dụng" side="right">
                <button
                   id="tab-theme"
                   type="button"
                   onClick={() => {
                     setActiveTab("theme");
                     addLog("system", "Chuyển sang trang: Tùy biến giao diện", "success");
                   }}
                   className={`group flex items-center justify-start gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer outline-none relative w-full border ${
                     activeTab === "theme"
                       ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm"
                       : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                   }`}
                >
                  {activeTab === "theme" && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  )}
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    activeTab === "theme"
                      ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                      : "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  }`}>
                    <Palette className="w-4 h-4 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`hidden sm:block text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${activeTab === "theme" ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                      Tuỳ biến
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Nút cài đặt API */}
              <Tooltip disabled={!isSidebarCollapsed} content="Cài đặt API" description="Cấu hình Meta App và Token" side="right">
                <button 
                  id="btn-settings"
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className={`group flex items-center justify-start gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer outline-none relative w-full border ${
                    showConfig 
                      ? "bg-[var(--accent)]/12 border-[var(--accent)]/20 text-white shadow-sm" 
                      : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  {showConfig && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  )}
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    showConfig 
                      ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  }`}>
                    <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`hidden sm:block text-[13px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${showConfig ? "text-[var(--accent)] font-extrabold" : "text-slate-300 group-hover:text-white"}`}>
                      Cài đặt API
                    </span>
                  )}
                </button>
              </Tooltip>
            </nav>
          </div>

          {/* Footer User Profile & Connection Status */}
          <div className="flex flex-col gap-3 w-full shrink-0">
            {/* User credentials & Logout */}
            <Tooltip 
              disabled={!isSidebarCollapsed} 
              content={userToken ? "Đăng xuất" : "Đăng nhập Facebook"} 
              description={userToken ? "Xoá phiên đăng nhập hiện tại" : "Cấu hình liên kết OAuth"} 
              side="right"
            >
              <button 
                type="button"
                onClick={() => {
                  if (userToken) {
                    clearCredentials();
                  } else {
                    handleOAuthLogin();
                  }
                }}
                className={`flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border transition-all duration-300 font-bold text-[13px] ${
                  userToken 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 shadow-sm" 
                    : "bg-blue-500/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/30 shadow-sm"
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && (
                  <span>{userToken ? "Đăng xuất" : "Đăng nhập Facebook"}</span>
                )}
              </button>
            </Tooltip>
          </div>
        </aside>

        {/* RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-20 w-full">
          
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

          {/* META RATE LIMIT ALERT BANNER */}
          {isMetaRateLimited && (
            <div className="mb-3 backdrop-blur-md bg-red-500/15 border-l-4 border-red-500 p-3.5 rounded-r-xl flex items-start gap-3 text-red-150 shadow-lg shrink-0 relative z-20">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs flex-1">
                <span className="font-extrabold uppercase tracking-wider block text-[11px] text-red-400 mb-0.5">Giới hạn yêu cầu của Meta</span>
                <p className="font-medium text-[12px]">Ứng dụng đã chạm giới hạn request của Meta. Vui lòng chờ rồi thử lại.</p>
                {rateLimitUnlockTime && (
                  <span className="text-[10px] text-red-400 font-mono mt-1 block">
                    Khóa tạm thời đến: {new Date(rateLimitUnlockTime).toLocaleTimeString("vi-VN")} ( Còn khoảng {Math.ceil((rateLimitUnlockTime - Date.now()) / 1000)} giây)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* MAIN CONTAINER */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-3.5 items-stretch overflow-hidden">
        
            {/* SUB-SIDEBAR: PAGES LIST */}
            <aside className={`w-full xl:w-[250px] 2xl:w-[290px] glass rounded-r-none border-r-0 flex flex-col overflow-hidden min-h-0 xl:h-full shrink-0 ${activeTab === 'posts' ? '' : 'hidden'}`}>
              <div className="flex flex-col gap-3 p-4 pb-3 border-b border-border/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[12px] font-bold text-foreground">DANH SÁCH FANPAGE</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{pages.length} Page</p>
                  </div>
                  {userToken && (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {selectedPageIds.length} / {pages.length}
                      </span>
                      <button 
                        id="btn-refresh-pages"
                        onClick={() => fetchPages()} 
                        title="Tải lại danh sách Fanpage" 
                        className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Select / Deselect All Fanpages Control */}
                {userToken && pages.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      id="btn-select-all-pages"
                      onClick={() => {
                        const allPageIds = pages.map(p => p.id);
                        setSelectedPageIds(allPageIds);
                        addLog("system", `Đã chọn tất cả ${pages.length} Fanpage. Đang chuẩn bị tải bài viết...`, "success");
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedPageIds.length === pages.length
                          ? "bg-accent text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      <Check className={`w-3 h-3 stroke-[3px] ${selectedPageIds.length === pages.length ? "text-white" : ""}`} />
                      Chọn tất cả
                    </button>
                    <button
                      id="btn-deselect-all-pages"
                      onClick={() => {
                        setSelectedPageIds([]);
                        addLog("system", "Đã hủy chọn toàn bộ các Fanpage.", "success");
                      }}
                      className="flex-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-[10px] uppercase font-bold transition-all text-center cursor-pointer"
                    >
                      Bỏ chọn hết
                    </button>
                  </div>
                )}

                {/* Search Fanpage Input */}
                {userToken && pages.length > 0 && (
                  <div className="relative mt-1">
                    <input 
                      type="text"
                      placeholder="Tìm tên hoặc ID Fanpage..."
                      value={pageSearchQuery}
                      onChange={(e) => setPageSearchQuery(e.target.value)}
                      className="w-full bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border rounded-xl pl-8 pr-8 h-[34px] text-[11px] text-foreground placeholder-muted-foreground focus:bg-background focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    {pageSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setPageSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!userToken ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-muted/10">
                  <Facebook className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Vui lòng kết nối tài khoản Facebook để quét Fanpage quản lý.
                  </p>
                  <button
                    id="btn-sidebar-login"
                    onClick={handleOAuthLogin}
                    className="mt-4 w-full py-2 bg-background/50 backdrop-blur-md hover:bg-white/5 text-foreground border border-border/50 rounded-xl text-[11px] font-bold transition-all shadow-sm"
                  >
                    Nhấn Thử Đăng nhập
                  </button>
                </div>
              ) : loadingPages ? (
                <div className="flex-1 flex flex-col justify-center items-center py-12">
                  <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[11px] text-muted-foreground mt-3">Đang kết nối Facebook...</p>
                </div>
              ) : pages.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                  <Info className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-[11px] text-muted-foreground">Không tìm thấy Account Fanpage nào trong mã thông báo này.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-1.5 overflow-y-auto p-3 pt-2 custom-scrollbar min-h-0">
                  {(() => {
                    const query = pageSearchQuery.trim().toLowerCase();
                    const filteredList = pages.filter(
                      page => page.name.toLowerCase().includes(query) || page.id.includes(query)
                    );

                    if (filteredList.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground text-[11px]">
                          Không tìm thấy Fanpage nào phù hợp
                        </div>
                      );
                    }

                    return filteredList.map((page) => {
                      const isSelected = selectedPageIds.includes(page.id);
                      const isFetching = loadingPosts && scanProgress.currentPageName === page.name;
                      const picUrl = page.picture?.data?.url || `https://graph.facebook.com/${page.id}/picture?type=small`;
                      
                      let cardClass = "bg-[#081926]/45 border-white/5 hover:bg-white/5 border";
                      let indicator = <div className="w-[18px] h-[18px] rounded-[6px] border border-white/10 group-hover:border-white/20 transition-colors"></div>;
                      
                      if (isFetching) {
                         cardClass = "border border-orange-500/50 shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] bg-transparent";
                         indicator = <div className="w-[18px] h-[18px] rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin"></div>;
                      } else if (isSelected) {
                         cardClass = "bg-[#22D3EE]/10 border border-[#22D3EE]/30 shadow-sm";
                         indicator = (
                           <div className="w-[18px] h-[18px] bg-[#22D3EE] rounded-[6px] flex items-center justify-center transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                             <Check className="w-3 h-3 text-[#06202A] stroke-[4px]" />
                           </div>
                         );
                      }

                      return (
                        <div 
                          id={`page-card-${page.id}`}
                          key={page.id}
                          onClick={() => togglePageSelection(page.id)}
                          className={`flex items-center gap-2.5 p-[8px_10px] rounded-[16px] transition-all cursor-pointer select-none group relative ${cardClass}`}
                        >
                          <img 
                            src={picUrl} 
                            alt="" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${page.id}`;
                            }}
                            className="w-[34px] h-[34px] rounded-full min-w-[34px] shadow-sm object-cover bg-background"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={`text-[11.5px] font-semibold truncate leading-tight ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>{page.name}</p>
                            <div className="flex items-center gap-1 mt-0.5 group/id">
                              <p className="text-[9.5px] text-slate-400 md:opacity-100 truncate font-mono">ID: {page.id}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(page.id);
                                  addLog("system", "Đã sao chép ID trang", "success");
                                }}
                                className="opacity-0 group-hover/id:opacity-100 p-0.5 hover:bg-muted rounded transition-opacity"
                                title="Sao chép Page ID"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                             {indicator}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </aside>

        {/* MAIN POST AREA & FILTERS */}
        <main className="flex-1 w-full flex flex-col gap-3 relative z-10 overflow-hidden min-h-0 h-full">
          
            <div className={`flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full ${activeTab === 'posts' ? '' : 'hidden'}`}>
              <div className="flex-1 flex flex-col gap-3 min-w-0 h-full glass rounded-l-none border-l-0 px-2 py-1">
              {/* TOP BAR: FILTERS CARD */}
              <section className="relative z-30 p-2 text-foreground shrink-0 border-b border-border/5">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 relative z-40">
                  {/* Left: Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2 pb-1 sm:pb-0">
                    
                    {/* Filter: Date Range Selection / Dropdown */}
                    <div className="relative flex items-center gap-1 shrink-0">
                      <CustomDropdown
                        value={filters.timeRangePreset}
                        label="Thời gian"
                        options={[
                          { value: "today", label: "Hôm nay" },
                          { value: "week", label: "Tuần này" },
                          { value: "month", label: "Tháng này" },
                          { value: "year", label: "Năm nay" },
                          { value: "all", label: "Từ trước đến nay" },
                          { value: "custom", label: "Tuỳ chỉnh..." }
                        ]}
                        width={180}
                        onChange={(val: string) => {
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
                            
                            const presetLabels: Record<string, string> = {
                              today: "Hôm nay", week: "Tuần này", month: "Tháng này", year: "Năm nay", all: "Từ trước đến nay"
                            };
                            if (presetLabels[val]) {
                              addLog("system", `Đã đổi bộ lọc thời gian thành: ${presetLabels[val]}`, "success");
                            }
                          }
                        }}
                      />
                        
                        {filters.timeRangePreset === "custom" && filters.enableDateRange && (filters.dateFrom || filters.dateTo) && (
                           <div 
                             onClick={() => {
                               setTempDateFrom(filters.dateFrom);
                               setTempDateTo(filters.dateTo);
                               setShowCustomDateModal(true);
                             }}
                             className="ml-1 text-[10px] text-accent font-bold bg-accent/10 hover:bg-accent/20 px-2.5 py-1.5 rounded-full cursor-pointer transition-colors border border-accent/20 whitespace-nowrap"
                             title="Sửa ngày tuỳ chỉnh"
                           >
                             {filters.dateFrom ? filters.dateFrom.split("-").reverse().join("/") : "..."} - {filters.dateTo ? filters.dateTo.split("-").reverse().join("/") : "..."}
                           </div>
                        )}
                    </div>

                    {/* Filter: Max Limits config */}
                    <div className="relative shrink-0">
                      <CustomDropdown
                        value={filters.maxPostsToFetch}
                        label="Giới hạn"
                        disabled={loadingPosts || isDeleting}
                        options={[
                          { value: 100, label: "100 bài" },
                          { value: 200, label: "200 bài" },
                          { value: 300, label: "300 bài" },
                          { value: 400, label: "400 bài" },
                          { value: 500, label: "Tối đa (500)" }
                        ]}
                        width={160}
                        onChange={(val: number) => setFilters(f => ({ ...f, maxPostsToFetch: val }))}
                      />
                    </div>

                  </div>

                  {/* Right: Stats Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 select-none shrink-0">
                    {/* Stat 1: Selection (Blue) */}
                    <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                      <span className="font-medium text-blue-500/80">Đã chọn</span>
                      <span className="font-bold text-blue-500 pl-1 border-l border-blue-500/20">{selectedPostIds.length}</span>
                    </div>

                    {/* Stat 2: Filtered (Purple) */}
                    <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                      <span className="font-medium text-purple-500/80">Đã lọc</span>
                      <span className="font-bold text-purple-500 pl-1 border-l border-purple-500/20">{filteredPosts.length}</span>
                    </div>

                    {/* Stat 3: Fetched (Green) */}
                    <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <span className="font-medium text-emerald-500/80">Đã tải</span>
                      <span className="font-bold text-emerald-500 pl-1 border-l border-emerald-500/20">{posts.length}</span>
                    </div>

                    {/* Stat 4: Deleted (Red) */}
                    <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      <span className="font-medium text-rose-500/80">Đã xoá</span>
                      <span className="font-bold text-rose-500 pl-1 border-l border-rose-500/20">{deletedCountSession}</span>
                    </div>

                    {/* Toggle Panel Button */}
                    <button
                      onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                      className="flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap bg-muted/40 hover:bg-muted/80 px-3 py-1 rounded-lg border border-border/40 transition-colors ml-1 text-foreground"
                      title={isRightPanelOpen ? "Thu gọn bảng lệnh" : "Mở bảng lệnh"}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      {isRightPanelOpen ? "Đóng lệnh" : "Mở lệnh"}
                    </button>
                  </div>
                </div>

              </section>

          {/* POSTS SCREEN CONTAINER */}
          <section className="relative z-10 flex-1 glass overflow-hidden flex flex-col min-h-0">
            {/* Table/List Header */}
            <div className="px-5 py-3.5 border-b border-border/30 bg-transparent flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981] opacity-80"></span>
                <span className="text-[13px] font-bold tracking-wide text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  Danh sách bài viết
                </span>
              </div>
              
              {posts.length > 0 && (
                <div 
                  id="btn-toggle-select-all"
                  onClick={selectAllFiltered}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-xl border border-border/50 cursor-pointer select-none transition-all font-semibold"
                >
                  <div 
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id))
                        ? "bg-accent border-accent text-white shadow-sm" 
                        : "border-muted-foreground/30 hover:border-accent/40 bg-background/50"
                    }`}
                  >
                    {displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id)) && (
                      <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                    )}
                  </div>
                  <span>Chọn toàn bộ lọc hiện tại</span>
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
              className="p-3 overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar bg-transparent"
            >
              {loadingPosts ? (
                <div className="flex flex-col justify-center items-center gap-4 text-foreground h-full min-h-[400px] py-6 w-full">
                  <div className="w-[480px] max-w-full glass shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] shadow-orange-500/5 p-8 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Glow effect background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-orange-600/40 via-orange-500/80 to-orange-400/40 blur-[16px] rounded-full"></div>
                    
                    <div className="relative w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 z-10">
                      <div className="absolute inset-0 border-[3px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                      <Facebook className="w-6 h-6 text-orange-500 absolute" />
                    </div>

                    <h3 className="text-[17px] font-bold text-foreground mb-1 relative z-10">Đang tải bài viết</h3>
                    
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6 max-w-[90%] inline-flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0"></span>
                       <span className="text-[13px] font-bold text-orange-400 truncate relative z-10">
                         {scanProgress.currentPageName || "Đang khởi tạo..."}
                       </span>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mb-6 relative z-10">
                      <div className="bg-muted/40 border border-border/40 rounded-[16px] p-4 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-widest">Page hoàn thành</span>
                        <div className="flex items-baseline gap-1 font-mono font-bold">
                          <span className="text-orange-500 text-[20px] leading-none">{scanProgress.current}</span>
                          <span className="text-muted-foreground text-[12px]">/ {scanProgress.total}</span>
                        </div>
                      </div>
                      <div className="bg-muted/40 border border-border/40 rounded-[16px] p-4 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-widest">Bài đã tải</span>
                        <div className="flex items-baseline gap-1 font-mono font-bold">
                          <span className="text-emerald-500 text-[20px] leading-none">{posts.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full flex items-center gap-3 mb-6 relative z-10">
                      <div className="flex-1 bg-muted/60 h-2 rounded-full overflow-hidden shadow-inner relative">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-orange-500 w-8 text-right">
                         {scanProgress.total > 0 ? Math.round((scanProgress.current / scanProgress.total) * 100) : 0}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        scanCancelledRef.current = true;
                        addLog("system", "Đang gửi yêu cầu dừng tải...", "pending");
                      }}
                      className="px-6 py-2 rounded-xl border border-rose-500/50 hover:bg-rose-500/10 text-rose-500 text-[12px] font-bold transition-all relative z-10 cursor-pointer"
                    >
                      Dừng tải
                    </button>

                    <p className="text-[11px] text-slate-400 mt-5 max-w-[95%] mx-auto leading-relaxed relative z-10">
                      Hệ thống đang tải dữ liệu theo từng trang để hạn chế giới hạn request của Meta.
                    </p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-4 h-full min-h-[300px] py-8">
                  <div className="w-16 h-16 rounded-[24px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
                    <Facebook className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] text-white tracking-wide">Chọn Fanpage bên trái để tải dữ liệu</h3>
                    <p className="text-[11.5px] text-slate-400 mt-2 max-w-[340px] mx-auto leading-relaxed">
                      Hệ thống sẽ tải giới hạn <span className="text-cyan-300 font-bold">{filters.maxPostsToFetch}</span> bài viết/trang.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-1.5">
                  {(() => {
                    const ROW_HEIGHT = 62; // reduced height by ~10%
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
                                style={{ height: `${ROW_HEIGHT - 4}px` }}
                                className={`group grid grid-cols-[30px_40px_1fr_120px_40px] gap-2 items-center px-2 py-1 rounded-[12px] transition-all duration-200 border ${
                                  currentlyDeletingId === post.id
                                    ? "bg-rose-500/10 border-rose-500/40 animate-pulse cursor-wait"
                                    : isChecked 
                                      ? "bg-accent/10 border-accent/20 backdrop-blur-md cursor-pointer" 
                                      : "glass-card hover:border-accent/40 cursor-pointer"
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
                                <div className="flex flex-col justify-center min-w-0 pr-1 h-full">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <span className="bg-muted/50 text-foreground/80 text-[9px] px-1.5 py-[1px] rounded-[4px] leading-none font-semibold border border-border/30 truncate max-w-[120px]" title={post.pageName}>
                                      {post.pageName}
                                    </span>
                                    {post.status_type && (
                                     <span className="text-[9px] text-slate-400 font-medium capitalize">
                                        • {post.status_type.replace('_', ' ')}
                                     </span>
                                    )}
                                    <span className="text-[9px] text-transparent group-hover:text-slate-500 font-mono transition-colors truncate max-w-[80px]" title={post.id}>
                                      #{post.id.split('_').pop() || post.id}
                                    </span>
                                    {currentlyDeletingId === post.id && (
                                      <span className="text-rose-500 text-[9px] flex items-center gap-1 font-bold uppercase select-none relative ml-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping absolute -left-2.5" />
                                        Đang xóa
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className={`text-[11.5px] font-medium leading-tight line-clamp-2 break-all ${currentlyDeletingId === post.id ? "text-rose-400" : "text-foreground"}`} title={post.message || ""}>
                                    {post.message ? (
                                      post.message
                                    ) : (
                                      <span className="italic text-slate-500 font-normal">[Chỉ có đa phương tiện]</span>
                                    )}
                                  </p>
                                </div>

                                {/* Time */}
                                <div className={`text-center flex flex-col gap-0.5 shrink-0 select-none ${currentlyDeletingId === post.id ? "text-muted-foreground" : ""}`}>
                                  <span className="text-[10px] font-mono font-medium text-foreground/80">{formattedDate}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">({diffDays} ngày trước)</span>
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
          {isRightPanelOpen && (
            <aside className="w-full xl:w-[330px] 2xl:w-[350px] glass p-4 shrink-0 flex flex-col gap-4 h-[auto] xl:h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">
            {/* PROGRESS BAR PANEL */}
            <div className="flex flex-col gap-4 min-h-0 shrink-0">
              <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-[12px] uppercase tracking-widest">Tác vụ bài viết</h3>
              </div>

              <div className="space-y-3">
                {/* Progress Indicators */}
                <div className="bg-muted/30 p-3 rounded-[16px] border border-border/50">
                  <div className="flex justify-between items-center text-[11px] font-bold tracking-wide text-foreground mb-2">
                    <span>{loadingPosts ? "Đang tải bài viết..." : (isDeleting ? "Đang xóa..." : "Tiến trình")}</span>
                    <span className="font-mono text-accent">
                      {loadingPosts 
                        ? (scanProgress.total > 0 ? `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` : "0%")
                        : (progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%")
                      }
                    </span>
                  </div>
                  
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden shadow-inner mb-2 border border-border/10">
                    <div 
                      className={`h-full transition-all duration-300 ${loadingPosts ? "bg-orange-500" : isDeleting ? "bg-rose-500" : "bg-accent"}`}
                      style={{ width: `${loadingPosts 
                        ? (scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0)
                        : (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium text-muted-foreground">
                      {loadingPosts ? (
                        <><span className="text-orange-500 font-bold">{scanProgress.current}</span> / <span>{scanProgress.total}</span> Page</>
                      ) : isDeleting ? (
                        <><span className="text-rose-500 font-bold">{progress.current}</span> / <span>{progress.total}</span> bài</>
                      ) : (
                        <span className="text-slate-400 italic">Sẵn sàng</span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full mt-2">
                  {!loadingPosts && (
                    <button
                      id="btn-load-posts"
                      type="button"
                      onClick={() => fetchPostsFromSelectedPages(true)}
                      disabled={selectedPageIds.length === 0 || isMetaRateLimited}
                      className="w-full py-2.5 bg-accent hover:bg-accent/90 text-[#06202A] rounded-[14px] font-bold text-[11px] tracking-wide transition-all flex items-center justify-center gap-2 disabled:bg-slate-700/45 disabled:text-slate-400 disabled:border-white/5 disabled:cursor-not-allowed cursor-pointer select-none active:scale-95 shadow-sm hover:brightness-105"
                    >
                      <RotateCw className="w-3.5 h-3.5 shrink-0" />
                      Tải bài viết
                    </button>
                  )}

                  {loadingPosts && (
                    <button
                      type="button"
                      onClick={() => {
                        scanCancelledRef.current = true;
                        addLog("system", "Đang gửi yêu cầu dừng quét trang...", "pending");
                      }}
                      className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-[14px] text-[11px] font-bold tracking-wide transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      Dừng tải
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button 
                      id="btn-delete-trigger"
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={selectedPostIds.length === 0 || isDeleting}
                      className={`flex-1 py-2.5 rounded-[14px] font-bold text-[11px] tracking-wide transition-all duration-200 flex items-center justify-center gap-2 select-none border ${
                        selectedPostIds.length > 0 && !isDeleting
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/40 cursor-pointer shadow-sm' 
                          : 'bg-slate-700/35 text-slate-500 border-transparent cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      Xóa bài đã chọn
                    </button>

                    {isDeleting && (
                      <button
                        id="btn-stop-deletion"
                        type="button"
                        onClick={() => {
                          deleteCancelledRef.current = true;
                          addLog("queue", "Yêu cầu dừng tiến trình xóa...", "pending");
                        }}
                        className="px-3 py-2.5 rounded-[14px] bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                        title="Dừng xóa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE LOG CONSOLE TERMINAL */}
            <div className="flex-1 flex flex-col glass-card p-3 shadow-inner min-h-[200px] overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2 shrink-0">
                <span className="text-[11px] tracking-widest text-foreground font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  NHẬT KÝ HOẠT ĐỘNG
                </span>
                <button 
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] hover:bg-muted p-1 px-2 rounded-md text-muted-foreground hover:text-foreground font-semibold transition-colors"
                >
                  Xóa
                </button>
              </div>

              {/* Log Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 shrink-0 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveLogTab("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeLogTab === "all"
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  Tất cả
                  <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[9.5px]">
                    {logs.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogTab("success")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeLogTab === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  Thành công
                  <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[9.5px]">
                    {logs.filter(log => log.status === "success").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogTab("error")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeLogTab === "error"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  Lỗi
                  <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[9.5px]">
                    {logs.filter(log => log.status === "failed").length}
                  </span>
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-2 font-mono text-[10.5px] p-1 custom-scrollbar pr-2 mt-1"
              >
                {(() => {
                  const filtered = logs.filter((log) => {
                    if (activeLogTab === "error") return log.status === "failed";
                    if (activeLogTab === "success") return log.status === "success";
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-slate-500 italic py-2 text-center text-[10px]">
                        {activeLogTab === "error" 
                          ? "Không có nhật ký lỗi..." 
                          : activeLogTab === "success" 
                          ? "Không có nhật ký thành công..." 
                          : "Chưa có nhật ký hoạt động..."}
                      </p>
                    );
                  }

                  return filtered.map((log) => {
                    let colorClass = "text-muted-foreground";
                    let prefix = "•";

                    if (log.status === "success") {
                      colorClass = "text-emerald-500 font-semibold";
                      prefix = "✔";
                    } else if (log.status === "failed") {
                       colorClass = "text-rose-500 font-bold";
                       prefix = "✘";
                    } else if (log.status === "processing" || log.status === "pending") {
                       colorClass = "text-orange-500 font-medium";
                       prefix = "⏱";
                    } else {
                       // Cảnh báo / System fallback
                       colorClass = "text-accent font-medium";
                       prefix = "ℹ";
                    }

                    if (log.type === "system") {
                       colorClass = "text-blue-500 font-semibold";
                    }

                    return (
                      <div 
                        key={log.id} 
                        className={`${colorClass} flex gap-1.5 items-center leading-relaxed bg-background/40 hover:bg-background/80 px-2 py-1.5 rounded-lg border border-border/20 transition-colors w-full overflow-hidden`}
                        title={log.postMessageSnippet}
                      >
                        <span className="shrink-0 text-muted-foreground font-normal text-[9.5px]">[{log.timestamp.split(" ")[1]}]</span>
                        <span className="shrink-0 font-bold text-[10px]">{prefix}</span>
                        <span className="truncate min-w-0" style={{ lineHeight: '1.2' }}>{log.postMessageSnippet}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </aside>
          )}
          </div>

            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 w-full h-full ${activeTab === 'status' ? '' : 'hidden'}`}>
              <PageStatusTab pages={pages} userToken={userToken} />
            </div>

            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 w-full h-full ${activeTab === 'admins' ? '' : 'hidden'}`}>
              <PageAdminsTab pages={pages} userToken={userToken} />
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
          <div className="glass p-6 md:p-8 w-full max-w-[500px]">
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
          <div className="glass p-6 md:p-8 w-full max-w-[480px] text-center">
            <div className="w-16 h-16 bg-rose-950/20 border border-rose-500/25 text-rose-400 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-inner transform -rotate-6">
              <Trash2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">
              Xác nhận hủy hoại vĩnh viễn?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              Bạn đang chuẩn bị tiến hành xóa hàng loạt <b className="text-rose-400 font-mono text-sm bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-500/15">{selectedPostIds.length} bài đăng</b> khỏi các Fanpage. Hành động này sẽ triệt tiêu vĩnh viễn toàn bộ lượt Thích, Bình luận, và Chia sẻ đi kèm.
            </p>

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
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-[13px] transition-all disabled:bg-slate-700/45 disabled:text-slate-400 disabled:border-white/5 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-rose-950/15"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECONNECT FACEBOOK DIALOG MODAL */}
      {showReconnectModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 md:p-8 w-full max-w-[480px] text-center">
            <div className="w-16 h-16 bg-cyan-950/20 border border-cyan-500/25 text-cyan-400 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">
              Phiên kết nối đã hết hạn
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              Kết nối của bạn đến hệ thống Facebook đã hết hạn hoặc bị thu hồi trên máy chủ Meta. Vui lòng kết nối lại tài khoản Facebook để tiếp tục quản lý các Fanpage.
            </p>

            <div className="flex gap-3">
              <button 
                id="btn-reconnect-cancel"
                onClick={() => setShowReconnectModal(false)}
                className="flex-1 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-full font-bold text-[13px] transition-all border border-border shadow-sm cursor-pointer"
              >
                Đóng lại
              </button>
              
              <button 
                id="btn-reconnect-now"
                onClick={() => {
                  setShowReconnectModal(false);
                  handleOAuthLogin();
                }}
                className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full font-bold text-[13px] transition-all cursor-pointer shadow-md shadow-cyan-950/15"
              >
                Kết nối lại ngay
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
