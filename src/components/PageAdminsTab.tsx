import { useState, useRef } from "react";
import { 
  Users, 
  Briefcase, 
  Download, 
  RotateCw, 
  Activity, 
  Info, 
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  XOctagon,
  HelpCircle,
  Facebook
} from "lucide-react";

interface PageAdminRecord {
  pageId: string;
  name: string;
  category: string;
  tasks: string[];
  businessName: string;
  businessId: string;
  businessType: "Owned Page" | "Client Page" | "Không xác định";
  status: "Bình thường" | "Thiếu quyền" | "Token lỗi";
  detail: string;
}

interface PageAdminsTabProps {
  pages: any[];
  userToken: string;
}

import DropdownSelect from "./DropdownSelect";

export default function PageAdminsTab({ pages, userToken }: PageAdminsTabProps) {
  const [pageAdmins, setPageAdmins] = useState<PageAdminRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<{ id: string; time: string; context: string; message: string; status: "success" | "failed" | "processing" | "skipped" }[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentStepName: "" });
  const [activeLogTab, setActiveLogTab] = useState<"all" | "success" | "error">("all");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [hasBmPermission, setHasBmPermission] = useState<boolean | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const cancelScanRef = useRef<boolean>(false);

  const addLog = (context: string, message: string, status: "success" | "failed" | "processing" | "skipped") => {
    const time = new Date().toLocaleTimeString("vi-VN");
    setLogs(prev => [
      { id: Date.now().toString() + Math.random(), time, context, message, status },
      ...prev
    ]);
  };

  const getTaskLabels = (tasks: string[]) => {
    const labels: string[] = [];
    if (tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement")) {
      labels.push("Quản lý Page");
    }
    if (tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("MANAGE")) {
      labels.push("Đăng/Xoá bài");
    }
    if (tasks.includes("MODERATE")) {
      labels.push("Quản lý tương tác");
    }
    if (tasks.includes("ADVERTISE")) {
      labels.push("Quảng cáo");
    }
    if (tasks.includes("ANALYZE")) {
      labels.push("Xem thống kê");
    }
    return labels.length > 0 ? labels.join(", ") : "Xem thông tin cơ bản";
  };

  const runAdminsBMScan = async () => {
    if (!userToken) {
      addLog("Hệ thống", "Không tìm thấy token Facebook người dùng. Vui lòng kết nối trước.", "failed");
      return;
    }
    if (pages.length === 0) {
      addLog("Hệ thống", "Không tìm thấy Fanpages nào đã tải sẵn.", "skipped");
      return;
    }

    setScanning(true);
    cancelScanRef.current = false;
    setPageAdmins([]);
    setLogs([]);
    setBusinesses([]);
    setProgress({ current: 0, total: 1, currentStepName: "Đang tải dữ liệu BM..." });

    addLog("Hàng đợi", "Bắt đầu tải thông tin tài khoản & danh sách Business Manager...", "processing");

    // 1. Fetch BM lists
    let bmList: any[] = [];
    let bmPerm = false;
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const res = await fetch(`/api/businesses?userToken=${encodeURIComponent(userToken)}`);
      const data = await res.json();
      
      bmPerm = data.hasPermission;
      setHasBmPermission(bmPerm);

      if (data.success && data.data && data.data.length > 0) {
        bmList = data.data;
        setBusinesses(bmList);
        addLog("Doanh nghiệp", `Đã tìm thấy ${bmList.length} Business Managers kết nối với tài khoản này.`, "success");
      } else {
        addLog("Doanh nghiệp", data.error || "Không tìm thấy Business Manager nào, hoặc thiếu quyền business_management", "skipped");
      }
    } catch (e: any) {
      addLog("Doanh nghiệp", `Không lấy được Business Managers: ${e.message}`, "failed");
    }

    // 2. Scan each business and mapping connected pages
    const totalSteps = pages.length + (bmList.length > 0 ? bmList.length : 0);
    setProgress({ current: 0, total: totalSteps, currentStepName: "Đang phân tích BM..." });
    
    let currentStepNum = 0;
    const pageToBmMap: Record<string, { businessName: string; businessId: string; type: "Owned Page" | "Client Page" }> = {};

    if (bmList.length > 0) {
      for (const bm of bmList) {
        if (cancelScanRef.current) {
          addLog("Hàng đợi", "Đã dừng tiến trình quét phân tích Business Manager.", "skipped");
          setScanning(false);
          return;
        }
        currentStepNum++;
        setProgress({ current: currentStepNum, total: totalSteps, currentStepName: `BM: ${bm.name}` });
        addLog(bm.name, `Đang phân tích các Page trực thuộc Business Manager...`, "processing");

        try {
          await new Promise(resolve => setTimeout(resolve, 350));
          const res = await fetch("/api/page-business-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userToken,
              businessId: bm.id
            })
          });
          const result = await res.json();
          if (result.success && result.data) {
            const { ownedPages, clientPages } = result.data;
            let counter = 0;
            
            (ownedPages || []).forEach((p: any) => {
              pageToBmMap[p.id] = { businessName: bm.name, businessId: bm.id, type: "Owned Page" };
              counter++;
            });
            (clientPages || []).forEach((p: any) => {
              pageToBmMap[p.id] = { businessName: bm.name, businessId: bm.id, type: "Client Page" };
              counter++;
            });

            addLog(bm.name, `Phân tích xong! Map thành công ${counter} Pages vào Business Manager.`, "success");
          } else {
            addLog(bm.name, `Lỗi đọc dữ liệu: ${result.error || "Lỗi máy chủ"}`, "failed");
          }
        } catch (err: any) {
          addLog(bm.name, `Quét lỗi map: ${err.message}`, "failed");
        }
      }
    }

    // 3. Build detailed admins display for each page
    addLog("Hàng đợi", "Đang hợp nhất phân lớp tổ chức của các trang...", "processing");
    const records: PageAdminRecord[] = [];

    for (const page of pages) {
      if (cancelScanRef.current) {
        addLog("Hàng đợi", "Đã dừng tiến trình hợp nhất quyền tác vụ các trang hoặc BM.", "skipped");
        setScanning(false);
        return;
      }
      currentStepNum++;
      setProgress({ current: currentStepNum, total: totalSteps, currentStepName: `Trang: ${page.name}` });
      
      const mapInfo = pageToBmMap[page.id];
      const tasks = page.tasks || [];
      const hasPageToken = !!page.access_token;
      
      const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
      const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");
      
      let status: "Bình thường" | "Thiếu quyền" | "Token lỗi" = "Bình thường";
      let detail = "Đầy đủ quyền tác vụ cơ bản";

      if (!hasPageToken) {
        status = "Token lỗi";
        detail = "Thiếu Page Access Token hoặc đã bị hỏng";
      } else if (!hasManage) {
        status = "Thiếu quyền";
        detail = "Thiếu quyền quản lý (MANAGE)";
      } else if (!hasCreateContent) {
        status = "Thiếu quyền";
        detail = "Thiếu quyền đăng/xóa bài (CREATE_CONTENT)";
      }

      records.push({
        pageId: page.id,
        name: page.name,
        category: page.category || "Không xác định",
        tasks,
        businessName: mapInfo ? mapInfo.businessName : "N/A",
        businessId: mapInfo ? mapInfo.businessId : "N/A",
        businessType: mapInfo ? mapInfo.type : "Không xác định",
        status,
        detail
      });
    }

    setPageAdmins(records);
    setScanning(false);
    setProgress({ current: totalSteps, total: totalSteps, currentStepName: "Hoàn thành" });
    addLog("Hệ thống", "Đã hoàn thành phân tích quản trị và tổ chức Business Manager!", "success");
  };

  const handleExportCSV = () => {
    if (pageAdmins.length === 0) {
      addLog("Hệ thống", "Không có dữ liệu quyền để xuất CSV. Hãy ấn Quét trước.", "skipped");
      return;
    }
    const headers = ["Tên Page", "Page ID", "Category", "Quyền Của Tôi", "Mã Quyền", "Business Manager", "Loại Page", "Trạng thái"];
    const rows = pageAdmins.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.pageId}"`,
      `"${(r.category || "N/A").replace(/"/g, '""')}"`,
      `"${getTaskLabels(r.tasks).replace(/"/g, '""')}"`,
      `"${r.tasks.join(", ")}"`,
      `"${r.businessName.replace(/"/g, '""')}"`,
      `"${r.businessType}"`,
      `"${r.status} - ${r.detail}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quan_Tri_PageMeta_BM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredPageAdmins = pageAdmins.filter(r => {
    const tasks = r.tasks || [];
    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");

    if (filterType === "manage") return hasManage;
    if (filterType === "create") return hasCreateContent;
    if (filterType === "missing") return r.status === "Thiếu quyền";
    if (filterType === "bm") return r.businessName !== "N/A";
    if (filterType === "no-bm") return r.businessName === "N/A";
    if (filterType === "token-err") return r.status === "Token lỗi";
    return true; // all
  });

  // KPI count
  const total = pages.length;
  const hasManageRights = pageAdmins.filter(r => r.tasks.includes("MANAGE") || r.tasks.includes("pages_manage_posts")).length;
  const hasCreateRights = pageAdmins.filter(r => r.tasks.includes("CREATE_CONTENT") || r.tasks.includes("CREATE") || r.tasks.includes("MANAGE")).length;
  const inBmCount = pageAdmins.filter(r => r.businessName !== "N/A").length;
  const noBmCount = pageAdmins.filter(r => r.businessName === "N/A" && r.status !== "Token lỗi").length;
  const missingCount = pageAdmins.filter(r => r.status === "Thiếu quyền").length;

  return (
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full text-foreground">
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden h-full">

        {/* 1. BM PERMISSION ALERT STATEMENT */}
        {hasBmPermission === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 text-amber-800 shrink-0 shadow-sm">
            <ShieldAlert className="w-5.5 h-5.5 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <strong className="block text-amber-600 font-extrabold mb-0.5 uppercase tracking-wider">Quyền business_management Chưa Sẵn Sàng:</strong>
              Mã truy cập Facebook của bạn chưa chứa quyền phân lớp quản lý BM. App vẫn hiển thị quyền hạn, nhưng không thể định vị chéo tên Business Manager sở hữu. Bạn có thể cấp thêm quyền này khi đăng nhập lại.
            </div>
          </div>
        )}

        {/* 2. TOP METRICS PANEL: STANDALONE INDIVIDUAL CELLS */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">TỔNG PAGE</p>
            <p className="text-xl font-black text-foreground mt-0.5 select-none font-mono">{pages.length}</p>
          </div>
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">QUYỀN QUẢN LÝ</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 select-none font-mono">
              {pageAdmins.length > 0 ? hasManageRights : "-"}
            </p>
          </div>
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">QUYỀN ĐĂNG BÀI</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 select-none font-mono">
              {pageAdmins.length > 0 ? hasCreateRights : "-"}
            </p>
          </div>
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">NẰM TRONG BM</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 select-none font-mono">
              {pageAdmins.length > 0 ? inBmCount : "-"}
            </p>
          </div>
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">CHƯA KHỞI TẠO</p>
            <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 select-none font-mono">
              {pageAdmins.length > 0 ? noBmCount : "-"}
            </p>
          </div>
          <div className="glass-card border border-border rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">THIẾU QUYỀN</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 select-none font-mono">
              {pageAdmins.length > 0 ? missingCount : "-"}
            </p>
          </div>
        </div>

        {/* 4. MAIN INTERACTIVE TABLE WITH INTEGRATED FILTER HEADER */}
        <div className="flex-1 glass-card border flex flex-col overflow-hidden min-h-0 shadow-sm rounded-[24px]">
          {scanning ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-4 text-foreground h-full min-h-[350px] py-6 max-w-md mx-auto">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                <Facebook className="w-6 h-6 text-accent absolute fill-current animate-pulse" />
              </div>

              <div className="text-center space-y-0.5 mt-2">
                <h3 className="font-bold text-xs tracking-wider text-muted-foreground uppercase opacity-80">Đang phân tích quản trị viên & BM</h3>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  Tiến trình: <span className="text-accent font-mono font-bold text-xs">{progress.current}/{progress.total}</span> Hoàn thành
                </p>
              </div>

              <div className="w-full pretty-progress-track h-4 overflow-hidden shadow-inner">
                <div 
                  className="pretty-progress-bar"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              <div className="flex flex-col items-center gap-1.5 w-full animate-pulse mt-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Đang xử lý:</span>
                <div className="bg-accent/10 border border-accent/20 rounded-[10px] px-3 py-1 text-[11px] text-accent font-bold max-w-full truncate shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping shrink-0" />
                  {progress.currentStepName || "Đang khởi tạo..."}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  cancelScanRef.current = true;
                  addLog("Yêu cầu", "Đang gửi yêu cầu dừng quét...", "skipped");
                }}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[10px] font-bold transition-all shadow-sm cursor-pointer select-none"
              >
                <XOctagon className="w-3.5 h-3.5 shrink-0" />
                Dừng quét ngay
              </button>

              <p className="text-[10px] text-muted-foreground/80 text-center leading-relaxed mt-4 max-w-[80%]">
                Hệ thống đang truy vấn thông tin Business Manager, phân tách chéo phân lớp sở hữu và kiểm tra chi tiết các vai trò thành viên quản trị.
              </p>
            </div>
          ) : (
            <>
              {/* Integrated Filter Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 bg-black/10 shrink-0 select-none">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Bộ lọc quản trị viên
                </span>
                <div className="flex items-center gap-2">
                  <DropdownSelect
                    value={filterType}
                    onChange={(val, label) => {
                      setFilterType(val);
                      addLog("Bộ lọc", `Áp dụng hiển thị phân loại [${label}]`, "skipped");
                    }}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "manage", label: "Có quyền quản lý" },
                      { value: "create", label: "Có quyền đăng/xoá" },
                      { value: "missing", label: "Thiếu quyền" },
                      { value: "bm", label: "Nằm trong BM" },
                      { value: "no-bm", label: "Chưa xác định BM" },
                      { value: "token-err", label: "Token lỗi" },
                    ]}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-transparent px-3 pb-3">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-2 z-10 select-none drop-shadow-sm">
                    <tr className="group">
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border border-border/60 border-r-0 rounded-l-[20px]">Fanpage</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Page ID</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Category</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Quyền của tôi</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Business Manager</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Business ID</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Phân loại</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Trạng thái</th>
                      <th className="px-5 py-4 text-center text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border border-border/60 border-l-0 rounded-r-[20px]">FB Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-medium text-foreground">
                    {filteredPageAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-muted-foreground">
                          <Info className="w-10 h-10 mx-auto opacity-40 mb-4 text-muted-foreground" />
                          <p className="text-[13px] font-bold text-foreground">Chứa kết quả quyền hạn quản trị</p>
                          <p className="text-[11px] text-muted-foreground mt-1.5">Vui lòng click <strong className="text-accent font-bold">"Kiểm tra quyền & BM"</strong> để trích xuất quyền và mô hình BM.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPageAdmins.map((row) => {
                        let statusBg = "bg-emerald-50 text-emerald-600 border border-emerald-200";
                        if (row.status === "Thiếu quyền") {
                          statusBg = "bg-amber-50 text-amber-600 border border-amber-200";
                        } else if (row.status === "Token lỗi") {
                          statusBg = "bg-rose-50 text-rose-600 border border-rose-200";
                        }

                        let typeBg = "bg-muted text-muted-foreground border border-border";
                        if (row.businessType === "Owned Page") {
                          typeBg = "bg-purple-50 text-purple-600 border border-purple-200";
                        } else if (row.businessType === "Client Page") {
                          typeBg = "bg-teal-50 text-teal-600 border border-teal-200";
                        }

                        return (
                          <tr key={row.pageId} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3.5 font-bold select-all font-sans text-xs flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-accent/10 overflow-hidden flex items-center justify-center border border-accent/20 shrink-0">
                                <span className="text-xs font-black text-accent">{row.name.substring(0,1).toUpperCase()}</span>
                              </div>
                              <span className="truncate max-w-[140px] text-foreground leading-snug" title={row.name}>{row.name}</span>
                            </td>
                            <td className="p-3.5 font-mono text-xs select-all text-muted-foreground">{row.pageId}</td>
                            <td className="p-3.5 text-muted-foreground truncate max-w-[110px]" title={row.category}>{row.category}</td>
                            <td className="p-3.5 text-xs font-sans">
                              <span className="font-bold text-foreground">{getTaskLabels(row.tasks)}</span>
                            </td>
                            <td className="p-3.5 font-bold text-xs capitalize truncate max-w-[130px] text-foreground" title={row.businessName}>
                              {row.businessName === "N/A" ? (
                                <span className="opacity-60 font-mono italic text-[11px] text-muted-foreground">Ngoại vi (N/A)</span>
                              ) : (
                                row.businessName
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-muted-foreground select-all">
                              {row.businessId === "N/A" ? (
                                <span className="opacity-60 font-mono">—</span>
                              ) : (
                                row.businessId
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider shadow-sm ${typeBg}`}>
                                {row.businessType}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold tracking-wide shadow-sm ${statusBg}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex flex-col gap-1 w-[130px] mx-auto">
                                <a 
                                  href={`https://www.facebook.com/${row.pageId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 text-blue-600 transition-all border border-blue-100 shadow-sm"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Mở Page FB
                                </a>
                                <a 
                                  href={`https://business.facebook.com/latest/home?asset_id=${row.pageId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 text-indigo-600 transition-all border border-indigo-100 shadow-sm"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Meta Suite
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
    </div>

      {/* RIGHT SIDEBAR: PROGRESS AND LOGS & ACTIONS */}
      <aside className="w-full xl:w-[260px] 2xl:w-[300px] bg-card border border-border rounded-2xl p-3 shrink-0 flex flex-col gap-4 shadow-sm h-[auto] xl:h-full overflow-y-auto">
        
        {/* PROGRESS BAR PANEL */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
              <span>Tiến độ thực hiện</span>
              <span className="font-mono text-accent text-[10px] bg-accent/5 border border-accent/20 px-1.5 py-0.5 rounded shadow-sm">
                {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border p-0.5 shadow-inner">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-foreground">
                <span className="text-accent font-black">{progress.current}</span> / <span className="text-muted-foreground">{progress.total}</span> bước
              </span>
            </div>

            <div className="flex gap-2 w-full mt-2">
              {pageAdmins.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-2.5 bg-background border border-border text-foreground rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:bg-card-hover"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  CSV
                </button>
              )}

              <button
                type="button"
                onClick={runAdminsBMScan}
                disabled={pages.length === 0 || scanning}
                className={`flex-1 py-2.5 btn-primary text-white rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-md select-none ${
                  pages.length === 0 || scanning
                    ? "opacity-50 cursor-not-allowed shadow-none"
                    : "cursor-pointer"
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 shrink-0 ${pages.length > 0 && !scanning ? "text-white/80" : "text-white/50"} ${scanning ? "animate-spin" : ""}`} />
                Kiểm tra QM
              </button>
            </div>

            {scanning && (
              <div className="flex gap-2 w-full mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    cancelScanRef.current = true;
                    addLog("Yêu cầu", "Đang gửi tín hiệu dừng tiến trình quét...", "skipped");
                  }}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 border border-transparent text-white text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-orange-500/20"
                >
                  Dừng
                </button>
              </div>
            )}
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
                {logs.filter(log => log.status === "failed").length}
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] p-1 custom-scrollbar pr-1.5">
            {(() => {
              const filtered = logs.filter((log) => {
                if (activeLogTab === "error") return log.status === "failed";
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
                } else if (log.status === "processing") {
                   colorClass = "text-amber-500 font-medium animate-pulse";
                   prefix = "➜";
                } else if (log.status === "skipped") {
                   colorClass = "text-blue-500 font-medium";
                   prefix = "⏱";
                }

                return (
                  <div key={log.id} className={`${colorClass} flex items-start gap-1.5 leading-relaxed break-words py-1 border-b border-border/20`}>
                    <span className="shrink-0 text-muted-foreground select-none">[{log.time}]</span>
                    <span className="shrink-0 font-bold select-none">{prefix}</span>
                    <span className="max-w-[70px] truncate select-none font-bold shrink-0 text-slate-400 dark:text-slate-500" title={log.context}>
                      {log.context}:
                    </span>
                    <span className="text-foreground/80 font-medium">{log.message}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </aside>
    </div>
  );
}
