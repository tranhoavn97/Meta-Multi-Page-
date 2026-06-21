import React, { useState, useRef } from "react";
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
  HelpCircle
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
  pageAdmins: PageAdminRecord[];
  scanning: boolean;
  progress: { current: number; total: number };
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  runAdminsBMScan: () => void;
  stopScan: () => void;
  hasBmPermission: boolean | null;
  businesses: any[];
}

import DropdownSelect from "./DropdownSelect";

export default function PageAdminsTab({
  pages,
  userToken,
  pageAdmins,
  scanning,
  progress,
  logs,
  setLogs,
  runAdminsBMScan,
  stopScan,
  hasBmPermission,
  businesses
}: PageAdminsTabProps) {
  const [filterType, setFilterType] = useState<string>("all");

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

        {/* 2. TOP CONTROL CENTER: METRICS, FILTERS */}
        <div className="glass-card border border-border resize-none rounded-[20px] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-sm">
          
          {/* Metrics Row (Left side on large screens) */}
          <div className="flex-1 grid grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-background/40 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">TỔNG PAGE</p>
              <p className="text-xl font-black text-foreground mt-0.5 select-none font-mono">{pages.length}</p>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">QUYỀN QUẢN LÝ</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? hasManageRights : "-"}
              </p>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(59,130,246,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">QUYỀN ĐĂNG BÀI</p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? hasCreateRights : "-"}
              </p>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(168,85,247,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">NẰM TRONG BM</p>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? inBmCount : "-"}
              </p>
            </div>
            <div className="bg-teal-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(20,184,166,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">CHƯA KHỞI TẠO</p>
              <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? noBmCount : "-"}
              </p>
            </div>
            <div className="bg-rose-500/10 backdrop-blur-[24px] border border-white/20 rounded-[14px] p-3 text-center transition-all shadow-[0_4px_12px_rgba(244,63,94,0.05)]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">THIẾU QUYỀN HẠN</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? missingCount : "-"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Dropdown Filter */}
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
        </div>

  

      {/* 4. MAIN INTERACTIVE TABLE */}
      <div className="flex-1 glass-card border flex flex-col overflow-hidden min-h-0 shadow-sm rounded-[24px]">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-transparent px-3 pb-3">
          <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-2 z-10 select-none drop-shadow-sm">
              <tr className="group">
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border border-white/20 border-r-0 rounded-l-[20px]">Fanpage</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Page ID</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[10%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Category</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[15%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Quyền của tôi</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Business Manager</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[12%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Business ID</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Phân loại</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border-y border-white/20">Trạng thái</th>
                <th className="px-5 py-4 text-center text-[10px] font-bold tracking-widest uppercase whitespace-nowrap text-muted-foreground lg:w-[8%] bg-background/40 backdrop-blur-[24px] border border-white/20 border-l-0 rounded-r-[20px]">FB Link</th>
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
                    <span className={`${tagColor} max-w-[80px] xl:max-w-[100px] truncate select-none font-bold shrink-0`} title={log.context}>
                      {log.context}
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
