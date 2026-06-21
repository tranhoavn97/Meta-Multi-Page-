import { useState, useEffect, useRef, useMemo } from "react";
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
  Moon
} from "lucide-react";
import { FacebookPage, FacebookPost, FilterCriteria, DeletionLog } from "./types";
import { safeFetchJson } from "./utils/safeFetchJson";
import { useToast } from "./components/Toast";
import PageStatusTab from "./components/PageStatusTab";
import PageAdminsTab from "./components/PageAdminsTab";
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
                      ? "bg-accent text-white shadow-md scale-105"
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
        className="flex items-center justify-between gap-1 bg-background border border-border hover:bg-muted hover:border-accent focus:border-accent rounded-xl px-2.5 h-9 text-xs outline-none text-foreground font-bold cursor-pointer transition-all select-none min-w-[70px] shadow-sm"
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90 text-accent" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-[99] w-[115px] bg-card border border-border rounded-xl shadow-lg p-1 overflow-hidden transition-all">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-accent stroke-[3.5px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const toast = useToast();

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const { config, setConfig } = useThemeConfig(isDark); // Instantiate global theme styles

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

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
  
  // Statuses
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Filters State
  const [filters, setFilters] = useState<FilterCriteria>({
    olderThanDays: 30,
    enableOlderThan: false,
    dateFrom: "",
    dateTo: "",
    enableDateRange: false,
    keyword: "",
    enableKeyword: false,
    maxPostsToFetch: 1000,
    maxPostsToShow: 1000,
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
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentPageName: string }>({ current: 0, total: 0, currentPageName: "" });
  const [deletedCountSession, setDeletedCountSession] = useState<number>(0);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [doubleConfirm, setDoubleConfirm] = useState<boolean>(false);

  // Active Tab state for Page Status and Admin/Business views integration
  const [activeTab, setActiveTab] = useState<"posts" | "status" | "admins" | "theme">("theme");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // References for logging & scroll
  const logContainerRef = useRef<HTMLDivElement>(null);
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
    if (confirm("Bạn có muốn đăng xuất và xóa toàn bộ thông tin tài khoản đang lưu?")) {
      localStorage.removeItem("meta_app_id");
      localStorage.removeItem("meta_app_secret");
      localStorage.removeItem("meta_user_token");
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
    }
  };

  const handleAuthError = (errMsg: string) => {
    const msg = typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg);
    if (msg.includes("Session has expired") || msg.includes("Error validating access token") || msg.includes("OAuthException")) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại Facebook.", "Hết hạn phiên");
      localStorage.removeItem("meta_user_token");
      setUserToken("");
      setPages([]);
      setPosts([]);
      setSelectedPageIds([]);
      return true;
    }
    return false;
  };

  // Custom log adder helper
  const addLog = (postId: string, message: string, status: DeletionLog["status"]) => {
    const timeString = new Date().toLocaleTimeString("vi-VN");
    const newLog: DeletionLog = {
      id: Math.random().toString(36).substr(2, 9),
      postId,
      postMessageSnippet: message,
      pageName: "Hệ thống",
      status,
      timestamp: timeString
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Initial load
  useEffect(() => {
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
        
        const checkData = await safeFetchJson(checkUrl, options);
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

  // Fetch listed Pages
  const fetchPages = async (tokenToUse?: string) => {
    const activeToken = tokenToUse || userToken;
    setLoadingPages(true);
    setApiError(null);
    addLog("system", "Đang tải danh sách các Facebook Fanpages quản lý từ /api/pages...", "pending");
    
    try {
      const urlParams = new URLSearchParams();
      if (activeToken) {
        urlParams.append("user_token", activeToken);
      }
      const data = await safeFetchJson(`/api/pages?${urlParams.toString()}`);

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
        addLog("system", `Đã tải thành công ${data.data.length} Fanpages quản lý.`, "success");
        toast.success(`Đã tải thành công ${data.data.length} Fanpages quản lý.`, "Tải Fanpage");
      } else {
        setPages([]);
        addLog("system", "Không tìm thấy Fanpage nào liên kết.", "skipped");
        toast.warning("Không tìm thấy Fanpage nào liên kết với tài khoản này.", "Thông báo");
      }
    } catch (err: any) {
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

  // Fetch posts from SELECTED pages
  const fetchPostsFromSelectedPages = async () => {
    if (selectedPageIds.length === 0) {
      addLog("system", "Yêu cầu hành động thất bại: Vui lòng tích chọn ít nhất 1 Fanpage bên cột Trái.", "skipped");
      toast.warning("Yêu cầu hành động thất bại: Vui lòng tích chọn ít nhất 1 Fanpage bên cột Trái.", "Chưa chọn Fanpage");
      return;
    }

    setLoadingPosts(true);
    setApiError(null);
    setPosts([]);
    setSelectedPostIds([]);
    scanCancelledRef.current = false;
    addLog("system", `Bắt đầu tải các bài viết từ ${selectedPageIds.length} Fanpage đã chọn...`, "pending");
    toast.info(`Bắt đầu tải và quét các bài viết từ ${selectedPageIds.length} Fanpage...`, "Quét bài viết");

    let allFetchedPosts: FacebookPost[] = [];
    setScanProgress({ current: 0, total: selectedPageIds.length, currentPageName: "Đang khởi tạo..." });

    let index = 0;
    for (const pageId of selectedPageIds) {
      if (scanCancelledRef.current) {
        addLog("system", `Đã dừng quét theo yêu cầu của người dùng tại bước ${index}/${selectedPageIds.length}.`, "skipped");
        toast.warning("Đã dừng quá trình quét bài viết theo yêu cầu.", "Hủy quét");
        break;
      }

      const pageInfo = pages.find(p => p.id === pageId);
      if (!pageInfo) continue;

      setScanProgress({ current: index, total: selectedPageIds.length, currentPageName: pageInfo.name });
      addLog("system", `Đang đọc bài viết từ Page: "${pageInfo.name}"...`, "processing");

      try {
        const urlParams = new URLSearchParams();
        urlParams.append("pageId", pageId);
        urlParams.append("limit", filters.maxPostsToFetch.toString());
        if (pageInfo.access_token) {
          urlParams.append("user_token", pageInfo.access_token);
        }
        
        const data = await safeFetchJson(`/api/posts?${urlParams.toString()}`);

        if (data.error) {
          addLog("system", `Lỗi tải bài viết Page [${pageInfo.name}]: ${data.error}`, "failed");
          index++;
          setScanProgress(p => ({ ...p, current: index }));
          continue;
        }

        if (data.data && data.data.length > 0) {
          const mapped: FacebookPost[] = data.data.map((item: any) => ({
            id: item.id,
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
            shares: item.shares
          }));

          allFetchedPosts = [...allFetchedPosts, ...mapped];
          addLog("system", `Đọc thành công ${data.data.length} bài từ "${pageInfo.name}".`, "success");
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

      index++;
      setScanProgress(p => ({ ...p, current: index, currentPageName: `Đã xong: ${pageInfo.name}` }));
    }

    // Sort all selected posts by created_time desc
    allFetchedPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    // Deduplicate posts by ID to prevent duplicate key rendering warnings
    const uniquePostsMap = new Map<string, FacebookPost>();
    for (const p of allFetchedPosts) {
      if (!uniquePostsMap.has(p.id)) {
        uniquePostsMap.set(p.id, p);
      }
    }
    const uniquePosts = Array.from(uniquePostsMap.values());

    setPosts(uniquePosts);
    setLoadingPosts(false);
    addLog("system", `Tổng hợp xong! Tìm thấy tổng số ${uniquePosts.length} bài viết hợp lệ (đã loại bỏ trùng lặp).`, "success");
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
      {/* BACKGROUND LAYER - Aurora Light Theme */}
      <div className="absolute inset-0 z-[1] pointer-events-none w-full h-full">
        <div
          className="absolute inset-0 z-0 opacity-40 blur-3xl"
          style={{
            background: `
              radial-gradient(circle at 0% 0%, var(--color-accent) 0%, transparent 40%),
              radial-gradient(circle at 100% 100%, var(--color-accent-secondary) 0%, transparent 40%)
            `,
          }}
        />
        {/* Dot pattern */}
        <div 
          className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-3 md:gap-4 overflow-hidden min-h-0 flex-1">
      
        {/* LEFT COMPACT/MAIN NAVIGATION SIDEBAR */}
        <aside className={`w-full transition-all duration-300 glass-card p-4 shrink-0 flex flex-col gap-6 shadow-md relative z-30 h-auto md:h-full overflow-y-auto ${isSidebarCollapsed ? 'md:w-[80px]' : 'md:w-[180px] xl:w-[200px]'}`}>
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 w-full justify-between">
            <div 
              className="flex items-center gap-3 overflow-hidden cursor-pointer group"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title="Thu gọn / Mở rộng"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-xl flex items-center justify-center shadow-accent transition-transform group-hover:scale-105 shrink-0">
                <Facebook className="w-5 h-5 text-white fill-current" />
              </div>
              {!isSidebarCollapsed && (
                <div className="hidden sm:block whitespace-nowrap">
                  <h1 className="text-[17px] font-display font-medium tracking-tight text-foreground transition-colors">
                    Meta Page
                  </h1>
                  <p className="text-[10px] text-muted-foreground mt-0 font-mono tracking-wider">MANAGER</p>
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px h-px md:w-full md:h-px bg-border" />

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col gap-2.5 w-full justify-between md:justify-start">
            <button
               id="tab-posts"
               type="button"
               onClick={() => {
                 setActiveTab("posts");
                 addLog("system", "Chuyển sang trang: Quản lý bài viết", "success");
               }}
               title={isSidebarCollapsed ? "Bài viết" : undefined}
               className={`flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 group w-full ${
                 activeTab === "posts"
                   ? "neu-button-primary text-white font-bold"
                   : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
               }`}
            >
              <FileText className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "posts" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
              {!isSidebarCollapsed && <span className={`hidden sm:block text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === "posts" ? "text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"}`}>Bài viết</span>}
            </button>

            <button
               id="tab-status"
               type="button"
               onClick={() => {
                 setActiveTab("status");
                 addLog("system", "Chuyển sang trang: Trạng thái Fanpage", "success");
               }}
               title={isSidebarCollapsed ? "Trạng thái API" : undefined}
               className={`flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 group w-full ${
                 activeTab === "status"
                   ? "neu-button-primary text-white font-bold"
                   : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
               }`}
            >
              <Activity className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "status" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
              {!isSidebarCollapsed && <span className={`hidden sm:block text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === "status" ? "text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"}`}>Trạng thái API</span>}
            </button>

            <button
               id="tab-admins"
               type="button"
               onClick={() => {
                 setActiveTab("admins");
                 addLog("system", "Chuyển sang trang: Quản trị viên Fanpage", "success");
               }}
               title={isSidebarCollapsed ? "Quản trị viên" : undefined}
               className={`flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 group w-full ${
                 activeTab === "admins"
                   ? "neu-button-primary text-white font-bold"
                   : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
               }`}
            >
              <Users className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "admins" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
              {!isSidebarCollapsed && <span className={`hidden sm:block text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === "admins" ? "text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"}`}>Quản trị viên</span>}
            </button>

            <button
               id="tab-theme"
               type="button"
               onClick={() => {
                 setActiveTab("theme");
                 addLog("system", "Chuyển sang trang: Tùy biến giao diện", "success");
               }}
               title={isSidebarCollapsed ? "Tuỳ biến" : undefined}
               className={`flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 group w-full ${
                 activeTab === "theme"
                   ? "neu-button-primary text-white font-bold"
                   : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
               }`}
            >
              <Settings className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "theme" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
              {!isSidebarCollapsed && <span className={`hidden sm:block text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === "theme" ? "text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"}`}>Tuỳ biến</span>}
            </button>
          </nav>

          <div className="hidden sm:block w-full h-px bg-border my-2" />

          {/* System status and user actions */}
          <div className="flex flex-col gap-3 w-full shrink-0 mt-auto">

             {userToken ? (
              <div className={`hidden sm:flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-3 py-2.5 rounded-xl font-bold items-center justify-center gap-2 shadow-sm ${isSidebarCollapsed ? 'px-0' : ''}`} title={isSidebarCollapsed ? "Đã kết nối" : undefined}>
                <span className="w-2.5 h-2.5 shrink-0 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] border-2 border-white/50"></span>
                {!isSidebarCollapsed && <span className="font-mono">Đã kết nối</span>}
              </div>
            ) : (
              <div className={`hidden sm:flex bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-3 py-2.5 rounded-xl font-bold items-center justify-center gap-2 shadow-sm ${isSidebarCollapsed ? 'px-0' : ''}`} title={isSidebarCollapsed ? "Cần đăng nhập" : undefined}>
                <span className="w-2.5 h-2.5 shrink-0 bg-amber-500 rounded-full animate-ping border border-white/50"></span>
                {!isSidebarCollapsed && <span className="font-mono">Cần đăng nhập</span>}
              </div>
            )}

            <div className="flex flex-col gap-2.5 w-full">
              {/* Sáng / Tối Segmented Control */}
              <div className={`flex bg-muted/60 p-1 rounded-xl border border-border shrink-0 w-full ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
                <button
                  onClick={() => setIsDark(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ${!isDark ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  Sáng
                </button>
                <button
                  onClick={() => setIsDark(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ${isDark ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  Tối
                </button>
              </div>

              {/* Collapsed Sáng Tối */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`flex justify-center items-center gap-2 p-2.5 neu-button text-xs font-semibold text-foreground shrink-0 w-full outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ${isSidebarCollapsed ? 'flex' : 'hidden'}`}
                title={isDark ? "Giao diện Sáng" : "Giao diện Tối"}
              >
                {isDark ? <Sun className="w-4 h-4 shrink-0 text-amber-500" /> : <Moon className="w-4 h-4 shrink-0 text-indigo-500" />}
              </button>

              <button 
                id="btn-settings"
                onClick={() => setShowConfig(!showConfig)}
                className={`flex justify-center items-center gap-2 p-2.5 neu-button text-xs font-semibold text-foreground shrink-0 w-full outline-none focus:outline-none focus-visible:outline-none focus:ring-0`}
                title="Cài đặt thông số API"
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">Cài đặt API</span>}
              </button>

              {!userToken ? (
                <button
                  id="btn-login"
                  onClick={handleOAuthLogin}
                  className={`p-2.5 text-xs font-bold flex items-center justify-center gap-2 text-white shrink-0 rounded-xl transition-all shadow-md bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus-visible:outline-none focus:ring-0 border border-transparent ${isSidebarCollapsed ? 'px-2.5' : 'px-4'}`}
                  title={isSidebarCollapsed ? "Đăng nhập" : undefined}
                >
                  <Facebook className="w-4 h-4 fill-current shrink-0 text-white" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap text-white">Đăng nhập</span>}
                </button>
              ) : (
                <button
                  id="btn-logout"
                  onClick={clearCredentials}
                  className="p-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 shrink-0 rounded-xl transition-all shadow-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
                  title={isSidebarCollapsed ? "Đăng xuất" : undefined}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-20 w-full">
          
          {/* ERROR ALERT BOX */}
          {apiError && (
            <div className="mb-3 backdrop-blur-md bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-xl flex items-start gap-3 text-rose-800 dark:text-rose-100 shadow-md shrink-0 relative z-20">
              <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <span className="font-semibold block text-[12px] text-rose-900 dark:text-rose-300">Sự cố kết nối hoặc xác thực:</span>
                <p className="mt-1 font-mono text-[10px] sm:text-[11px] opacity-80 truncate max-w-full" title={apiError}>{apiError}</p>
              </div>
            </div>
          )}

          {/* MAIN CONTAINER */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-3.5 items-stretch overflow-hidden">
        
            {/* SUB-SIDEBAR: PAGES LIST */}
            {activeTab === "posts" && (
              <aside className="w-full xl:w-[260px] 2xl:w-[280px] bg-card rounded-[20px] p-4 flex flex-col shadow-sm border border-border overflow-hidden min-h-0 xl:h-full shrink-0">
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
                    const allPageIds = pages.map(p => p.id);
                    setSelectedPageIds(allPageIds);
                    addLog("system", `Đã chọn tất cả ${pages.length} Fanpage. Đang chuẩn bị tải bài viết...`, "success");
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl text-[10px] uppercase font-bold border transition-all flex items-center justify-center gap-1 ${
                    selectedPageIds.length === pages.length
                      ? "btn-primary shadow-accent"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-border"
                  }`}
                >
                  <Check className={`w-3 h-3 stroke-[3px] ${selectedPageIds.length === pages.length ? "text-white" : ""}`} />
                  <span className={selectedPageIds.length === pages.length ? "text-white" : ""}>Chọn tất cả</span>
                </button>
                <button
                  id="btn-deselect-all-pages"
                  onClick={() => {
                    setSelectedPageIds([]);
                    addLog("system", "Đã hủy chọn toàn bộ các Fanpage.", "success");
                  }}
                  className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 rounded-xl text-[10px] uppercase font-bold transition-all text-center"
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
              {(() => {
                const query = pageSearchQuery.trim().toLowerCase();
                const filteredList = pages.filter(
                  page => page.name.toLowerCase().includes(query) || page.id.includes(query)
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Không tìm thấy Fanpage nào phù hợp
                    </div>
                  );
                }

                return filteredList.map((page) => {
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
                          <div className="w-5 h-5 bg-accent rounded-lg flex items-center justify-center shadow-accent scale-105 transition-all">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-border group-hover:border-accent/50 transition-colors"></div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}


        </aside>
        )}

        {/* MAIN POST AREA & FILTERS */}
        <main className="flex-1 w-full flex flex-col gap-3 relative z-10 overflow-hidden min-h-0 h-full">
          
          {activeTab === "posts" && (
            <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full">
              <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
              {/* TOP BAR: FILTERS CARD */}
              <section className="relative z-30 bg-card rounded-[18px] p-4 text-foreground shadow-sm border border-border shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-40">
                  {/* Left: Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto flex-wrap pb-1 sm:pb-0">
                    
                    {/* Filter: Date Range Selection / Dropdown */}
                    <div className="relative flex flex-1 sm:flex-none items-center gap-2 shrink-0" ref={timeDropdownRef}>
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-background hover:bg-muted border border-border rounded-xl transition-all h-10 w-full shadow-sm">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none shrink-0 border-r border-border pr-2">
                          Thời gian
                        </span>
                        
                        <div 
                          className="relative h-7 px-3 flex items-center justify-between gap-2 cursor-pointer min-w-[120px] hover:text-accent transition-colors"
                          onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                        >
                          <span className="text-xs font-semibold text-foreground truncate">
                            {filters.timeRangePreset === "today" && "Hôm nay"}
                            {filters.timeRangePreset === "week" && "Tuần này"}
                            {filters.timeRangePreset === "month" && "Tháng này"}
                            {filters.timeRangePreset === "year" && "Năm nay"}
                            {filters.timeRangePreset === "all" && "Tất cả"}
                            {filters.timeRangePreset === "custom" && "Tuỳ chỉnh..."}
                          </span>
                          <span className="text-muted-foreground text-[10px]">▼</span>
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
                          <div className="absolute top-[110%] left-0 right-0 z-[100] bg-card border border-border rounded-xl shadow-lg p-1.5 flex flex-col gap-1 min-w-[200px] animate-in fade-in zoom-in duration-200">
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
                                className={`text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                                  filters.timeRangePreset === preset.id 
                                    ? "btn-primary shadow-accent text-white" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 px-3 py-1.5 bg-background hover:bg-muted border border-border rounded-xl transition-all h-10 shrink-0 shadow-sm text-foreground">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 select-none shrink-0 border-r border-border pr-2">
                        Tải
                      </span>
                      <div className="flex items-center gap-1">
                        <CustomSelect
                          value={filters.maxPostsToFetch}
                          onChange={(val) => setFilters(f => ({ ...f, maxPostsToFetch: val }))}
                          options={[
                            { value: 10, label: "10" },
                            { value: 50, label: "50" },
                            { value: 100, label: "100" },
                            { value: 250, label: "250" },
                            { value: 500, label: "500" },
                            { value: 1000, label: "1000" }
                          ]}
                        />
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
            <div className="p-3 overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar bg-background/10 backdrop-blur-[24px] border border-white/20 rounded-b-[24px] shadow-sm">
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
                  <div className="w-full bg-muted border border-border rounded-full h-3 p-0.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-accent to-accent-secondary h-full rounded-full transition-all duration-300 shadow-sm"
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
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[10px] font-bold transition-all shadow-sm cursor-pointer select-none"
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
                      Để hiển thị bài đăng, vui lòng tích chọn các Fanpage. Hệ thống sẽ tự động tải tối đa <br/><span className="font-mono text-accent font-bold">{filters.maxPostsToFetch}</span> bài viết gần nhất.
                    </p>
                  </div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-2 h-full min-h-[300px] py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-sm mb-2">
                    <ListFilter className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-[13px] text-foreground">Tất cả {posts.length} bài viết hiện có đều bị bộ lọc ẩn đi</h3>
                  <p className="text-[11px] text-muted-foreground max-w-[280px]">Vui lòng tắt bớt hoặc nới lỏng các điều kiện lọc (Khoảng thời gian, Từ khóa) ở thanh công cụ phía trên.</p>
                </div>
              ) : (
                <div className="min-w-[700px] flex flex-col gap-1.5">
                  {/* Table Header */}
                  <div className="grid grid-cols-[30px_44px_1fr_135px_50px] gap-2 items-center px-1.5 pb-1.5 border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                    <div className="text-center">Chọn</div>
                    <div className="text-center">Ảnh</div>
                    <div>Nội dung bài viết</div>
                    <div className="text-center">Thời gian đăng</div>
                    <div className="text-center">Link</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1.5 pt-1">
                    {displayedPosts.map((post) => {
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
                          onClick={() => togglePostSelection(post.id)}
                          className={`group grid grid-cols-[30px_44px_1fr_135px_50px] gap-2 items-center p-2 rounded-[16px] transition-all duration-300 cursor-pointer border ${
                            isChecked 
                              ? "bg-accent/10 border-accent/40 translate-x-1 shadow-[0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md" 
                              : "bg-background/20 backdrop-blur-md border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 hover:border-white/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <div 
                              onClick={() => togglePostSelection(post.id)}
                              className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                                isChecked 
                                  ? "bg-accent text-white shadow-sm scale-105" 
                                  : "border-2 border-border group-hover:border-accent/40"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                            </div>
                          </div>

                          {/* Thumbnail Column */}
                          <div className="relative shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                            {post.full_picture ? (
                              <div className="relative rounded overflow-hidden border border-border w-[38px] h-[38px] bg-muted shadow-sm">
                                <img 
                                  src={post.full_picture} 
                                  alt="Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
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
                            </div>
                            
                            <p className="text-foreground text-[11px] font-medium leading-tight line-clamp-2 break-all" title={post.message || ""}>
                              {post.message ? (
                                post.message
                              ) : (
                                <span className="italic text-muted-foreground/60 font-normal">[Đa phương tiện - Không có văn bản]</span>
                              )}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="text-center flex flex-col gap-0.5 shrink-0 select-none">
                            <span className="text-[10px] font-mono font-medium text-foreground/80">{formattedDate}</span>
                            <span className="text-[9px] text-muted-foreground/70 font-mono">({diffDays} ngày trước)</span>
                          </div>

                          {/* Action Button Link to Facebook */}
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            {post.permalink_url ? (
                              <a 
                                href={post.permalink_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] text-blue-500 font-bold hover:text-blue-600 hover:underline flex items-center justify-center p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
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
                
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-[2px] border border-border shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-accent to-accent-secondary h-full rounded-full transition-all duration-300 shadow-sm"
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
                    onClick={fetchPostsFromSelectedPages}
                    disabled={selectedPageIds.length === 0 || loadingPosts}
                    className="flex-1 py-2 btn-primary rounded-xl font-bold text-[9px] xl:text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer select-none active:scale-95 shadow-md"
                  >
                    <RotateCw className={`w-3.5 h-3.5 shrink-0 ${loadingPosts ? "animate-spin" : ""}`} />
                    Tải bài viết
                  </button>

                  <button 
                    id="btn-delete-trigger"
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedPostIds.length === 0 || isDeleting}
                    className={`flex-1 py-2 rounded-xl font-bold text-[9px] xl:text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 disabled:pointer-events-none cursor-pointer select-none active:scale-95 shadow-md border ${
                      selectedPostIds.length > 0 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 shadow-sm' 
                        : 'bg-muted text-muted-foreground border-transparent opacity-60'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    Xóa bài viết
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
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-transparent text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-rose-500/20"
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
                        className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-transparent text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-orange-500/20"
                      >
                        Dừng nạp
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2 text-rose-600">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[10px] font-medium leading-relaxed">
                  <span className="font-bold text-rose-600 uppercase block mb-0.5">Lưu ý:</span>
                  Xóa bài viết là VĨNH VIỄN.
                </div>
              </div>
            </div>

            {/* LIVE LOG CONSOLE TERMINAL */}
            <div className="flex-1 flex flex-col bg-muted/30 rounded-xl p-3 shadow-inner min-h-[150px] overflow-hidden border border-border">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2 shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-accent font-extrabold font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                  Logs
                </span>
                <button 
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] hover:underline text-muted-foreground hover:text-foreground font-bold"
                >
                  Xóa
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-accent p-1 custom-scrollbar pr-1.5"
              >
                {logs.length === 0 ? (
                  <p className="text-muted-foreground/50 italic">Chưa có nhật ký...</p>
                ) : (
                  logs.map((log) => {
                    let colorClass = "text-muted-foreground";
                    let prefix = "•";

                    if (log.status === "success") {
                      colorClass = "text-emerald-600 font-semibold";
                      prefix = "✔";
                    } else if (log.status === "failed") {
                       colorClass = "text-rose-600 font-bold";
                       prefix = "✘ LỖI";
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
                  })
                )}
              </div>
            </div>
          </aside>
          </div>
          )}

          {activeTab === "status" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageStatusTab pages={pages} userToken={userToken} />
            </div>
          )}

          {activeTab === "admins" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageAdminsTab pages={pages} userToken={userToken} />
            </div>
          )}

          {activeTab === "theme" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ThemeSettingsTab isDark={isDark} setIsDark={setIsDark} config={config} setConfig={setConfig} />
            </div>
          )}

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
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-sm transform -rotate-6">
              <Trash2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">
              Xác nhận hủy hoại vĩnh viễn?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              Bạn đang chuẩn bị tiến hành xóa hàng loạt <b className="text-rose-600 font-mono text-sm bg-rose-50 px-1.5 py-0.5 rounded shadow-sm">{selectedPostIds.length} bài đăng</b> khỏi các Fanpage. Hành động này sẽ triệt tiêu vĩnh viễn toàn bộ lượt Thích, Bình luận, và Chia sẻ đi kèm.
            </p>

            {/* Checkbox safety safeguard constraint (confirm=true requirement) */}
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-[20px] text-left mb-6 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div 
                  onClick={() => setDoubleConfirm(!doubleConfirm)}
                  className={`mt-0.5 w-5 h-5 rounded-[6px] flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
                    doubleConfirm 
                      ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20 scale-105" 
                      : "border-border hover:border-rose-300 bg-background"
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
                <div className="text-[12px] text-rose-700 leading-relaxed font-semibold">
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
                className="flex-1 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-bold text-[13px] transition-all border border-border shadow-sm"
              >
                Hủy bỏ
              </button>
              
              <button 
                id="btn-confirm-delete"
                onClick={executeBatchDeletion}
                disabled={!doubleConfirm}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-[13px] shadow-md shadow-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
