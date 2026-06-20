import { useState } from "react";
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

  const addLog = (pageName: string, message: string, status: "success" | "failed" | "processing" | "skipped") => {
    const time = new Date().toLocaleTimeString("vi-VN");
    setLogs(prev => [
      { id: Date.now().toString() + Math.random(), time, pageName, message, status },
      ...prev
    ]);
  };

  const runPageStatusScan = async () => {
    if (!userToken) {
      // Use logs instead of intrusive alert windows inside iframe sandbox
      addLog("Hệ thống", "Không tìm thấy token Facebook của người dùng. Vui lòng kết nối trước.", "failed");
      return;
    }
    if (pages.length === 0) {
      addLog("Hệ thống", "Không có Fanpage nào để quét. Hãy chắc chắn bạn đã tải danh sách Fanpage thành công.", "skipped");
      return;
    }

    setScanning(true);
    setPageStatuses([]);
    setLogs([]);
    setProgress({ current: 0, total: pages.length });

    addLog("Hàng đợi", `Bắt đầu quét kiểm tra trạng thái toàn bộ ${pages.length} Fanpage...`, "processing");

    let itemsProcessed = 0;
    
    for (const page of pages) {
      setProgress({ current: itemsProcessed, total: pages.length });
      addLog(page.name, `Đang quét kiểm tra quyền và kết nối...`, "processing");

      try {
        // Safe await delay of 350ms to stay within instructions range 300ms-500ms
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
    <div className="flex flex-col gap-4 min-h-0 w-full text-white">
      {/* 1. METRICS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center transition-all hover:bg-white/10">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">TỔNG PAGE</p>
          <p className="text-2xl font-black text-white mt-1 select-none font-mono">{pages.length}</p>
          <div className="text-[9px] text-white/30 mt-1">Đã kết nối</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-center transition-all hover:bg-emerald-500/15">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">BÌNH THƯỜNG</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 select-none font-mono">
            {totalChecked > 0 ? normalCount : "-"}
          </p>
          <div className="text-[9px] text-emerald-400/40 mt-1">Hoạt động tốt</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-center transition-all hover:bg-amber-500/15">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-300">THIẾU QUYỀN</p>
          <p className="text-2xl font-black text-amber-400 mt-1 select-none font-mono">
            {totalChecked > 0 ? missingPermsCount : "-"}
          </p>
          <div className="text-[9px] text-amber-400/40 mt-1">Cần cấp lại</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 text-center transition-all hover:bg-rose-500/15">
          <p className="text-[10px] uppercase font-bold tracking-wider text-rose-300">TOKEN LỖI</p>
          <p className="text-2xl font-black text-rose-400 mt-1 select-none font-mono">
            {totalChecked > 0 ? tokenErrorCount : "-"}
          </p>
          <div className="text-[9px] text-rose-400/40 mt-1">Hết hạn phiên</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3.5 text-center col-span-2 md:col-span-1 transition-all hover:bg-purple-500/15">
          <p className="text-[10px] uppercase font-bold tracking-wider text-purple-300">NGHI HẠN CHẾ</p>
          <p className="text-2xl font-black text-purple-400 mt-1 select-none font-mono">
            {totalChecked > 0 ? restrictedCount : "-"}
          </p>
          <div className="text-[9px] text-purple-400/40 mt-1">Hạn chế tính năng</div>
        </div>
      </div>

      {/* 2. COMMAND ACTION BAR & PROGRESS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-extrabold tracking-wide uppercase text-white/90">Trình quét & Kiểm tra Trạng thái API</h3>
          <p className="text-[11px] text-white/50">Kiểm tra thông tin chi tiết quyền tác vụ của từng Fanpage đã kết nối</p>
        </div>

        <div className="flex items-center gap-2">
          {pageStatuses.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/25 text-white border border-white/25 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất CSV
            </button>
          )}

          <button
            onClick={runPageStatusScan}
            disabled={scanning || pages.length === 0}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-white/5 disabled:to-white/5 disabled:text-white/40 disabled:border-white/5 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/30 border border-blue-500/30"
          >
            <RotateCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "Đang quét..." : "Kiểm tra lại toàn bộ"}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      {scanning && (
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl shrink-0">
          <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold select-none text-white/80">
            <span>TIẾN TRÌNH QUÉT CHI TIẾT SYSTEM:</span>
            <span>{progress.current} / {progress.total} Pages ({Math.round((progress.current / progress.total) * 100)}%)</span>
          </div>
          <div className="w-full bg-[#051121] rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 3. TABLE OF RESULTS */}
      <div className="flex-1 min-h-[220px] bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto max-h-[350px] min-h-[140px] flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#071322] z-10 border-b border-white/15 select-none">
              <tr>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[18%]">Fanpage</th>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[15%]">Page ID</th>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[12%]">Category</th>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[15%]">Quyền tác vụ</th>
                <th className="p-3.5 text-center text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[8%]">Token</th>
                <th className="p-3.5 text-center text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[10%]">Lấy bài viết</th>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[12%]">Trạng thái</th>
                <th className="p-3.5 text-left text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[15%] text-amber-200">Chi tiết lỗi</th>
                <th className="p-3.5 text-center text-[10px] font-extrabold tracking-wider uppercase text-white/50 w-[15%]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px] font-medium text-white/95">
              {pageStatuses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-white/40">
                    <Info className="w-8 h-8 mx-auto opacity-35 mb-2" />
                    Không có thông tin kiểm tra. Vui lòng click nút <strong className="text-white/70">"Kiểm tra lại toàn bộ"</strong> để bắt đầu phân tích trạng thái các Page.
                  </td>
                </tr>
              ) : (
                pageStatuses.map((row) => {
                  let statusColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/25";
                  if (row.status.includes("Thiếu quyền")) {
                    statusColor = "bg-amber-500/20 text-amber-300 border-amber-500/25";
                  } else if (row.status.includes("lỗi") || row.status.includes("hết hạn")) {
                    statusColor = "bg-rose-500/20 text-rose-300 border-rose-500/25";
                  } else if (row.status.includes("hạn chế") || row.status.includes("Nghi bị hạn chế")) {
                    statusColor = "bg-purple-500/20 text-purple-300 border-purple-500/25";
                  } else if (row.status.includes("kiểm tra thủ công")) {
                    statusColor = "bg-cyan-500/20 text-cyan-300 border-cyan-500/25";
                  }

                  return (
                    <tr key={row.pageId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold select-all font-sans text-xs flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600/20 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                          <span className="text-[10px] font-bold text-blue-300">{row.name.substring(0, 1).toUpperCase()}</span>
                        </div>
                        <span className="truncate max-w-[120px]" title={row.name}>{row.name}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] select-all opacity-80">{row.pageId}</td>
                      <td className="p-3 text-white/70 truncate max-w-[100px]">{row.category}</td>
                      <td className="p-3 text-[10px] font-sans">
                        <div className="flex flex-wrap gap-1">
                          {row.tasks.length === 0 ? (
                            <span className="opacity-50 font-mono text-[9px]">Không xác định</span>
                          ) : (
                            row.tasks.map((task, i) => (
                              <span key={i} className="bg-white/15 px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white/90">
                                {task}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {row.hasPageAccessToken ? (
                          <span className="text-emerald-400 font-bold font-sans">CÓ</span>
                        ) : (
                          <span className="text-rose-400 font-bold font-sans">KHÔNG</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.postsSuccess ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-full px-1.5 py-0.5 text-[9px]">OKE CHÉC</span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-full px-1.5 py-0.5 text-[9px]">LỖI ĐỌC</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold inline-block leading-tight ${statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] max-w-[160px] truncate text-rose-300/80 font-mono" title={row.detail}>
                        {row.detail || <span className="text-white/30 italic">Không có lỗi</span>}
                      </td>
                      <td className="p-3">
                        <div className="grid grid-cols-2 gap-1 w-[200px]">
                          <a 
                            href={`https://www.facebook.com/${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded text-[9px] font-bold text-center flex items-center justify-center gap-0.5 text-blue-200 transition-all border border-white/5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Mở Page
                          </a>
                          <a 
                            href={`https://business.facebook.com/latest/home?asset_id=${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded text-[9px] font-bold text-center flex items-center justify-center gap-0.5 text-indigo-200 transition-all border border-white/5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Suite
                          </a>
                          <a 
                            href="https://business.facebook.com/latest/page_quality"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded text-[9px] font-bold text-center flex items-center justify-center gap-0.5 text-amber-200 transition-all border border-white/5 col-span-1"
                          >
                            <ShieldAlert className="w-2.5 h-2.5 text-amber-300" />
                            Page Quality
                          </a>
                          <a 
                            href="https://business.facebook.com/latest/monetization"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded text-[9px] font-bold text-center flex items-center justify-center gap-0.5 text-purple-200 transition-all border border-white/5 col-span-1"
                          >
                            <AlertCircle className="w-2.5 h-2.5 text-purple-300" />
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

      {/* 4. REAL-TIME LOG AREA */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 shrink-0">
        <h4 className="text-[10px] font-extrabold tracking-wider text-white/60 mb-2 uppercase flex items-center gap-1.5 border-b border-white/10 pb-1.5 select-none">
          <Activity className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          Nhật ký Quét Trạng thái Thời gian thực (Real-time Console)
        </h4>

        <div className="bg-[#030a13] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-white/90 h-[100px] overflow-y-auto flex flex-col-reverse custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-white/30 italic select-none">Chưa có bản ghi hoạt động nào. Tiến trình quét trạng thái sẽ được ghi lại chi tiết trực tiếp tại đây...</div>
          ) : (
            logs.map((log) => {
              let tagColor = "text-blue-300";
              if (log.status === "success") tagColor = "text-emerald-400";
              if (log.status === "failed") tagColor = "text-rose-400 font-bold";
              if (log.status === "skipped") tagColor = "text-white/50";

              return (
                <div key={log.id} className="py-0.5 border-b border-white/5 leading-relaxed flex gap-2">
                  <span className="text-white/40 font-semibold select-none">{log.time}</span>
                  <span className={`${tagColor} max-w-[120px] truncate select-none border-r border-white/10 pr-2 font-bold`}>
                    [{log.pageName}]
                  </span>
                  <span className="text-white/90 whitespace-pre-wrap select-text">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
