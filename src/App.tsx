import { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";
import { FacebookPage, FacebookPost, FilterCriteria, DeletionLog } from "./types";

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
        className="relative flex items-center justify-between w-full h-[30px] bg-[#05111d]/60 hover:bg-[#071728]/80 border border-white/20 disabled:border-white/10 hover:border-emerald-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl px-2.5 py-1 text-[11px] text-left text-white disabled:opacity-35 cursor-pointer font-medium select-none transition-all"
      >
        <span className={`${value ? "text-white" : "text-white/40"} font-mono`}>
          {displayValue()}
        </span>
        <Calendar className="w-3.5 h-3.5 text-white/50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[99] w-[260px] bg-[#092233] border border-white/25 rounded-2xl shadow-2xl p-3.5 text-white select-none transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-xs font-bold tracking-wide">
              {vietnameseMonths[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-white/40 mt-2 font-mono">
            {["H", "B", "T", "N", "S", "B", "C"].map((d, idx) => (
              <span key={idx} className={idx >= 5 ? "text-rose-400/70" : ""}>{d}</span>
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
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-105"
                      : isToday
                      ? "bg-white/10 text-emerald-300 ring-1 ring-emerald-400/30 font-extrabold"
                      : isCurrentMonth
                      ? "text-white hover:bg-white/10"
                      : "text-white/25 hover:bg-white/5"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5 text-[10px] font-bold">
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
              className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
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
        className="flex items-center justify-between gap-1.5 bg-[#05111d]/60 hover:bg-[#071728]/80 border border-white/20 hover:border-emerald-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl px-3 py-1 text-[11px] outline-none text-white font-bold cursor-pointer transition-all select-none min-w-[95px]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-white/55 transition-transform duration-200 ${isOpen ? "rotate-90 text-emerald-400" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-[99] w-[115px] bg-[#092233] border border-white/25 rounded-xl shadow-2xl p-1 overflow-hidden transition-all">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-emerald-600 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3 h-3 text-white stroke-[3.5px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
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

  // Logs & Progress
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentPageName: string }>({ current: 0, total: 0, currentPageName: "" });
  const [deletedCountSession, setDeletedCountSession] = useState<number>(0);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [doubleConfirm, setDoubleConfirm] = useState<boolean>(false);

  // References for logging & scroll
  const logContainerRef = useRef<HTMLDivElement>(null);
  const scanCancelledRef = useRef<boolean>(false);

  // Save Config to LocalStorage
  const saveCredentials = () => {
    localStorage.setItem("meta_app_id", appId);
    localStorage.setItem("meta_app_secret", appSecret);
    localStorage.setItem("meta_user_token", userToken);
    addLog("system", "Đã lưu cài đặt Meta Credentials vào thiết bị.", "success");
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
    }
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
    // Check if redirect has returned with token
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      setUserToken(tokenFromUrl);
      localStorage.setItem("meta_user_token", tokenFromUrl);
      addLog("system", "Phát hiện mã thông báo đăng nhập Facebook mới từ OAuth.", "success");
      // clean url query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    addLog("system", "Khởi tạo Meta Multi-Page Manager thành công. Sẵn sàng kết nối.", "success");
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

      const res = await fetch(`/api/auth/url?${urlParams.toString()}`);
      const data = await res.json();

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
    if (!activeToken) {
      setApiError("Vui lòng thực hiện đăng nhập hoặc cung cấp User Token trước.");
      return;
    }

    setLoadingPages(true);
    setApiError(null);
    addLog("system", "Đang tải danh sách các Facebook Fanpages quản lý từ /me/accounts...", "pending");
    
    try {
      const res = await fetch(`/api/facebook/pages?user_token=${encodeURIComponent(activeToken)}`);
      const data = await res.json();

      if (data.error) {
        setApiError(data.error);
        addLog("system", `Lỗi Graph API: ${data.error}`, "failed");
        return;
      }

      if (data.data) {
        setPages(data.data);
        addLog("system", `Đã tải thành công ${data.data.length} Fanpages quản lý.`, "success");
        // No default selection (as per user request we don't auto-tick the first one)
      } else {
        setPages([]);
        addLog("system", "Không tìm thấy Fanpage nào liên kết với tài khoản này.", "skipped");
      }
    } catch (err: any) {
      setApiError(err.message);
      addLog("system", `Lỗi tải danh sách Fanpage: ${err.message}`, "failed");
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
      return;
    }

    setLoadingPosts(true);
    setApiError(null);
    setPosts([]);
    setSelectedPostIds([]);
    scanCancelledRef.current = false;
    addLog("system", `Bắt đầu tải các bài viết từ ${selectedPageIds.length} Fanpage đã chọn...`, "pending");

    let allFetchedPosts: FacebookPost[] = [];
    setScanProgress({ current: 0, total: selectedPageIds.length, currentPageName: "Đang khởi tạo..." });

    let index = 0;
    for (const pageId of selectedPageIds) {
      if (scanCancelledRef.current) {
        addLog("system", `Đã dừng quét theo yêu cầu của người dùng tại bước ${index}/${selectedPageIds.length}.`, "skipped");
        break;
      }

      const pageInfo = pages.find(p => p.id === pageId);
      if (!pageInfo) continue;

      setScanProgress({ current: index, total: selectedPageIds.length, currentPageName: pageInfo.name });
      addLog("system", `Đang đọc bài viết từ Page: "${pageInfo.name}"...`, "processing");

      try {
        const res = await fetch(`/api/facebook/posts?page_id=${pageId}&page_token=${pageInfo.access_token}&limit=${filters.maxPostsToFetch}`);
        const data = await res.json();

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
        addLog("system", `Lỗi kết nối Page [${pageInfo.name}]: ${err.message}`, "failed");
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

  // Helper selectors
  const getFilteredPosts = (): FacebookPost[] => {
    return posts.filter(post => {
      // 1. Check keyword
      if (filters.enableKeyword && filters.keyword.trim()) {
        const text = (post.message || "").toLowerCase();
        const kw = filters.keyword.toLowerCase();
        if (!text.includes(kw)) return false;
      }

      // 2. Older than X days
      if (filters.enableOlderThan) {
        const postDate = new Date(post.created_time);
        const diffTime = Math.abs(new Date().getTime() - postDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= filters.olderThanDays) return false;
      }

      // 3. Date range matching
      if (filters.enableDateRange) {
        const postDate = new Date(post.created_time).getTime();
        if (filters.dateFrom) {
          const fromTime = new Date(filters.dateFrom).getTime();
          if (postDate < fromTime) return false;
        }
        if (filters.dateTo) {
          // Add 23h59m to include whole end day
          const toTime = new Date(filters.dateTo).getTime() + (24 * 60 * 60 * 1000) - 1;
          if (postDate > toTime) return false;
        }
      }

      return true;
    });
  };

  const filteredPosts = getFilteredPosts();
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
      return;
    }

    setShowConfirmModal(false);
    setIsDeleting(true);
    setProgress({ current: 0, total: selectedPostIds.length });
    
    addLog("queue", `--- PHIÊN KHỞI CHẠY TIẾN TRÌNH XÓA<sup>*</sup> HÀNG LOẠT ---`, "processing");
    addLog("queue", `Tổng số lượng bài viết đang đợi xóa: ${selectedPostIds.length}`, "pending");

    let countSuccess = 0;
    let countFail = 0;

    for (let i = 0; i < selectedPostIds.length; i++) {
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
        const res = await fetch("/api/facebook/delete-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: postId,
            page_token: post.pageAccessToken,
            confirm: true
          })
        });

        const data = await res.json();

        if (data.success) {
          countSuccess++;
          addLog(postId, `Đã xóa thành công bài viết [ID: ${postId}]: "${snippet}"`, "success");
        } else {
          countFail++;
          addLog(postId, `Thất bại khi xóa [ID: ${postId}] [Page: ${post.pageName}]: ${data.error || "Lỗi Meta API"}`, "failed");
        }
      } catch (err: any) {
        countFail++;
        addLog(postId, `Lỗi mạng khi xóa [ID: ${postId}]: ${err.message}`, "failed");
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
    addLog("queue", `Hoàn thành tác vụ xóa hàng loạt! Thành công: ${countSuccess}, Thất bại: ${countFail}.`, "success");
    
    // Refresh posts of pages to clear deleted items
    fetchPostsFromSelectedPages();
    setSelectedPostIds([]);
    setDoubleConfirm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#030a16] text-slate-100 flex flex-col justify-between select-none overflow-x-hidden">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/src/assets/images/cosmic_swirl_bg_1781941929717.jpg" 
          alt="Cosmic backdrop" 
          className="w-full h-full object-cover scale-[1.03] blur-[6px] opacity-75 brightness-[0.38]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030a16]/40 to-[#030a16]/95" />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between p-4 md:p-6">
      
      {/* HEADER BAR */}
      <header className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
            <Facebook className="w-7 h-7 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
              Meta Multi-Page Manager
            </h1>
            <p className="text-xs text-white/70">Xóa hàng loạt bài viết chọn lọc trên Fanpages Facebook</p>
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
        <div className="mb-4 bg-rose-500/20 border border-rose-500/40 backdrop-blur-md p-4 rounded-3xl flex items-start gap-3 text-rose-100 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <span className="font-semibold block">Phát hiện sự cố từ API / Xác thực:</span>
            <p className="mt-1 font-mono text-xs opacity-90">{apiError}</p>
            <p className="mt-2 text-xs italic text-rose-300">
              Mẹo: Các tài khoản cá nhân có thể thiếu quyền truy cập Nhà phát triển Meta cho Ứng dụng này. Hãy chọn mục "Cài đặt API" ở trên để điền thủ công Access Token của bạn.
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        
        {/* SIDEBAR: PAGES LIST (Col Span 3) */}
        <aside className="lg:col-span-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex flex-col shadow-xl">
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
              <p className="text-[11px] text-white/40 mt-1">Hãy xin quyền <span className="font-mono text-amber-200">pages_show_list</span> khi cấp quyền ứng dụng.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[550px] lg:max-h-[780px] pr-1.5 custom-scrollbar">
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
                        className="w-8.5 h-8.5 rounded-xl bg-indigo-500 shadow-inner flex-shrink-0"
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

          {/* Quick tips */}
          <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-white/50 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 text-white/75 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              Yêu cầu quyền bắt buộc:
            </p>
            <div className="flex flex-wrap gap-1 font-mono text-[9px]">
              <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/60">pages_show_list</span>
              <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/60">pages_manage_posts</span>
              <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/60">pages_read_engagement</span>
            </div>
          </div>
        </aside>

        {/* MAIN POST AREA & FILTERS (Col Span 9) */}
        <main className="lg:col-span-9 flex flex-col gap-4 relative z-10">
          
          {/* TOP BAR: FILTERS CARD */}
          <section className="relative z-30 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3.5 text-white shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-white/80 flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-emerald-300" />
                Bộ lọc tìm kiếm nâng cao
              </h2>
              <div className="flex gap-1.5">
                <button 
                  id="preset-all-time"
                  onClick={() => {
                    setFilters(f => ({
                      ...f,
                      enableOlderThan: false,
                      enableDateRange: false
                    }));
                    addLog("system", "Hủy bộ lọc thời gian - Hiển thị tối đa bài đăng từ trước đến nay.", "success");
                  }}
                  className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold transition-all ${
                    !filters.enableOlderThan && !filters.enableDateRange
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" 
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  Từ trước đến nay
                </button>
                <button 
                  id="preset-30-days"
                  onClick={() => setPresetOlderThan(30)}
                  className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold transition-all ${
                    filters.enableOlderThan && filters.olderThanDays === 30 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" 
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  &gt; 30 ngày
                </button>
                <button 
                  id="preset-90-days"
                  onClick={() => setPresetOlderThan(90)}
                  className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold transition-all ${
                    filters.enableOlderThan && filters.olderThanDays === 90 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" 
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  &gt; 90 ngày
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-40">
              
              {/* Filter: Older Than X days */}
              <div className="flex flex-col p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
                <label className="flex items-center gap-2 text-[11px] font-bold text-white/90 cursor-pointer select-none">
                  <div 
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      filters.enableOlderThan 
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-sm" 
                        : "border-white/30 hover:border-white/50"
                    }`}
                  >
                    {filters.enableOlderThan && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    id="chk-filter-older"
                    checked={filters.enableOlderThan}
                    onChange={(e) => setFilters(f => ({ ...f, enableOlderThan: e.target.checked }))}
                    className="sr-only"
                  />
                  <span>Lọc bài cũ hơn X ngày</span>
                </label>
                <div className="mt-2 flex items-center gap-1.5">
                  <input 
                    type="number"
                    id="input-older-days"
                    min="1"
                    value={filters.olderThanDays}
                    disabled={!filters.enableOlderThan}
                    onChange={(e) => setFilters(f => ({ ...f, olderThanDays: parseInt(e.target.value) || 0 }))}
                    className="bg-black/30 border border-white/20 rounded-lg px-2 py-0.5 h-7 text-[11px] font-mono outline-none text-white w-14 text-center font-bold disabled:opacity-30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all"
                  />
                  <span className="text-[10px] text-white/50">ngày về trước</span>
                </div>
              </div>

              {/* Filter: Keyword Search */}
              <div className="flex flex-col p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
                <label className="flex items-center gap-2 text-[11px] font-bold text-white/90 cursor-pointer select-none">
                  <div 
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      filters.enableKeyword 
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-sm" 
                        : "border-white/30 hover:border-white/50"
                    }`}
                  >
                    {filters.enableKeyword && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    id="chk-filter-keyword"
                    checked={filters.enableKeyword}
                    onChange={(e) => setFilters(f => ({ ...f, enableKeyword: e.target.checked }))}
                    className="sr-only"
                  />
                  <span>Chứa từ khoá bài viết</span>
                </label>
                <div className="mt-2 relative">
                  <input 
                    type="text" 
                    id="input-keyword"
                    value={filters.keyword}
                    disabled={!filters.enableKeyword}
                    onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                    placeholder="Nhập cụm từ tìm kiếm..." 
                    className="bg-black/30 border border-white/20 rounded-lg pl-7 pr-2.5 py-1 h-7 text-[11px] outline-none text-white w-full disabled:opacity-30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all"
                  />
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                </div>
              </div>

              {/* Filter: Date Range Selection */}
              <div className="flex flex-col p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
                <label className="flex items-center gap-2 text-[11px] font-bold text-white/90 cursor-pointer select-none">
                  <div 
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      filters.enableDateRange 
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-sm" 
                        : "border-white/30 hover:border-white/50"
                    }`}
                  >
                    {filters.enableDateRange && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    id="chk-filter-range"
                    checked={filters.enableDateRange}
                    onChange={(e) => setFilters(f => ({ ...f, enableDateRange: e.target.checked }))}
                    className="sr-only"
                  />
                  <span>Trong khoảng ngày đăng</span>
                </label>
                <div className="mt-2 flex flex-col gap-1 w-full text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40 w-5 shrink-0">Từ:</span>
                    <div className="flex-1">
                      <CustomDatePicker
                        value={filters.dateFrom}
                        disabled={!filters.enableDateRange}
                        onChange={(val) => setFilters(f => ({ ...f, dateFrom: val }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40 w-5 shrink-0">Đến:</span>
                    <div className="flex-1">
                      <CustomDatePicker
                        value={filters.dateTo}
                        disabled={!filters.enableDateRange}
                        onChange={(val) => setFilters(f => ({ ...f, dateTo: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter: Max Limits config */}
              <div className="flex flex-col p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
                <span className="text-[11px] font-bold text-white/85 mb-1.5 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-300" />
                  Giới hạn & Tải tối đa bài
                </span>
                <div className="space-y-1.5 mt-1 w-full">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-white/60">Tối đa tải/Page:</span>
                    <CustomSelect
                      value={filters.maxPostsToFetch}
                      onChange={(val) => setFilters(f => ({ ...f, maxPostsToFetch: val }))}
                      options={[
                        { value: 10, label: "10 bài" },
                        { value: 50, label: "50 bài" },
                        { value: 100, label: "100 bài" },
                        { value: 250, label: "250 bài" },
                        { value: 500, label: "500 bài" },
                        { value: 1000, label: "1000 bài" }
                      ]}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-white/60">Tối đa hiển thị:</span>
                    <CustomSelect
                      value={filters.maxPostsToShow}
                      onChange={(val) => setFilters(f => ({ ...f, maxPostsToShow: val }))}
                      options={[
                        { value: 10, label: "10 bài" },
                        { value: 50, label: "50 bài" },
                        { value: 100, label: "100 bài" },
                        { value: 250, label: "250 bài" },
                        { value: 500, label: "500 bài" },
                        { value: 1000, label: "1000 bài" }
                      ]}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* SELECTION CONTROL & RUN BUTTON */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 mt-0.5 border-t border-white/10">
              <div className="text-left">
                <p className="text-[9px] text-white/50 uppercase font-extrabold tracking-wider leading-none">Trạng thái bài viết đang lọc</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-mono text-white font-bold">
                    {selectedPostIds.length} <span className="text-[11px] text-white/60">/ {filteredPosts.length} bài đã chọn</span>
                  </span>
                  {filteredPosts.length > 0 && (
                    <span className="text-[9px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200 font-mono">
                      (Tổng: {posts.length})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-load-posts"
                  onClick={fetchPostsFromSelectedPages}
                  disabled={selectedPageIds.length === 0 || loadingPosts}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-[11px] border border-white/15 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${loadingPosts ? "animate-spin" : ""}`} />
                  Tải lại bài viết
                </button>

                <button 
                  id="btn-delete-trigger"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={selectedPostIds.length === 0 || isDeleting}
                  className="px-4 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-lg font-bold text-[11px] shadow-md shadow-red-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa bài viết đã chọn
                </button>
              </div>
            </div>

          </section>

          {/* STATS OVERVIEW MODULE */}
          <section className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-xl text-white">
            {/* Stat Item 1: Deleted Posts */}
            <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 min-h-[76px] w-full">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <dt className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Bài viết đã xóa</dt>
                <dd className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-extrabold text-rose-300">{deletedCountSession}</span>
                  <span className="text-[10px] text-white/40 font-medium">bài viết</span>
                </dd>
              </div>
            </div>

            {/* Stat Item 2: Remaining Displayed Posts */}
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 min-h-[76px] w-full">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <dt className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Bài viết hiển thị</dt>
                <dd className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-extrabold text-emerald-300">{displayedPosts.length}</span>
                  <span className="text-[10px] text-white/40 font-medium">/ {filteredPosts.length} đang có</span>
                </dd>
              </div>
            </div>

            {/* Stat Item 3: Total Engagement of Displayed Posts */}
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 min-h-[76px] w-full">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <dt className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Tổng tương tác hiển thị</dt>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-extrabold text-amber-300">{totalEngagement.toLocaleString("vi-VN")}</span>
                  <span className="text-[9px] text-white/40 font-medium">(Lọc hiện tại)</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[9px] text-white/40 border-t border-white/5 pt-0.5">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5 text-blue-400" /> {totalLikes.toLocaleString("vi-VN")}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5 text-cyan-400" /> {totalComments.toLocaleString("vi-VN")}</span>
                  <span className="flex items-center gap-0.5"><Share2 className="w-2.5 h-2.5 text-pink-400" /> {totalShares.toLocaleString("vi-VN")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* POSTS SCREEN CONTAINER */}
          <section className="relative z-10 flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            {/* Table/List Header */}
            <div className="px-6 py-4.5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
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
                  className="flex items-center gap-2.5 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/15 cursor-pointer select-none transition-all"
                >
                  <div 
                    className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all ${
                      displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id))
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20" 
                        : "border-white/30 hover:border-white/50"
                    }`}
                  >
                    {displayedPosts.length > 0 && displayedPosts.every(p => selectedPostIds.includes(p.id)) && (
                      <Check className="w-3 h-3 stroke-[3px]" />
                    )}
                  </div>
                  <span>Chọn toàn bộ hiển thị ({displayedPosts.length})</span>
                </div>
              )}
            </div>

            {/* List Body */}
            <div className="p-4 overflow-y-auto overflow-x-auto max-h-[500px] custom-scrollbar">
              {loadingPosts ? (
                <div className="flex flex-col justify-center items-center gap-5 text-white h-[410px] max-w-md mx-auto">
                  {/* Circular Spinner & Big Icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin"></div>
                    <Facebook className="w-7 h-7 text-emerald-400 absolute fill-current animate-pulse" />
                  </div>

                  {/* Progress Info Header */}
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-sm tracking-wide text-white/95 uppercase">ĐANG QUÉT FANPAGE HÀNG LOẠT</h3>
                    <p className="text-xs text-white/65">
                      Tiến trình: <span className="text-emerald-400 font-mono font-bold">{scanProgress.current}/{scanProgress.total}</span> Fanpage hoàn thành
                    </p>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-md shadow-emerald-500/20"
                      style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Current Active Page Name & Detail badge */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Đang kiểm tra & đọc bài viết:</span>
                    <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-4 py-1.5 text-xs text-emerald-300 font-bold max-w-full truncate shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
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
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all shadow-sm cursor-pointer select-none mt-1"
                  >
                    <XOctagon className="w-3.5 h-3.5 shrink-0" />
                    Dừng quét ngay
                  </button>

                  {/* Secondary info label */}
                  <p className="text-[11px] text-white/35 text-center italic leading-normal">
                    Hệ thống thu thập dữ liệu về bài viết, tổng hợp lượt thích, bình luận và chia sẻ từ API chính thức của Meta.
                  </p>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-3 h-[410px]">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <Facebook className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Chưa có bài viết nào</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto leading-relaxed">
                      Để hiển thị bài đăng, vui lòng tích chọn các Fanpage bên trái. Sau đó hệ thống sẽ tự động quét tối đa {filters.maxPostsToFetch} bài viết gần nhất.
                    </p>
                  </div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center gap-2 h-[410px]">
                  <ListFilter className="w-10 h-10 text-white/20" />
                  <p className="text-xs text-white/60 font-semibold">Tất cả {posts.length} bài viết hiện có đều bị bộ lọc ẩn đi.</p>
                  <p className="text-[11px] text-white/40">Vui lòng tắt bớt các điều kiện lọc (Khoảng ngày, Từ khóa, Số ngày) để kiểm tra.</p>
                </div>
              ) : (
                <div className="min-w-[760px] flex flex-col gap-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_54px_1fr_130px_145px_70px] gap-3 items-center px-2.5 pb-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/45 select-none">
                    <div className="text-center">Chọn</div>
                    <div>Ảnh</div>
                    <div>Nội dung bài viết</div>
                    <div className="text-center">Tương tác</div>
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
                          className={`group grid grid-cols-[40px_54px_1fr_130px_145px_70px] gap-3 items-center p-2.5 rounded-xl transition-all cursor-pointer border border-white/5 shadow-sm ${
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
                                {post.attachments?.data?.some(att => att.type?.includes("video")) && (
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

                          {/* Engagement stats */}
                          <div className="flex justify-center">
                            <div className="flex items-center justify-center gap-2.5 text-[10px] text-white/70 font-bold bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 select-none w-full max-w-[120px]">
                              <span className="flex items-center gap-0.5" title="Thích"><ThumbsUp className="w-3 h-3 text-blue-400 shrink-0" /> {post.likes?.summary?.total_count || 0}</span>
                              <span className="flex items-center gap-0.5" title="Bình luận"><MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" /> {post.comments?.summary?.total_count || 0}</span>
                              <span className="flex items-center gap-0.5" title="Chia sẻ"><Share2 className="w-3 h-3 text-pink-400 shrink-0" /> {post.shares?.count || 0}</span>
                            </div>
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
          <footer className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-xl shrink-0">
            {/* PROGRESS BAR PANEL (Col Span 4) */}
            <div className="md:col-span-4 flex flex-col justify-between gap-3 p-1">
              <div>
                <div className="flex justify-between text-[11px] uppercase font-bold text-white/60 mb-1.5">
                  <span>Tiến trình hoàn tất tác vụ</span>
                  <span className="font-mono text-emerald-300">{progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}</span>
                </div>
                <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-white/50 mt-1 block">
                  Đã thực hiện: {progress.current} / {progress.total} bài viết của phiên hiện tại.
                </span>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-300 shrink-0 mt-0.5" />
                <div className="text-[10px] text-rose-200 font-medium leading-normal">
                  <span className="font-bold text-rose-100 block">CẢNH BÁO QUAN TRỌNG:</span>
                  Hành động xóa bài viết là VĨNH VIỄN, không thể khôi phục hay hoàn tác trên Facebook.
                </div>
              </div>
            </div>

            {/* LIVE LOG CONSOLE TERMINAL (Col Span 8) */}
            <div className="md:col-span-8 flex flex-col bg-black/40 border border-white/10 rounded-2xl p-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2 shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-green-400 font-bold font-mono">
                  &gt;_ Console nhật ký thời gian thực (nhịp trễ 300ms–500ms)
                </span>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[9px] hover:underline text-white/40 hover:text-white"
                >
                  Xóa Nhật ký
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto max-h-[110px] space-y-1 font-mono text-[10px] text-green-300 custom-scrollbar pr-1"
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
