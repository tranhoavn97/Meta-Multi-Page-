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
  Briefcase
} from "lucide-react";
import { FacebookPage, FacebookPost, FilterCriteria, DeletionLog } from "./types";
// @ts-ignore
import bgImage from "./assets/images/cosmic_swirl_bg_1781941929717.jpg";
import { safeFetchJson } from "./utils/safeFetchJson";
import { useToast } from "./components/Toast";
import PageStatusTab from "./components/PageStatusTab";
import PageAdminsTab from "./components/PageAdminsTab";

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
        className="relative flex items-center justify-between w-full h-9 bg-slate-900/90 hover:bg-slate-950 border border-slate-700/60 disabled:border-slate-800 hover:border-blue-500 focus:border-blue-500 rounded-xl px-3 text-xs text-left text-white disabled:opacity-35 cursor-pointer font-bold select-none transition-all shadow-sm"
      >
        <span className={`${value ? "text-white" : "text-white/40"} font-semibold font-mono`}>
          {displayValue()}
        </span>
        <Calendar className="w-3.5 h-3.5 text-white/50 ml-1 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[99] w-[270px] bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white select-none transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-xs font-bold tracking-wide">
              {vietnameseMonths[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-slate-400 mt-2 font-mono">
            {["H", "B", "T", "N", "S", "B", "C"].map((d, idx) => (
              <span key={idx} className={idx >= 5 ? "text-rose-400 font-extrabold" : ""}>{d}</span>
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
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30 scale-105"
                      : isToday
                      ? "bg-white/10 text-blue-400 ring-1 ring-blue-500/30 font-extrabold"
                      : isCurrentMonth
                      ? "text-white hover:bg-white/10"
                      : "text-white/20 hover:bg-white/5"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
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
        className="flex items-center justify-between gap-1 bg-slate-900/90 hover:bg-slate-950 border border-slate-700/60 hover:border-blue-500 focus:border-blue-500 rounded-xl px-2.5 h-9 text-xs outline-none text-white font-bold cursor-pointer transition-all select-none min-w-[70px] shadow-sm"
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3 h-3 text-white/55 transition-transform duration-200 ${isOpen ? "rotate-90 text-blue-400" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-[99] w-[115px] bg-slate-950 border border-slate-700/80 rounded-xl shadow-2xl p-1 overflow-hidden transition-all">
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
                  ? "bg-blue-600 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
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

export default function App() {
  const toast = useToast();
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
  });

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
  const [activeTab, setActiveTab] = useState<"posts" | "status" | "admins">("posts");

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
    <div className="relative h-screen min-h-screen lg:min-h-0 bg-[#030a16] text-slate-100 flex flex-col select-none overflow-hidden">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <img 
          src={bgImage} 
          alt="Cosmic backdrop" 
          className="w-full h-full object-cover scale-[1.03] blur-[6px] opacity-75 brightness-[0.38]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030a16]/40 to-[#030a16]/95" />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col p-3 md:p-4 overflow-hidden min-h-0 flex-1">
      
      {/* HEADER BAR */}
      <header className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 mb-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0">
            <Facebook className="w-5.5 h-5.5 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2 leading-tight">
              Meta Page Manager
            </h1>
            <p className="text-[11px] text-white/70 pt-[2px]">Phát triển bởi Hoà Trần.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Info */}
          {userToken ? (
            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-inner">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Đã kết nối Facebook
            </span>
          ) : (
            <span className="bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
              Yêu cầu đăng nhập Meta
            </span>
          )}

          {/* Access Token Quick settings Trigger */}
          <button 
            id="btn-settings"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold border border-white/25 transition-all"
            title="Cài đặt thông số API nâng cao"
          >
            <Settings className="w-4 h-4" />
            Cài đặt API
          </button>

          {/* Connect / OAuth Action */}
          {!userToken ? (
            <button
              id="btn-login"
              onClick={handleOAuthLogin}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-900/30 border border-blue-500/30 transition-all flex items-center gap-1.5"
            >
              <Facebook className="w-3.5 h-3.5 fill-current" />
              Đăng nhập Meta
            </button>
          ) : (
            <button
              id="btn-logout"
              onClick={clearCredentials}
              className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          )}
        </div>
      </header>

      {/* ERROR ALERT BOX */}
      {apiError && (
        <div className="mb-2.5 bg-rose-500/20 border border-rose-500/40 backdrop-blur-md p-2.5 rounded-2xl flex items-start gap-2.5 text-rose-100 shadow-md shrink-0">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <span className="font-semibold block text-[11px]">Sự cố kết nối hoặc xác thực:</span>
            <p className="mt-0.5 font-mono text-[10px] opacity-90 truncate max-w-full" title={apiError}>{apiError}</p>
          </div>
        </div>
      )}

      {/* 3 MAIN PAGES NAVIGATION */}
      <nav className="relative z-30 bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-1.5 flex flex-col md:flex-row items-stretch md:items-center gap-2 shrink-0 mb-3.5 shadow-xl">
        <button
          id="tab-posts"
          type="button"
          onClick={() => {
            setActiveTab("posts");
            addLog("system", "Chuyển sang trang: Quản lý bài viết", "success");
          }}
          className={`flex-1 flex items-center justify-center gap-3.5 px-6 py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "posts"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/80 scale-[1.01]"
              : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <FileText className={`w-5.5 h-5.5 ${activeTab === "posts" ? "text-white animate-pulse" : "text-slate-400"}`} />
          <div className="text-left select-none">
            <span className="block text-sm font-black tracking-wide">Quản lý bài viết</span>
            <span className="block text-[11px] opacity-80 font-normal">Quét bài đăng & Xoá hàng loạt</span>
          </div>
        </button>

        <button
          id="tab-status"
          type="button"
          onClick={() => {
            setActiveTab("status");
            addLog("system", "Chuyển sang trang: Trạng thái Fanpage", "success");
          }}
          className={`flex-1 flex items-center justify-center gap-3.5 px-6 py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "status"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/80 scale-[1.01]"
              : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <Activity className={`w-5.5 h-5.5 ${activeTab === "status" ? "text-white animate-pulse" : "text-slate-400"}`} />
          <div className="text-left select-none">
            <span className="block text-sm font-black tracking-wide font-sans">Trạng thái Fanpage</span>
            <span className="block text-[11px] opacity-80 font-normal font-sans">Kiểm tra kết nối & Quyền hạn</span>
          </div>
        </button>

        <button
          id="tab-admins"
          type="button"
          onClick={() => {
            setActiveTab("admins");
            addLog("system", "Chuyển sang trang: Quản trị viên Fanpage", "success");
          }}
          className={`flex-1 flex items-center justify-center gap-3.5 px-6 py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "admins"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/80 scale-[1.01]"
              : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <Users className={`w-5.5 h-5.5 ${activeTab === "admins" ? "text-white animate-pulse" : "text-slate-400"}`} />
          <div className="text-left select-none">
            <span className="block text-sm font-black tracking-wide font-sans">Quản trị viên Fanpage</span>
            <span className="block text-[11px] opacity-80 font-normal font-sans">Phân tích Business Manager & Admins</span>
          </div>
        </button>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch overflow-hidden">
        
        {/* SIDEBAR: PAGES LIST (Col Span 2) */}
        {activeTab === "posts" && (
          <aside className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 flex flex-col shadow-xl overflow-hidden min-h-0 h-full">
          <div className="flex flex-col gap-2.5 mb-4 pb-3 border-b border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-white/70 font-extrabold flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Danh sách Pages ({pages.length})
              </span>
              {userToken && (
                <button 
                  id="btn-refresh-pages"
                  onClick={() => fetchPages()} 
                  title="Tải lại danh sách Fanpage" 
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
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
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] uppercase font-bold border transition-all flex items-center justify-center gap-1 ${
                    selectedPageIds.length === pages.length
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3px]" />
                  Chọn tất cả
                </button>
                <button
                  id="btn-deselect-all-pages"
                  onClick={() => {
                    setSelectedPageIds([]);
                    addLog("system", "Đã hủy chọn toàn bộ các Fanpage.", "success");
                  }}
                  className="flex-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/10 hover:border-rose-500/20 rounded-xl text-[10px] uppercase font-bold transition-all text-center"
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
                    className="w-full bg-[#05111d]/50 hover:bg-[#071728]/70 border border-white/15 hover:border-emerald-500/50 rounded-xl pl-8 pr-8 py-1.5 text-[11px] text-white placeholder-white/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all outline-none"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  {pageSearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setPageSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Count of selected pages under the search bar */}
                <div className="flex items-center justify-between text-[11px] px-1 select-none">
                  <span className="text-white/50 font-medium">Đã chọn:</span>
                  <span className="bg-emerald-500/15 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm font-mono text-[10px]">
                    {selectedPageIds.length} / {pages.length} Fanpages
                  </span>
                </div>
              </div>
            )}
          </div>

          {!userToken ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-black/10 rounded-2xl border border-dashed border-white/15">
              <Facebook className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-xs text-white/70 leading-relaxed">
                Vui lòng kết nối tài khoản Facebook để quét Fanpage quản lý.
              </p>
              <button
                id="btn-sidebar-login"
                onClick={handleOAuthLogin}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-xl text-xs font-bold transition-all"
              >
                Nhấn Thử Đăng nhập
              </button>
            </div>
          ) : loadingPages ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/50 mt-3">Đang kết nối Facebook...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <Info className="w-8 h-8 text-white/30 mb-2" />
              <p className="text-xs text-white/60">Không tìm thấy Account Fanpage nào trong mã thông báo này.</p>
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
                    <div className="text-center py-8 text-white/40 text-xs">
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
                      className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected 
                          ? "bg-white/15 border-white/30 shadow-md" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <img 
                        src={picUrl} 
                        alt="" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${page.id}`;
                        }}
                        className="w-8.5 h-8.5 rounded-full bg-indigo-500 shadow-inner flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-white leading-tight">{page.name}</p>
                        <p className="text-[9px] text-white/40 truncate font-mono mt-0.5">ID: {page.id}</p>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-4.5 h-4.5 bg-emerald-500 rounded-lg flex items-center justify-center border border-emerald-400 shadow-md shadow-emerald-500/20 scale-105 transition-all">
                            <Check className="w-3 h-3 text-white stroke-[3px]" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-lg border border-white/30 hover:border-white/50 transition-colors"></div>
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

        {/* MAIN POST AREA & FILTERS (Col Span 10) */}
        <main className={`${activeTab === "posts" ? "lg:col-span-10" : "lg:col-span-12"} flex flex-col gap-3 relative z-10 overflow-hidden min-h-0 h-full`}>
          
          {activeTab === "posts" && (
            <>
              {/* TOP BAR: FILTERS CARD */}
              <section className="relative z-30 bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4.5 text-slate-100 shadow-2xl flex flex-col gap-3.5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-black tracking-wider uppercase text-slate-100 flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-blue-400" />
                    Bộ lọc bài viết & Thống kê
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      id="preset-all-time"
                      type="button"
                      onClick={() => {
                        setFilters(f => ({
                          ...f,
                          enableOlderThan: false,
                          enableDateRange: false
                        }));
                        addLog("system", "Hủy bộ lọc thời gian - Hiển thị tối đa bài đăng từ trước đến nay.", "success");
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[11px] uppercase font-extrabold tracking-wide transition-all ${
                        !filters.enableOlderThan && !filters.enableDateRange
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500" 
                          : "bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-transparent"
                      }`}
                    >
                      Từ trước đến nay
                    </button>
                    <button 
                      id="preset-30-days"
                      type="button"
                      onClick={() => setPresetOlderThan(30)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] uppercase font-extrabold tracking-wide transition-all ${
                        filters.enableOlderThan && filters.olderThanDays === 30 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500" 
                          : "bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-transparent"
                      }`}
                    >
                      &gt; 30 ngày
                    </button>
                    <button 
                      id="preset-90-days"
                      type="button"
                      onClick={() => setPresetOlderThan(90)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] uppercase font-extrabold tracking-wide transition-all ${
                        filters.enableOlderThan && filters.olderThanDays === 90 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500" 
                          : "bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-transparent"
                      }`}
                    >
                      &gt; 90 ngày
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative z-40 w-full text-slate-100">
                  
                  {/* Filter: Older Than X days */}
                  <div className="col-span-1 sm:col-span-6 lg:col-span-3 flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-700/60 rounded-xl transition-all min-h-[44px] h-auto w-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer select-none">
                      <div 
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                          filters.enableOlderThan 
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                            : "border-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {filters.enableOlderThan && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <input 
                        type="checkbox" 
                        id="chk-filter-older"
                        checked={filters.enableOlderThan}
                        onChange={(e) => setFilters(f => ({ ...f, enableOlderThan: e.target.checked }))}
                        className="sr-only"
                      />
                      <span>Cũ hơn:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        id="input-older-days"
                        min="1"
                        value={filters.olderThanDays}
                        disabled={!filters.enableOlderThan}
                        onChange={(e) => setFilters(f => ({ ...f, olderThanDays: parseInt(e.target.value) || 0 }))}
                        className="bg-slate-950 border border-slate-700/80 rounded-xl px-2 h-8 text-xs font-mono outline-none text-white w-14 text-center font-bold disabled:opacity-30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 transition-all"
                      />
                      <span className="text-[11px] text-slate-400 font-bold">ngày</span>
                    </div>
                  </div>

                  {/* Filter: Keyword Search */}
                  <div className="col-span-1 sm:col-span-6 lg:col-span-3 flex items-center gap-2 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-700/60 rounded-xl transition-all min-h-[44px] h-auto w-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer select-none shrink-0">
                      <div 
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                          filters.enableKeyword 
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                            : "border-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {filters.enableKeyword && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <input 
                        type="checkbox" 
                        id="chk-filter-keyword"
                        checked={filters.enableKeyword}
                        onChange={(e) => setFilters(f => ({ ...f, enableKeyword: e.target.checked }))}
                        className="sr-only"
                      />
                      <span>Từ khóa:</span>
                    </label>
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        id="input-keyword"
                        value={keywordInput}
                        disabled={!filters.enableKeyword}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Tìm theo nội dung..." 
                        className="bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-2 h-8 text-xs outline-none text-white w-full disabled:opacity-30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 transition-all font-medium"
                      />
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Filter: Date Range Selection */}
                  <div className="col-span-1 sm:col-span-6 lg:col-span-4 flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-700/60 rounded-xl transition-all min-h-[44px] h-auto w-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer select-none shrink-0">
                      <div 
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                          filters.enableDateRange 
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                            : "border-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {filters.enableDateRange && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <input 
                        type="checkbox" 
                        id="chk-filter-range"
                        checked={filters.enableDateRange}
                        onChange={(e) => setFilters(f => ({ ...f, enableDateRange: e.target.checked }))}
                        className="sr-only"
                      />
                      <span>Khoảng:</span>
                    </label>
                    <div className="flex items-center gap-1.5 leading-none shrink-0">
                      <span className="text-[11px] text-slate-400 font-bold">Từ</span>
                      <div className="w-[85px] sm:w-[95px]">
                        <CustomDatePicker
                          value={filters.dateFrom}
                          disabled={!filters.enableDateRange}
                          onChange={(val) => setFilters(f => ({ ...f, dateFrom: val }))}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">đến</span>
                      <div className="w-[85px] sm:w-[95px]">
                        <CustomDatePicker
                          value={filters.dateTo}
                          disabled={!filters.enableDateRange}
                          onChange={(val) => setFilters(f => ({ ...f, dateTo: val }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter: Max Limits config */}
                  <div className="col-span-1 sm:col-span-6 lg:col-span-2 flex items-center justify-between gap-1 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-700/60 rounded-xl transition-all min-h-[44px] h-auto w-full">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1 select-none shrink-0">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Lọc:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Tải</span>
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

                </div>

                {/* SELECTION CONTROL & RUN BUTTON WORKSPACE */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-3.5 border-t border-slate-800">
                  
                  {/* Compact Stats Badges inside Footer of Filters Card */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 select-none font-medium text-slate-200 shadow-inner">
                    {/* Stat 1: Selection */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold uppercase tracking-wider text-emerald-400">Đã chọn:</span>
                      <span className="font-mono font-black text-emerald-300 text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">{selectedPostIds.length}</span>
                      <span className="text-slate-400">/ {displayedPosts.length} hiển thị</span>
                    </div>

                    <span className="w-px h-5 bg-slate-800 hidden md:inline-block" />

                    {/* Stat 2: Total dynamic matches */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold uppercase tracking-wider text-blue-400 font-sans">Khớp bộ lọc:</span>
                      <span className="font-mono font-black text-blue-300 text-sm bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/25">{filteredPosts.length}</span>
                      <span className="text-slate-400">bài</span>
                    </div>

                    <span className="w-px h-5 bg-slate-800 hidden md:inline-block" />

                    {/* Stat 3: Total cached posts in session */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold uppercase tracking-wider text-purple-400 font-sans">Tổng nạp:</span>
                      <span className="font-mono font-black text-purple-300 text-sm bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25">{posts.length}</span>
                    </div>

                    <span className="w-px h-5 bg-slate-800 hidden md:inline-block" />

                    {/* Stat 4: Deleted Count */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold uppercase tracking-wider text-rose-400 font-sans">Đã xóa:</span>
                      <span className="font-mono font-black text-rose-300 text-sm bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded leading-none">{deletedCountSession}</span>
                    </div>
                  </div>

                  {/* Action Trigger Buttons - SIGNIFICANTLY INCREASED ACTION SIZES */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
                    <button
                      id="btn-load-posts"
                      type="button"
                      onClick={fetchPostsFromSelectedPages}
                      disabled={selectedPageIds.length === 0 || loadingPosts}
                      className="px-6 py-3.5 h-12 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 hover:border-slate-500 text-white rounded-xl font-black text-xs md:text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer select-none active:scale-95 shadow-md"
                    >
                      <RotateCw className={`w-4 h-4 text-blue-300 ${loadingPosts ? "animate-spin" : ""}`} />
                      Tải lại bài viết
                    </button>

                    <button 
                      id="btn-delete-trigger"
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={selectedPostIds.length === 0 || isDeleting}
                      className="px-8 py-3.5 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs md:text-sm tracking-widest uppercase shadow-lg shadow-rose-900/30 hover:shadow-rose-900/40 border border-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none active:scale-95"
                    >
                      <Trash2 className="w-4.5 h-4.5 text-rose-100" />
                      Xóa bài viết đã chọn
                    </button>
                  </div>
                </div>

              </section>

          {/* POSTS SCREEN CONTAINER */}
          <section className="relative z-10 flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
            {/* Table/List Header */}
            <div className="px-4 py-2.5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-300" />
                  Danh sách bài viết từ các Page đã chọn
                </span>
              </div>
              
              {posts.length > 0 && (
                <div 
                  id="btn-toggle-select-all"
                  onClick={selectAllFiltered}
                  className="flex items-center gap-2 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/15 cursor-pointer select-none transition-all"
                >
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id))
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20" 
                        : "border-white/30 hover:border-white/50"
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
            <div className="p-3 overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar">
              {loadingPosts ? (
                <div className="flex flex-col justify-center items-center gap-4 text-white h-full min-h-[300px] py-6 max-w-md mx-auto">
                  {/* Circular Spinner & Big Icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 border-4 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin"></div>
                    <Facebook className="w-6 h-6 text-emerald-400 absolute fill-current animate-pulse" />
                  </div>

                  {/* Progress Info Header */}
                  <div className="text-center space-y-0.5">
                    <h3 className="font-bold text-xs tracking-wide text-white/95 uppercase">ĐANG QUÉT FANPAGE HÀNG LOẠT</h3>
                    <p className="text-[11px] text-white/65">
                      Tiến trình: <span className="text-emerald-400 font-mono font-bold">{scanProgress.current}/{scanProgress.total}</span> Fanpage hoàn thành
                    </p>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-3 p-0.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-md shadow-emerald-500/20"
                      style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Current Active Page Name & Detail badge */}
                  <div className="flex flex-col items-center gap-1 w-full animate-pulse">
                    <span className="text-[9px] uppercase font-semibold text-white/40 tracking-wider">Đang kiểm tra & đọc bài viết:</span>
                    <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-3 py-1 text-[11px] text-emerald-300 font-bold max-w-full truncate shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
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
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/35 text-rose-300 hover:text-rose-200 text-[10px] font-semibold transition-all shadow-sm cursor-pointer select-none"
                  >
                    <XOctagon className="w-3 h-3 shrink-0" />
                    Dừng quét ngay
                  </button>

                  {/* Secondary info label */}
                  <p className="text-[10px] text-white/35 text-center italic leading-normal">
                    Hệ thống thu thập dữ liệu về bài viết, tổng hợp lượt thích, bình luận và chia sẻ từ API chính thức của Meta.
                  </p>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-3 h-full min-h-[300px] py-8">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <Facebook className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs">Chưa có bài viết nào</h3>
                    <p className="text-[11px] text-white/50 mt-0.5 max-w-xs mx-auto leading-relaxed">
                      Để hiển thị bài đăng, vui lòng tích chọn các Fanpage bên trái. Sau đó hệ thống sẽ tự động quét tối đa {filters.maxPostsToFetch} bài viết gần nhất.
                    </p>
                  </div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-2 h-full min-h-[300px] py-8">
                  <ListFilter className="w-9 h-9 text-white/20" />
                  <p className="text-xs text-white/60 font-semibold">Tất cả {posts.length} bài viết hiện có đều bị bộ lọc ẩn đi.</p>
                  <p className="text-[10px] text-white/40">Vui lòng tắt bớt các điều kiện lọc (Khoảng ngày, Từ khóa, Số ngày) để kiểm tra.</p>
                </div>
              ) : (
                <div className="min-w-[700px] flex flex-col gap-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_54px_1fr_145px_70px] gap-3 items-center px-2.5 pb-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/45 select-none">
                    <div className="text-center">Chọn</div>
                    <div>Ảnh</div>
                    <div>Nội dung bài viết</div>
                    <div className="text-center">Thời gian đăng</div>
                    <div className="text-center">FB Link</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-2 pt-1.5">
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
                          className={`group grid grid-cols-[40px_54px_1fr_145px_70px] gap-3 items-center p-2.5 rounded-xl transition-all cursor-pointer border border-white/5 shadow-sm ${
                            isChecked 
                              ? "bg-white/15 border-white/30 translate-x-0.5" 
                              : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <div 
                              onClick={() => togglePostSelection(post.id)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${
                                isChecked 
                                  ? "bg-emerald-500 border-emerald-400 text-white shadow shadow-emerald-500/20 scale-105" 
                                  : "border-white/30 hover:border-white/50"
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                            </div>
                          </div>

                          {/* Thumbnail Column */}
                          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                            {post.full_picture ? (
                              <div className="relative rounded-lg overflow-hidden border border-white/15 w-[44px] h-[44px] bg-black/40">
                                <img 
                                  src={post.full_picture} 
                                  alt="Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Video Play icon attachment overlay */}
                                {post.status_type === "added_video" && (
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Play className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-white/10 bg-white/5 w-[44px] h-[44px] flex items-center justify-center text-white/30">
                                <Facebook className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex flex-col gap-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-emerald-400/20 truncate max-w-[140px]" title={post.pageName}>
                                {post.pageName}
                              </span>
                              <span className="text-[9px] text-white/40 font-mono select-all">
                                ID: {post.id}
                              </span>
                            </div>
                            
                            <p className="text-white/95 text-[11px] leading-snug line-clamp-2 break-all" title={post.message || ""}>
                              {post.message ? (
                                post.message
                              ) : (
                                <span className="italic text-white/30">[Đa phương tiện - Không có văn bản]</span>
                              )}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="text-center flex flex-col gap-0.5 shrink-0 select-none">
                            <span className="text-[11px] font-mono text-white/85">{formattedDate}</span>
                            <span className="text-[9px] text-white/40 font-mono">({diffDays} ngày trước)</span>
                          </div>

                          {/* Action Button Link to Facebook */}
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            {post.permalink_url ? (
                              <a 
                                href={post.permalink_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] text-indigo-300 font-bold hover:text-indigo-200 hover:underline flex items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Mở
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-white/20 text-[10px] italic">-</span>
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

          {/* LOWER SECTION: BATCH ACTION LOGGER AND FOOTER LOGS */}
          <footer className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-905 border border-slate-700/60 rounded-2xl p-4.5 shadow-2xl shrink-0">
            {/* PROGRESS BAR PANEL (Col Span 4) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-3 min-h-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs uppercase font-extrabold text-slate-300">
                  <span>Tiến trình tác vụ {loadingPosts ? "(Tải bài viết)" : "(Xoá bài viết)"}</span>
                  <span className="font-mono text-blue-400 text-sm bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded">
                    {loadingPosts 
                      ? (scanProgress.total > 0 ? `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` : "0%")
                      : (progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%")
                    }
                  </span>
                </div>
                
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(96,165,250,0.5)]"
                    style={{ width: `${loadingPosts 
                      ? (scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0)
                      : (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-200">
                    {loadingPosts ? (
                      <>Thực hiện: <span className="font-mono text-sm text-indigo-300 font-black">{scanProgress.current}</span> / <span className="font-mono text-sm text-slate-400 font-bold">{scanProgress.total}</span> trang.</>
                    ) : (
                      <>Thực hiện: <span className="font-mono text-sm text-indigo-300 font-black">{progress.current}</span> / <span className="font-mono text-sm text-slate-400 font-bold">{progress.total}</span> bài viết.</>
                    )}
                  </span>

                  {isDeleting && (
                    <button
                      id="btn-stop-deletion"
                      type="button"
                      onClick={() => {
                        deleteCancelledRef.current = true;
                        addLog("queue", "Yêu cầu dừng tiến trình xóa bài viết...", "pending");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/30 text-[10px] font-black tracking-widest uppercase transition-all shrink-0 cursor-pointer animate-pulse shadow-md shadow-rose-900/30"
                      title="Click để dừng tiến trình xóa ngay lập tức"
                    >
                      Dừng xóa bài
                    </button>
                  )}
                  {loadingPosts && (
                    <button
                      type="button"
                      onClick={() => {
                        scanCancelledRef.current = true;
                        addLog("system", "Đang gửi yêu cầu dừng quét trang...", "pending");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white border border-orange-500/30 text-[10px] font-black tracking-widest uppercase transition-all shrink-0 cursor-pointer animate-pulse shadow-md shadow-orange-900/30"
                    >
                      Dừng nạp bài
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-200 font-semibold leading-relaxed">
                  <span className="font-black text-rose-100 block uppercase tracking-wide">CẢNH BÁO QUAN TRỌNG:</span>
                  Hành động xóa bài viết là VĨNH VIỄN và phản hồi API trực tiếp tới Meta. Không thể khôi phục sau khi xóa.
                </div>
              </div>
            </div>

            {/* LIVE LOG CONSOLE TERMINAL (Col Span 7) */}
            <div className="md:col-span-7 flex flex-col bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1.5 shrink-0">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  &gt;_ Nhật ký tác vụ thời gian thực
                </span>
                <button 
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-xs hover:underline text-slate-400 hover:text-white font-bold"
                >
                  Xóa Nhật ký
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="overflow-y-auto h-[78px] max-h-[78px] space-y-1.5 font-mono text-[10px] text-emerald-300 custom-scrollbar pr-1"
              >
                {logs.length === 0 ? (
                  <p className="text-white/30 italic">Chưa có nhật ký hoạt động nào...</p>
                ) : (
                  logs.map((log) => {
                    let colorClass = "text-white/60";
                    let prefix = "•";

                    if (log.status === "success") {
                      colorClass = "text-emerald-400 font-medium";
                      prefix = "✔";
                    } else if (log.status === "failed") {
                      colorClass = "text-rose-400 font-bold";
                      prefix = "✘ [LỖI]";
                    } else if (log.status === "processing") {
                      colorClass = "text-yellow-300 animate-pulse";
                      prefix = "➜";
                    } else if (log.status === "pending") {
                      colorClass = "text-blue-300";
                      prefix = "⏱";
                    }

                    return (
                      <p key={log.id} className={colorClass}>
                        [{log.timestamp}] {prefix} {log.postMessageSnippet}
                      </p>
                    );
                  })
                )}
              </div>
            </div>
          </footer>
          </>
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

        </main>
      </div>

      {/* MODAL 1: APP SETTINGS PANEL MODAL (Interactive Configuration override) */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/20 p-6 rounded-[32px] shadow-2xl w-full max-w-[500px]">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Cài đặt Meta API & Credentials
              </h2>
              <button 
                id="btn-close-settings"
                onClick={() => setShowConfig(false)}
                className="text-white/50 hover:text-white bg-white/10 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4 p-3 bg-indigo-950/40 border border-indigo-500/25 rounded-2xl">
              Hệ thống sử dụng Meta Graph API để phân tích. Bạn có thể tự mình cấu hình Meta App ID / Secret do bạn tạo để dùng riêng tư hoặc điền trực tiếp User Access Token.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">Mốt tự bảo mật: Meta App ID</label>
                <input 
                  type="text" 
                  id="config-app-id"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Điền Meta App ID (ví dụ: 89431872124...)"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 bg-slate-950/50 text-white font-mono py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">Meta App Secret</label>
                <input 
                  type="password" 
                  id="config-app-secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Điền Meta App Secret"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 bg-slate-950/50 text-white font-mono py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Nhập trực tiếp Facebook User Token (GHI ĐÈ)
                </label>
                <textarea 
                  id="config-user-token"
                  rows={3}
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value)}
                  placeholder="Mã Access Token EAAB... (Lấy nhanh từ Trình rà lỗi Meta Graph API Explorer)"
                  className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <span className="text-[10px] text-white/40 block mt-1">
                  Cách này giúp bạn chạy trực tiếp mà không cần cấu hình nút OAuth qua cổng máy chủ trung gian.
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-3 border-t border-white/10">
              <button 
                id="btn-save-settings"
                onClick={saveCredentials}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (Surgical Confirmation Overlays) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950/95 border border-rose-500/30 p-6 md:p-8 rounded-[40px] shadow-2xl w-full max-w-[480px] text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/50">
              <Trash2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-2">
              Xác nhận hủy hoại vĩnh viễn?
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Bạn đang chuẩn bị tiến hành xóa hàng loạt <b className="text-rose-400 font-mono text-base">{selectedPostIds.length} bài đăng</b> khỏi các Facebook Fanpages quản trị tương ứng. Hành động này sẽ triệt tiêu vĩnh viễn toàn bộ lượt Thích, Bình luận, và Chia sẻ đi kèm.
            </p>

            {/* Checkbox safety safeguard constraint (confirm=true requirement) */}
            <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl text-left mb-6">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div 
                  onClick={() => setDoubleConfirm(!doubleConfirm)}
                  className={`mt-0.5 w-[18px] h-[18px] rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                    doubleConfirm 
                      ? "bg-rose-500 border-rose-400 text-white shadow shadow-rose-500/20 scale-105" 
                      : "border-white/30 hover:border-white/50 bg-black/20"
                  }`}
                >
                  {doubleConfirm && <Check className="w-3 h-3 stroke-[3px]" />}
                </div>
                <input 
                  type="checkbox" 
                  id="chk-double-confirm"
                  checked={doubleConfirm}
                  onChange={(e) => setDoubleConfirm(e.target.checked)}
                  className="sr-only"
                />
                <div className="text-xs text-rose-200 leading-normal font-semibold">
                  <span>Tôi hiểu đây là lựa chọn một chiều, vĩnh viễn và đồng ý xóa các bài viết đã tích.</span>
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
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-2xl font-bold text-xs transition-all border border-white/10"
              >
                Hủy bỏ
              </button>
              
              <button 
                id="btn-confirm-delete"
                onClick={executeBatchDeletion}
                disabled={!doubleConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Xác nhận bắt đầu xóa
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
