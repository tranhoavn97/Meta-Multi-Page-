import React, { useState, useRef } from "react";
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
  pageStatuses: PageStatusRecord[];
  scanning: boolean;
  progress: { current: number; total: number };
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  runPageStatusScan: () => void;
  stopScan: () => void;
}

export default function PageStatusTab({
  pages,
  userToken,
  pageStatuses,
  scanning,
  progress,
  logs,
  setLogs,
  runPageStatusScan,
  stopScan
}: PageStatusTabProps) {

const addLog = (pageName: string, message: string, status: "success" | "failed" | "processing" | "skipped") => {
  const time = new Date().toLocaleTimeString("vi-VN");
  setLogs(prev => [
    { id: Date.now().toString() + Math.random(), time, pageName, message, status },
    ...prev
  ]);
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
        {/* TOP CONTROL CENTER: METRICS */}
        <div className="glass-card border border-border rounded-[20px] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-sm">
          
          {/* Metrics Row */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-background/40 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">TỔNG PAGE</p>
              <p className="text-xl font-black text-foreground mt-0.5 select-none font-mono">{pages.length}</p>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">BÌNH THƯỜNG</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? normalCount : "-"}
              </p>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">THIẾU QUYỀN</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? missingPermsCount : "-"}
              </p>
            </div>
            <div className="bg-rose-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(244,63,94,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">TOKEN LỖI</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? tokenErrorCount : "-"}
              </p>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center col-span-2 md:col-span-1 transition-all shadow-[0_4px_12px_rgba(168,85,247,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">NGHI HẠN CHẾ</p>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 select-none font-mono">
                {totalChecked > 0 ? restrictedCount : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 glass-card border flex flex-col overflow-hidden min-h-0 shadow-sm rounded-[24px]">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-transparent px-3 pb-3">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-2 z-10 select-none drop-shadow-sm">
                <tr className="group">
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border border-white/20 border-r-0 rounded-l-[20px]">Fanpage</th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Page ID</th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Category</th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Quyền tác vụ</th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Token riêng</th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Lấy bài viết</th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Trạng thái</th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-amber-600 lg:w-[15%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Chi tiết lỗi</th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border border-white/20 border-l-0 rounded-r-[20px]">Hành động của Meta</th>
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
                          <span className="opacity-60 font-mono text-[10px] text-muted-foreground">Không có</span>
                        ) : (
                          row.tasks.map((task, i) => (
                            <span key={i} className="bg-muted border border-border px-1.5 py-0.5 rounded shadow-sm text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
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
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-[10px] px-2 py-0.5 text-[10px] shadow-sm font-bold">Thành công</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-[10px] px-2 py-0.5 text-[10px] shadow-sm font-bold">Thất bại</span>
                      )}
                    </td>
                    <td className="p-3.5">
                       <span className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold tracking-wide inline-block leading-none shadow-sm ${statusColor}`}>
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
    </div>
    </div>

      {/* RIGHT SIDEBAR: PROGRESS AND LOGS & ACTIONS */}
      <aside className="w-full xl:w-[260px] 2xl:w-[300px] bg-card border border-border rounded-2xl p-3 shrink-0 flex flex-col gap-4 shadow-sm h-[auto] xl:h-full overflow-y-auto">
        
        {/* PROGRESS BAR PANEL */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
              <span>Tiến trình quét</span>
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
                <span className="text-accent font-black">{progress.current}</span> / <span className="text-muted-foreground">{progress.total}</span> trang
              </span>
            </div>
            
            <div className="flex gap-2 w-full mt-2">
              {pageStatuses.length > 0 && (
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
                onClick={runPageStatusScan}
                disabled={pages.length === 0 || scanning}
                className={`flex-1 py-2.5 btn-primary text-white rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-md select-none ${
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
                  onClick={stopScan}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 border border-transparent text-white text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer animate-pulse shadow-md shadow-orange-500/20"
                >
                  Dừng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LIVE LOG CONSOLE TERMINAL */}
        <div className="flex-1 flex flex-col bg-muted/40 rounded-xl p-3 shadow-inner min-h-[150px] overflow-hidden border border-border">
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

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-accent p-1 custom-scrollbar pr-1 flex flex-col-reverse">
            {logs.length === 0 ? (
              <p className="text-muted-foreground/50 italic py-1">Chưa có nhật ký...</p>
            ) : (
              logs.map((log) => {
                let tagColor = "text-accent";
                if (log.status === "success") tagColor = "text-emerald-600 font-bold";
                if (log.status === "failed") tagColor = "text-rose-600 font-black";
                if (log.status === "skipped") tagColor = "text-muted-foreground font-medium";

                return (
                  <div key={log.id} className="py-1.5 border-b border-border/50 leading-relaxed flex items-start gap-2 break-words">
                    <span className="text-muted-foreground font-bold select-none shrink-0">[{log.time.split(" ")[1] || log.time}]</span>
                    <span className={`${tagColor} max-w-[80px] xl:max-w-[100px] truncate select-none font-bold shrink-0`} title={log.pageName}>
                      {log.pageName}
                    </span>
                    <span className="text-foreground/80 select-text leading-relaxed">{log.message}</span>
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
