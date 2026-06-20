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
  Activity
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
const [progress, setProgress] = useState({ current: 0, total: 0 });
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
  setProgress({ current: 0, total: pages.length });

  addLog("Hàng đợi", `Bắt đầu quét kiểm tra trạng thái toàn bộ ${pages.length} Fanpage...`, "processing");

  let itemsProcessed = 0;
  
  for (const page of pages) {
    if (cancelScanRef.current) {
      addLog("Hàng đợi", "Đã dừng chương trình kiểm tra bởi yêu cầu người dùng.", "skipped");
      break;
    }
    setProgress({ current: itemsProcessed, total: pages.length });
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

  setProgress({ current: pages.length, total: pages.length });
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
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full text-slate-100">
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden h-full">
        {/* TOP CONTROL CENTER: METRICS */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-lg">
          
          {/* Metrics Row */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">TỔNG PAGE</p>
              <p className="text-xl font-black text-white mt-0.5 select-none font-mono">{pages.length}</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">BÌNH THƯỜNG</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? normalCount : "-"}
              </p>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">THIẾU QUYỀN</p>
              <p className="text-xl font-black text-amber-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? missingPermsCount : "-"}
              </p>
            </div>
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400">TOKEN LỖI</p>
              <p className="text-xl font-black text-rose-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? tokenErrorCount : "-"}
              </p>
            </div>
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 text-center col-span-2 md:col-span-1 transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">NGHI HẠN CHẾ</p>
              <p className="text-xl font-black text-purple-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? restrictedCount : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-700/60 rounded-2xl flex flex-col overflow-hidden min-h-0 shadow-lg">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-800 select-none">
            <tr>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[15%]">Fanpage</th>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[12%]">Page ID</th>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[10%]">Category</th>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[12%]">Quyền tác vụ</th>
              <th className="p-3.5 text-center text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[8%]">Token riêng</th>
              <th className="p-3.5 text-center text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[8%]">Lấy bài viết</th>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[10%]">Trạng thái</th>
              <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-amber-400 w-[15%]">Chi tiết lỗi</th>
              <th className="p-3.5 text-center text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[10%]">Hành động của Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs font-medium text-slate-200">
            {pageStatuses.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  <Info className="w-10 h-10 mx-auto opacity-40 mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-100">Chưa có thông tin kiểm tra</p>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng click nút <strong className="text-blue-400">"Chạy kiểm tra toàn bộ"</strong> để bắt đầu quét quyền hoạt động.</p>
                </td>
              </tr>
            ) : (
              pageStatuses.map((row) => {
                let statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                if (row.status.includes("Thiếu quyền")) {
                  statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                } else if (row.status.includes("lỗi") || row.status.includes("hết hạn")) {
                  statusColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                } else if (row.status.includes("hạn chế") || row.status.includes("Nghi bị hạn chế")) {
                  statusColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                } else if (row.status.includes("kiểm tra thủ công")) {
                  statusColor = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
                }

                return (
                  <tr key={row.pageId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold select-all font-sans text-xs flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full neu-button-primary/30 overflow-hidden flex items-center justify-center border border-slate-700 shrink-0">
                        <span className="text-xs font-black text-blue-300">{row.name.substring(0, 1).toUpperCase()}</span>
                      </div>
                      <span className="truncate max-w-[140px] text-slate-100 leading-snug" title={row.name}>{row.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-xs select-all text-slate-300 opacity-90">{row.pageId}</td>
                    <td className="p-3.5 text-slate-400 truncate max-w-[110px]">{row.category}</td>
                    <td className="p-3.5 text-xs font-sans">
                      <div className="flex flex-wrap gap-1">
                        {row.tasks.length === 0 ? (
                          <span className="opacity-50 font-mono text-[10px]">Không có</span>
                        ) : (
                          row.tasks.map((task, i) => (
                            <span key={i} className="bg-slate-800 border border-slate-700/80 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-slate-300">
                              {task}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {row.hasPageAccessToken ? (
                        <span className="text-emerald-400 font-extrabold text-xs">CÓ</span>
                      ) : (
                        <span className="text-rose-400 font-extrabold text-xs">KHÔNG</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.postsSuccess ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl px-2 py-0.5 text-[10px] font-bold">Thành công</span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl px-2 py-0.5 text-[10px] font-bold">Thất bại</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide inline-block leading-none ${statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs max-w-[170px] truncate text-rose-300/90 font-mono" title={row.detail}>
                      {row.detail || <span className="text-slate-500 italic">Không tìm thấy lỗi</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="grid grid-cols-2 gap-1.5 w-[210px] mx-auto">
                        <a 
                          href={`https://www.facebook.com/${row.pageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-blue-300 transition-all border border-slate-750"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                          Mở Page
                        </a>
                        <a 
                          href={`https://business.facebook.com/latest/home?asset_id=${row.pageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-indigo-300 transition-all border border-slate-750"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                          Meta Suite
                        </a>
                        <a 
                          href="https://business.facebook.com/latest/page_quality"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-amber-300 transition-all border border-slate-750 col-span-1"
                        >
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          Chất lượng
                        </a>
                        <a 
                          href="https://business.facebook.com/latest/monetization"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-purple-300 transition-all border border-slate-750 col-span-1"
                        >
                          <AlertCircle className="w-3 h-3 text-purple-400" />
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
    </div>
    </div>

      {/* RIGHT SIDEBAR: PROGRESS AND LOGS & ACTIONS */}
      <aside className="w-full xl:w-[260px] 2xl:w-[300px] glass-card rounded-2xl p-3 shrink-0 flex flex-col gap-4 shadow-xl h-[auto] xl:h-full overflow-y-auto">
        
        {/* PROGRESS BAR PANEL */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-slate-300">
              <span>Tiến trình quét trạng thái</span>
              <span className="font-mono text-blue-400 text-[10px] bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded">
                {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(96,165,250,0.5)]"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-slate-200">
                <span className="text-indigo-300 font-black">{progress.current}</span> / <span>{progress.total}</span> trang
              </span>
            </div>
            
            <div className="flex gap-2 w-full mt-2">
              {pageStatuses.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-white rounded-lg font-bold text-[9px] xl:text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer select-none active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  CSV
                </button>
              )}

              <button
                type="button"
                onClick={runPageStatusScan}
                disabled={pages.length === 0 || scanning}
                className={`flex-1 py-2 neu-button text-white rounded-lg font-black text-[9px] xl:text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1 shadow-md select-none ${
                  pages.length === 0 || scanning
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer active:scale-95"
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 shrink-0 ${pages.length > 0 && !scanning ? "text-blue-300" : "text-slate-500"} ${scanning ? "animate-spin" : ""}`} />
                Kiểm tra
              </button>
            </div>

            {scanning && (
              <div className="flex gap-2 w-full mt-1">
                <button
                  type="button"
                  onClick={() => {
                    cancelScanRef.current = true;
                    addLog("Yêu cầu", "Đang gửi tín hiệu dừng tiến trình quét...", "skipped");
                  }}
                  className="w-full py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/30 text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-rose-900/30"
                >
                  Dừng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LIVE LOG CONSOLE TERMINAL */}
        <div className="flex-1 flex flex-col neu-panel rounded-xl p-2.5 shadow-inner min-h-[150px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Logs
            </span>
            <button 
              type="button"
              onClick={() => setLogs([])}
              className="text-[9px] hover:underline text-slate-400 hover:text-white font-bold"
            >
              Xóa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px] text-emerald-300 custom-scrollbar pr-1 flex flex-col-reverse">
            {logs.length === 0 ? (
              <p className="text-white/30 italic">Chưa có nhật ký...</p>
            ) : (
              logs.map((log) => {
                let tagColor = "text-blue-300";
                if (log.status === "success") tagColor = "text-emerald-400 font-extrabold";
                if (log.status === "failed") tagColor = "text-rose-400 font-black";
                if (log.status === "skipped") tagColor = "text-slate-400";

                return (
                  <div key={log.id} className="py-1 border-b border-slate-900 leading-normal flex items-start gap-1.5 break-words">
                    <span className="text-slate-500 font-bold select-none shrink-0">[{log.time.split(" ")[1] || log.time}]</span>
                    <span className={`${tagColor} max-w-[80px] xl:max-w-[100px] truncate select-none border-r border-slate-800 pr-1.5 font-black shrink-0`} title={log.pageName}>
                      {log.pageName}
                    </span>
                    <span className="text-slate-200 select-text leading-relaxed">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
