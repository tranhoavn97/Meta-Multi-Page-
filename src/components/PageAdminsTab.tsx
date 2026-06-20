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
}

export default function PageAdminsTab({ pages, userToken }: PageAdminsTabProps) {
  const [pageAdmins, setPageAdmins] = useState<PageAdminRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<{ id: string; time: string; context: string; message: string; status: "success" | "failed" | "processing" | "skipped" }[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
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
    setProgress({ current: 0, total: 1 });

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
    setProgress({ current: 0, total: totalSteps });
    
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
        setProgress({ current: currentStepNum, total: totalSteps });
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
      setProgress({ current: currentStepNum, total: totalSteps });
      
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
    setProgress({ current: totalSteps, total: totalSteps });
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
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-3.5 overflow-hidden min-h-0 h-full text-slate-100">
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden h-full">

        {/* 1. BM PERMISSION ALERT STATEMENT */}
        {hasBmPermission === false && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5 text-amber-200 shrink-0 shadow-md">
            <ShieldAlert className="w-5.5 h-5.5 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-amber-300 font-extrabold mb-0.5 uppercase tracking-wide">Quyền business_management Chưa Sẵn Sàng:</strong>
              Mã truy cập Facebook của bạn chưa chứa quyền phân lớp quản lý BM. App vẫn hiển thị quyền hạn, nhưng không thể định vị chéo tên Business Manager sở hữu. Bạn có thể cấp thêm quyền này khi đăng nhập lại.
            </div>
          </div>
        )}

        {/* 2. TOP CONTROL CENTER: METRICS, FILTERS */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-xl">
          
          {/* Metrics Row (Left side on large screens) */}
          <div className="flex-1 grid grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">TỔNG PAGE</p>
              <p className="text-xl font-black text-white mt-0.5 select-none font-mono">{pages.length}</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">QUYỀN QUẢN LÝ</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? hasManageRights : "-"}
              </p>
            </div>
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-blue-400">QUYỀN ĐĂNG BÀI</p>
              <p className="text-xl font-black text-blue-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? hasCreateRights : "-"}
              </p>
            </div>
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">NẰM TRONG BM</p>
              <p className="text-xl font-black text-purple-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? inBmCount : "-"}
              </p>
            </div>
            <div className="bg-teal-950/40 border border-teal-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-teal-400">CHƯA KHỞI TẠO BM</p>
              <p className="text-xl font-black text-teal-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? noBmCount : "-"}
              </p>
            </div>
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 text-center transition-all">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400">THIẾU QUYỀN HẠN</p>
              <p className="text-xl font-black text-rose-400 mt-0.5 select-none font-mono">
                {pageAdmins.length > 0 ? missingCount : "-"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider select-none hidden sm:inline-block">Lọc Bộ Lọc:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterType(val);
                  const label = e.target.options[e.target.selectedIndex].text;
                  addLog("Bộ lọc", `Áp dụng hiển thị phân loại [${label}]`, "skipped");
                }}
                className="h-10 px-3 bg-slate-800 border border-slate-700/65 text-slate-200 text-[11px] font-extrabold tracking-wide rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="all">Tất cả</option>
                <option value="manage">Có quyền quản lý</option>
                <option value="create">Có quyền đăng/xoá</option>
                <option value="missing">Thiếu quyền</option>
                <option value="bm">Nằm trong BM</option>
                <option value="no-bm">Chưa xác định BM</option>
                <option value="token-err">Token lỗi</option>
              </select>
            </div>
          </div>
        </div>

  

      {/* 4. MAIN INTERACTIVE TABLE */}
      <div className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl flex flex-col overflow-hidden min-h-0 shadow-xl">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-800 select-none">
              <tr>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[15%]">Fanpage</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[12%]">Page ID</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[10%]">Category</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[15%]">Quyền của tôi</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[12%]">Business Manager</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[12%]">Business ID</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-400 w-[8%]">Phân loại</th>
                <th className="p-3.5 text-left text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[8%]">Trạng thái</th>
                <th className="p-3.5 text-center text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-300 w-[8%]">FB Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs font-medium text-slate-200">
              {filteredPageAdmins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Info className="w-10 h-10 mx-auto opacity-40 mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-100">Chứa kết quả quyền hạn quản trị</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng click <strong className="text-blue-400">"Kiểm tra quyền & BM"</strong> để trích xuất quyền và mô hình BM.</p>
                  </td>
                </tr>
              ) : (
                filteredPageAdmins.map((row) => {
                  let statusBg = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  if (row.status === "Thiếu quyền") {
                    statusBg = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  } else if (row.status === "Token lỗi") {
                    statusBg = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                  }

                  let typeBg = "bg-slate-850 text-slate-400 border border-slate-750";
                  if (row.businessType === "Owned Page") {
                    typeBg = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                  } else if (row.businessType === "Client Page") {
                    typeBg = "bg-teal-500/10 text-teal-400 border border-teal-500/20";
                  }

                  return (
                    <tr key={row.pageId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold select-all font-sans text-xs flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full neu-button-primary/30 overflow-hidden flex items-center justify-center border border-slate-700 shrink-0">
                          <span className="text-xs font-black text-blue-300">{row.name.substring(0,1).toUpperCase()}</span>
                        </div>
                        <span className="truncate max-w-[140px] text-slate-100 leading-snug" title={row.name}>{row.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-xs select-all text-slate-300 opacity-90">{row.pageId}</td>
                      <td className="p-3.5 text-slate-400 truncate max-w-[110px]" title={row.category}>{row.category}</td>
                      <td className="p-3.5 text-xs font-sans">
                        <span className="font-extrabold text-slate-100">{getTaskLabels(row.tasks)}</span>
                      </td>
                      <td className="p-3.5 font-extrabold text-xs capitalize truncate max-w-[130px] text-slate-200" title={row.businessName}>
                        {row.businessName === "N/A" ? (
                          <span className="opacity-45 font-mono italic text-[11px] text-slate-500">Ngoại vi (N/A)</span>
                        ) : (
                          row.businessName
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-slate-350 select-all">
                        {row.businessId === "N/A" ? (
                          <span className="opacity-35 font-mono text-slate-500">—</span>
                        ) : (
                          row.businessId
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${typeBg}`}>
                          {row.businessType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide ${statusBg}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col gap-1 w-[130px] mx-auto">
                          <a 
                            href={`https://www.facebook.com/${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-blue-300 transition-all border border-slate-750"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                            Mở Page FB
                          </a>
                          <a 
                            href={`https://business.facebook.com/latest/home?asset_id=${row.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neu-button px-2 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 text-indigo-300 transition-all border border-slate-755"
                          >
                            <ExternalLink className="w-3 h-3 text-indigo-400" />
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
      <aside className="w-full xl:w-[260px] 2xl:w-[300px] glass-card rounded-2xl p-3 shrink-0 flex flex-col gap-4 shadow-xl h-[auto] xl:h-full overflow-y-auto">
        
        {/* PROGRESS BAR PANEL */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-slate-300">
              <span>Tiến độ thực hiện</span>
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
                <span className="text-indigo-300 font-black">{progress.current}</span> / <span>{progress.total}</span> bước
              </span>
            </div>

            <div className="flex gap-2 w-full mt-2">
              {pageAdmins.length > 0 && (
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
                onClick={runAdminsBMScan}
                disabled={pages.length === 0 || scanning}
                className={`flex-1 py-2 neu-button text-white rounded-lg font-black text-[9px] xl:text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1 shadow-md select-none ${
                  pages.length === 0 || scanning
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer active:scale-95"
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 shrink-0 ${pages.length > 0 && !scanning ? "text-blue-300" : "text-slate-500"} ${scanning ? "animate-spin" : ""}`} />
                Kiểm tra QM
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
                let tagColor = "text-teal-300";
                if (log.status === "success") tagColor = "text-emerald-400 font-extrabold";
                if (log.status === "failed") tagColor = "text-rose-400 font-black";
                if (log.status === "skipped") tagColor = "text-slate-400";

                return (
                  <div key={log.id} className="py-1 border-b border-slate-900 leading-normal flex items-start gap-1.5 break-words">
                    <span className="text-slate-500 font-bold select-none shrink-0">[{log.time.split(" ")[1] || log.time}]</span>
                    <span className={`${tagColor} max-w-[80px] xl:max-w-[100px] truncate select-none border-r border-slate-800 pr-1.5 font-black shrink-0`} title={log.context}>
                      {log.context}
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
