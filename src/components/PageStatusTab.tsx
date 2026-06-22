import { useState, useRef } from "react";
import { 
  ShieldAlert, 
  CheckCircle, 
  XOctagon, 
  Info, 
  ExternalLink, 
  Download, 
  RotateCw, 
  AlertCircle,
  HelpCircle,
  Play,
  Activity,
  Facebook
} from "lucide-react";

interface PageStatusRecord {
pageId: string;
name: string;
category: string;
tasks: string[];
status: string;
detail: string;
hasPageAccessToken: boolean;
postsSuccess: boolean;
postsCountFetched: number;
postSample: any;
checkedAt: string;
}

interface PageStatusTabProps {
pages: any[];
userToken: string;
}

export default function PageStatusTab({ pages, userToken }: PageStatusTabProps) {
const [pageStatuses, setPageStatuses] = useState<PageStatusRecord[]>([]);
const [scanning, setScanning] = useState(false);
const [logs, setLogs] = useState<{ id: string; time: string; pageName: string; message: string; status: "success" | "failed" | "processing" | "skipped" }[]>([]);
const [progress, setProgress] = useState({ current: 0, total: 0, currentPageName: "" });
const [activeLogTab, setActiveLogTab] = useState<"all" | "success" | "error">("all");
const cancelScanRef = useRef<boolean>(false);

const addLog = (pageName: string, message: string, status: "success" | "failed" | "processing" | "skipped") => {
  const time = new Date().toLocaleTimeString("vi-VN");
  setLogs(prev => [
    { id: Date.now().toString() + Math.random(), time, pageName, message, status },
    ...prev
  ]);
};

const runPageStatusScan = async () => {
  if (!userToken) {
    addLog("Hệ thống", "Không tìm thấy token Facebook của người dùng. Vui lòng kết nối trước.", "failed");
    return;
  }
  if (pages.length === 0) {
    addLog("Hệ thống", "Không có Fanpage nào để quét. Hãy chắc chắn bạn đã tải danh sách Fanpage thành công.", "skipped");
    return;
  }

  setScanning(true);
  cancelScanRef.current = false;
  setPageStatuses([]);
  setLogs([]);
  setProgress({ current: 0, total: pages.length, currentPageName: "" });

  addLog("Hàng đợi", `Bắt đầu quét kiểm tra trạng thái toàn bộ ${pages.length} Fanpage...`, "processing");

  let itemsProcessed = 0;
  
  for (const page of pages) {
    if (cancelScanRef.current) {
      addLog("Hàng đợi", "Đã dừng chương trình kiểm tra bởi yêu cầu người dùng.", "skipped");
      break;
    }
    setProgress({ current: itemsProcessed, total: pages.length, currentPageName: page.name });
    addLog(page.name, `Đang quét kiểm tra quyền và kết nối...`, "processing");

    try {
      await new Promise(resolve => setTimeout(resolve, 350));

      const res = await fetch("/api/page-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userToken,
          pageId: page.id,
          pageAccessToken: page.access_token
        })
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Phản hồi từ server không phải định dạng JSON hợp lệ.");
      }

      if (data.success && data.data) {
        const record: PageStatusRecord = data.data;
        setPageStatuses(prev => {
          const filtered = prev.filter(p => p.pageId !== record.pageId);
          return [...filtered, record];
        });
        
        let logStatus: "success" | "failed" = "success";
        if (record.status.includes("lỗi") || record.status.includes("Thiếu quyền")) {
          logStatus = "failed";
        }
        addLog(page.name, `Trạng thái: [${record.status}]. Chi tiết: ${record.detail || "Hoạt động bình thường"}`, logStatus);
      } else {
        throw new Error(data.error || "Không thể kiểm tra phản hồi khả dụng.");
      }
    } catch (err: any) {
      const fallbackRecord: PageStatusRecord = {
        pageId: page.id,
        name: page.name,
        category: page.category || "Không xác định",
        tasks: page.tasks || [],
        status: "Token lỗi / hết hạn",
        detail: err.message || "Không thể gửi yêu cầu máy chủ.",
        hasPageAccessToken: !!page.access_token,
        postsSuccess: false,
        postsCountFetched: 0,
        postSample: null,
        checkedAt: new Date().toISOString()
      };
      setPageStatuses(prev => {
        const filtered = prev.filter(p => p.pageId !== fallbackRecord.pageId);
        return [...filtered, fallbackRecord];
      });
      addLog(page.name, `Quét thất bại: ${err.message || "Lỗi mạng hoặc server"}`, "failed");
    }

    itemsProcessed++;
  }

  setProgress({ current: pages.length, total: pages.length, currentPageName: "Hoàn thành" });
  setScanning(false);
  addLog("Hàng đợi", `Đã hoàn tất kiểm tra trạng thái ${pages.length} Fanpage kết nối!`, "success");
};

const handleExportCSV = () => {
  if (pageStatuses.length === 0) {
    addLog("Hệ thống", "Không có dữ liệu để xuất CSV. Vui lòng chạy Quét trạng thái trước.", "skipped");
    return;
  }
  const headers = ["Tên Page", "Page ID", "Category", "Quyền", "Có Token riêng", "Quét bài viết", "Trạng thái", "Chi tiết lỗi"];
  const rows = pageStatuses.map(ps => [
    `"${ps.name.replace(/"/g, '""')}"`,
    `"${ps.pageId}"`,
    `"${(ps.category || "Không xác định").replace(/"/g, '""')}"`,
    `"${(ps.tasks || []).join(", ")}"`,
    ps.hasPageAccessToken ? "Có" : "Không",
    ps.postsSuccess ? "Có" : "Không",
    `"${ps.status}"`,
    `"${(ps.detail || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Trang_Thai_PageMeta_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Metrics calculator
const totalChecked = pageStatuses.length;
const normalCount = pageStatuses.filter(s => s.status === "Bình thường").length;
const missingPermsCount = pageStatuses.filter(s => s.status.includes("Thiếu quyền")).length;
const tokenErrorCount = pageStatuses.filter(s => s.status.includes("Token lỗi") || s.status.includes("hết hạn")).length;
const restrictedCount = pageStatuses.filter(s => s.status.includes("Nghi bị hạn chế") || s.status.includes("hạn chế")).length;

return (
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full text-foreground">
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden h-full">
        {/* TOP STATUS METRICS: STANDALONE CELLS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          <div className="glass-card p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">TỔNG PAGE</p>
            <p className="text-xl font-black text-foreground mt-0.5 select-none font-mono">{pages.length}</p>
          </div>
          <div className="glass-card p-3 text-center transition-all shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
            <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">BÌNH THƯỜNG</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 select-none font-mono">
              {totalChecked > 0 ? normalCount : "-"}
            </p>
          </div>
          <div className="glass-card p-3 text-center transition-all shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
            <p className="text-[11px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">THIẾU QUYỀN</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 select-none font-mono">
              {totalChecked > 0 ? missingPermsCount : "-"}
            </p>
          </div>
          <div className="glass-card p-3 text-center transition-all shadow-[0_4px_12px_rgba(244,63,94,0.05)]">
            <p className="text-[11px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">TOKEN LỖI</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 select-none font-mono">
              {totalChecked > 0 ? tokenErrorCount : "-"}
            </p>
          </div>
          <div className="glass-card p-3 text-center col-span-2 md:col-span-1 transition-all shadow-[0_4px_12px_rgba(168,85,247,0.05)]">
            <p className="text-[11px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">NGHI HẠN CHẾ</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 select-none font-mono">
              {totalChecked > 0 ? restrictedCount : "-"}
            </p>
          </div>
        </div>

        <div className="flex-1 glass-card flex flex-col overflow-hidden min-h-0 shadow-sm">
          {scanning ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-4 text-foreground h-full min-h-[350px] py-6 max-w-md mx-auto">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                <Facebook className="w-6 h-6 text-accent absolute fill-current animate-pulse" />
              </div>

              <div className="text-center space-y-0.5 mt-2">
                <h3 className="font-bold text-xs tracking-wider text-muted-foreground uppercase opacity-80">Đang kiểm tra trạng thái Fanpage</h3>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  Tiến trình: <span className="text-accent font-mono font-bold text-xs">{progress.current}/{progress.total}</span> Page hoàn thành
                </p>
              </div>

              <div className="w-full pretty-progress-track h-4 overflow-hidden shadow-inner">
                <div 
                  className="pretty-progress-bar"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              <div className="flex flex-col items-center gap-1.5 w-full animate-pulse mt-2">
                <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">Đang kiểm tra & quét trạng thái:</span>
                <div className="bg-accent/10 border border-accent/20 rounded-[10px] px-3 py-1 text-[11px] text-accent font-bold max-w-full truncate shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping shrink-0" />
                  {progress.currentPageName || "Đang khởi tạo..."}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  cancelScanRef.current = true;
                  addLog("Yêu cầu", "Đang gửi yêu cầu dừng quét...", "skipped");
                }}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer select-none"
              >
                <XOctagon className="w-3.5 h-3.5 shrink-0" />
                Dừng quét ngay
              </button>

              <p className="text-[11px] text-muted-foreground/80 text-center leading-relaxed mt-4 max-w-[80%]">
                Hệ thống đang thực hiện kiểm tra quyền tác vụ, mã truy cập riêng và phát hiện sự cố lỗi từ API chính thức của Meta.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-transparent px-3 pb-3">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-2 z-10 select-none drop-shadow-sm">
                <tr className="group">
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border border-border/60 border-r-0 rounded-l-[16px]">Fanpage</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Page ID</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Category</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Quyền tác vụ</th>
                  <th className="px-5 py-4 text-center text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Token riêng</th>
                  <th className="px-5 py-4 text-center text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Lấy bài viết</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Trạng thái</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-amber-600 lg:w-[15%] bg-background/40 backdrop-blur-[24px] border-y border-border/60">Chi tiết lỗi</th>
                  <th className="px-5 py-4 text-center text-[11px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border border-border/60 border-l-0 rounded-r-[16px]">Hành động của Meta</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-medium text-foreground">
              {pageStatuses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <Info className="w-10 h-10 mx-auto opacity-40 mb-4 text-muted-foreground" />
                    <p className="text-[13px] font-bold text-foreground">Chưa có thông tin kiểm tra</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">Vui lòng click nút <strong className="text-accent font-bold">"Kiểm tra trạng thái"</strong> để bắt đầu quét quyền hoạt động.</p>
                  </td>
                </tr>
              ) : (
                pageStatuses.map((row) => {
                  let statusColor = "bg-emerald-50 text-emerald-600 border border-emerald-200";
                  if (row.status.includes("Thiếu quyền")) {
                    statusColor = "bg-amber-50 text-amber-600 border border-amber-200";
                  } else if (row.status.includes("lỗi") || row.status.includes("hết hạn")) {
                    statusColor = "bg-rose-50 text-rose-600 border border-rose-200";
                  } else if (row.status.includes("hạn chế") || row.status.includes("Nghi bị hạn chế")) {
                    statusColor = "bg-purple-50 text-purple-600 border border-purple-200";
                  } else if (row.status.includes("kiểm tra thủ công")) {
                    statusColor = "bg-cyan-50 text-cyan-600 border border-cyan-200";
                  }

                  return (
                    <tr key={row.pageId} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5 font-bold select-all font-sans text-xs flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent/10 overflow-hidden flex items-center justify-center border border-accent/20 shrink-0">
                          <span className="text-xs font-black text-accent">{row.name.substring(0, 1).toUpperCase()}</span>
                        </div>
                        <span className="truncate max-w-[140px] text-foreground leading-snug" title={row.name}>{row.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] select-all text-muted-foreground">{row.pageId}</td>
                      <td className="p-3.5 text-muted-foreground truncate max-w-[110px]">{row.category}</td>
                      <td className="p-3.5 text-xs font-sans">
                        <div className="flex flex-wrap gap-1.5">
                          {row.tasks.length === 0 ? (
                            <span className="opacity-60 font-mono text-[11px] text-muted-foreground">Không có</span>
                          ) : (
                            row.tasks.map((task, i) => (
                              <span key={i} className="bg-muted border border-border px-1.5 py-0.5 rounded shadow-sm text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {task}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {row.hasPageAccessToken ? (
                          <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shadow-sm">CÓ</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px] bg-rose-50 border border-rose-100 px-2 py-0.5 rounded shadow-sm">KHÔNG</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.postsSuccess ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-[10px] px-2 py-0.5 text-[11px] shadow-sm font-bold">Thành công</span>
                        ) : (
                          <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-[10px] px-2 py-0.5 text-[11px] shadow-sm font-bold">Thất bại</span>
                        )}
                      </td>
                      <td className="p-3.5">
                         <span className={`px-2.5 py-1 rounded-[10px] text-[11px] font-bold tracking-wide inline-block leading-none shadow-sm ${statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] max-w-[170px] truncate text-rose-600 font-mono" title={row.detail}>
                        {row.detail || <span className="text-muted-foreground italic">Không tìm thấy lỗi</span>}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="grid grid-cols-2 gap-1.5 w-[210px] mx-auto">
                          <a 
                            href={`https://www.facebook.com/${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 text-blue-600 transition-all border border-blue-100 shadow-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Mở Page
                          </a>
                          <a 
                            href={`https://business.facebook.com/latest/home?asset_id=${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 text-indigo-600 transition-all border border-indigo-100 shadow-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Meta Suite
                          </a>
                          <a 
                            href="https://business.facebook.com/latest/page_quality"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 text-amber-600 transition-all border border-amber-100 col-span-1 shadow-sm"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Chất lượng
                          </a>
                          <a 
                            href="https://business.facebook.com/latest/monetization"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 text-purple-600 transition-all border border-purple-100 col-span-1 shadow-sm"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Kiếm tiền
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
      )}
    </div>
    </div>

      {/* RIGHT SIDEBAR: PROGRESS AND LOGS & ACTIONS */}
      <aside className="w-full xl:w-[260px] 2xl:w-[300px] glass p-3 shrink-0 flex flex-col gap-4 h-[auto] xl:h-full overflow-y-auto">
        
        {/* PROGRESS BAR PANEL */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  Tiến trình quét
                </h4>
                <div className="text-[13px] font-black text-foreground font-mono tracking-tight">
                  {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}` : "0"}
                  <span className="text-[11px] text-accent font-bold">%</span>
                </div>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground bg-background/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/50 shadow-sm">
                <span className="text-accent font-black text-[13px]">{progress.current}</span> / <span>{progress.total}</span> trang
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-background/50 backdrop-blur-md rounded-full overflow-hidden border border-border/50 shadow-inner">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500 relative"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
              </div>
            </div>
            
            <div className="flex gap-2 w-full mt-2">
              {pageStatuses.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-2.5 bg-background border border-border text-foreground rounded-xl font-bold text-[11px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:bg-card-hover"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  CSV
                </button>
              )}

              <button
                type="button"
                onClick={runPageStatusScan}
                disabled={pages.length === 0 || scanning}
                className={`flex-1 py-2.5 btn-primary text-white rounded-xl font-bold text-[11px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-md select-none ${
                  pages.length === 0 || scanning
                    ? "opacity-50 cursor-not-allowed shadow-none"
                    : "cursor-pointer"
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 shrink-0 ${pages.length > 0 && !scanning ? "text-white/80" : "text-white/50"} ${scanning ? "animate-spin" : ""}`} />
                Kiểm tra
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
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 border border-transparent text-white text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-orange-500/20"
                >
                  Dừng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LIVE LOG CONSOLE TERMINAL */}
        <div className="flex-1 flex flex-col glass-card p-3 shadow-inner min-h-[150px] xl:min-h-[200px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2 shrink-0">
            <span className="text-[11px] tracking-widest text-foreground font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" />
              NHẬT KÝ HOẠT ĐỘNG
            </span>
            <button 
              type="button"
              onClick={() => setLogs([])}
              className="text-[11px] hover:bg-muted p-1 px-2 rounded-md text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              Xóa
            </button>
          </div>

          {/* Log Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 shrink-0 custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveLogTab("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeLogTab === "all"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              Tất cả
              <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[11px]">
                {logs.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLogTab("success")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeLogTab === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              Thành công
              <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[11px]">
                {logs.filter(log => log.status === "success").length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLogTab("error")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeLogTab === "error"
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              Lỗi
              <span className="bg-background text-foreground/80 px-1.5 rounded-[4px] text-[11px]">
                {logs.filter(log => log.status === "failed").length}
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] p-1 custom-scrollbar pr-2 mt-1">
            {(() => {
              const filtered = logs.filter((log) => {
                if (activeLogTab === "error") return log.status === "failed";
                if (activeLogTab === "success") return log.status === "success";
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <p className="text-slate-500 italic py-2 text-center text-[11px]">
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
                } else if (log.status === "processing") {
                   colorClass = "text-amber-500 font-medium";
                   prefix = "⏱";
                } else if (log.status === "skipped") {
                   colorClass = "text-blue-500 font-medium";
                   prefix = "⏱";
                }

                return (
                  <div 
                    key={log.id} 
                    className={`${colorClass} flex gap-1.5 items-center leading-relaxed bg-background/40 hover:bg-background/80 px-2 py-1.5 rounded-lg border border-border/20 transition-colors w-full overflow-hidden`}
                    title={`${log.pageName}: ${log.message}`}
                  >
                    <span className="shrink-0 text-muted-foreground font-normal text-[11px]">[{log.time}]</span>
                    <span className="shrink-0 font-bold text-[11px]">{prefix}</span>
                    <span className="truncate min-w-0" style={{ lineHeight: '1.2' }}>{log.pageName}: {log.message}</span>
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
