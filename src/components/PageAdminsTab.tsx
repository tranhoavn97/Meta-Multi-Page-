import { useState } from "react";
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
    // progress totals = businesses counts + pages check
    const totalSteps = pages.length + (bmList.length > 0 ? bmList.length : 0);
    setProgress({ current: 0, total: totalSteps });
    
    let currentStepNum = 0;
    const pageToBmMap: Record<string, { businessName: string; businessId: string; type: "Owned Page" | "Client Page" }> = {};

    if (bmList.length > 0) {
      for (const bm of bmList) {
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
      currentStepNum++;
      setProgress({ current: currentStepNum, total: totalSteps });
      
      const mapInfo = pageToBmMap[page.id];
      const tasks = page.tasks || [];
      const hasPageToken = !!page.access_token;
      
      // Compute status based on tasks
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
    <div className="flex flex-col gap-4 min-h-0 w-full text-white">
      {/* 1. BM PERMISSION ALERT STATEMENT */}
      {hasBmPermission === false && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-3 text-amber-200 shrink-0">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="block text-amber-300 font-semibold mb-0.5">Quyền business_management Chưa Sẵn Sàng:</strong>
            Mã truy cập Facebook của bạn chưa chứa quyền phân lớp quản lý BM. App sẽ tiếp tục quét các mô hình page, tuy nhiên sẽ không thể map chéo tên Business Manager sở hữu. Bạn có thể cấp thêm quyền này khi đăng nhập lại.
          </div>
        </div>
      )}

      {/* 2. KPI METRICS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 shrink-0">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center transition-all hover:bg-white/10">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/50">TỔNG PAGE</p>
          <p className="text-xl font-black text-white mt-0.5 font-mono">{pages.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5 text-center transition-all hover:bg-emerald-500/15">
          <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-300">QUYỀN QUẢN LÝ</p>
          <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">
            {pageAdmins.length > 0 ? hasManageRights : "-"}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-2.5 text-center transition-all hover:bg-blue-500/15">
          <p className="text-[9px] uppercase font-bold tracking-wider text-blue-300">QUYỀN ĐĂNG BÀI</p>
          <p className="text-xl font-black text-blue-400 mt-0.5 font-mono">
            {pageAdmins.length > 0 ? hasCreateRights : "-"}
          </p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-2.5 text-center transition-all hover:bg-purple-500/15">
          <p className="text-[9px] uppercase font-bold tracking-wider text-purple-300">NẰM TRONG BM</p>
          <p className="text-xl font-black text-purple-400 mt-0.5 font-mono">
            {pageAdmins.length > 0 ? inBmCount : "-"}
          </p>
        </div>
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-2.5 text-center transition-all hover:bg-teal-500/15">
          <p className="text-[9px] uppercase font-bold tracking-wider text-teal-300">CHƯA XÁC ĐỊNH BM</p>
          <p className="text-xl font-black text-teal-400 mt-0.5 font-mono">
            {pageAdmins.length > 0 ? noBmCount : "-"}
          </p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-2.5 text-center transition-all hover:bg-rose-500/15">
          <p className="text-[9px] uppercase font-bold tracking-wider text-rose-300">PAGE THIẾU QUYỀN</p>
          <p className="text-xl font-black text-rose-400 mt-0.5 font-mono">
            {pageAdmins.length > 0 ? missingCount : "-"}
          </p>
        </div>
      </div>

      {/* 3. CONTROL CENTER BAR */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-white/50 uppercase font-black tracking-wide mr-1 select-none">Lọc Danh Sách:</span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "manage", label: "Có quyền quản lý" },
            { id: "create", label: "Có quyền đăng/xoá" },
            { id: "missing", label: "Thiếu quyền" },
            { id: "bm", label: "Nằm trong BM" },
            { id: "no-bm", label: "Chưa xác định BM" },
            { id: "token-err", label: "Token lỗi" }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setFilterType(type.id);
                addLog("Bộ lọc", `Áp dụng hiển thị phân loại [${type.label}]`, "skipped");
              }}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition-all border ${
                filterType === type.id
                  ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Buttons Group */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {pageAdmins.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất CSV
            </button>
          )}

          <button
            onClick={runAdminsBMScan}
            disabled={scanning || pages.length === 0}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-white/5 disabled:to-white/5 disabled:text-white/40 disabled:border-white/5 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/30 border border-blue-500/30 font-sans"
          >
            <RotateCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "Đang check..." : "Kiểm tra quyền & BM"}
          </button>
        </div>
      </div>

      {/* PROGRESS CONTAINER */}
      {scanning && (
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl shrink-0 select-none">
          <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold text-white/80">
            <span>TIẾN ĐỘ KIỂM TRA MÔ HÌNH HỆ THỐNG:</span>
            <span>{progress.current} / {progress.total} bước ({Math.round((progress.current / progress.total) * 100)}%)</span>
          </div>
          <div className="w-full bg-[#051121] rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 4. MAIN INTERACTIVE TABLE */}
      <div className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[350px] min-h-[140px] flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#071322] z-10 border-b border-white/15 select-none text-[10px] uppercase font-extrabold tracking-wider text-white/50">
              <tr>
                <th className="p-3.5 text-left w-[20%]">Fanpage</th>
                <th className="p-3.5 text-left w-[15%]">Page ID</th>
                <th className="p-3.5 text-left w-[12%]">Category</th>
                <th className="p-3.5 text-left w-[20%]">Quyền của tôi</th>
                <th className="p-3.5 text-left w-[15%]">Business Manager</th>
                <th className="p-3.5 text-left w-[15%]">Business ID</th>
                <th className="p-3.5 text-left w-[12%]">Loại Page</th>
                <th className="p-3.5 text-left w-[10%]">Trạng thái</th>
                <th className="p-3.5 text-center w-[12%]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px] font-medium text-white/95">
              {filteredPageAdmins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-white/40">
                    <Info className="w-8 h-8 mx-auto opacity-35 mb-2" />
                    Không tìm thấy bản ghi nào khớp bộ lọc. Nhấn nút <strong className="text-white/70">"Kiểm tra quyền & BM"</strong> để quét thông tin cấu trúc quản trị.
                  </td>
                </tr>
              ) : (
                filteredPageAdmins.map((row) => {
                  let statusBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/25";
                  if (row.status === "Thiếu quyền") {
                    statusBg = "bg-amber-500/20 text-amber-300 border-amber-500/25";
                  } else if (row.status === "Token lỗi") {
                    statusBg = "bg-rose-500/20 text-rose-300 border-rose-500/25";
                  }

                  let typeBg = "bg-white/10 text-white/60 border-white/10";
                  if (row.businessType === "Owned Page") {
                    typeBg = "bg-purple-500/20 text-purple-300 border-purple-500/25";
                  } else if (row.businessType === "Client Page") {
                    typeBg = "bg-teal-500/20 text-teal-300 border-teal-500/25";
                  }

                  return (
                    <tr key={row.pageId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-xs flex items-center gap-2 select-all">
                        <div className="w-6 h-6 rounded-full bg-blue-600/20 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                          <span className="text-[10px] font-bold text-blue-300">{row.name.substring(0,1).toUpperCase()}</span>
                        </div>
                        <span className="truncate max-w-[140px]" title={row.name}>{row.name}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] opacity-80 select-all">{row.pageId}</td>
                      <td className="p-3 text-white/60 truncate max-w-[100px]" title={row.category}>{row.category}</td>
                      <td className="p-3 text-[10.5px]">
                        <span className="font-semibold text-white/90">{getTaskLabels(row.tasks)}</span>
                      </td>
                      <td className="p-3 font-semibold text-xs capitalize truncate max-w-[120px]" title={row.businessName}>
                        {row.businessName === "N/A" ? (
                          <span className="opacity-45 font-mono italic text-[10px]">Không xác định</span>
                        ) : (
                          row.businessName
                        )}
                      </td>
                      <td className="p-3 font-mono text-[10px] opacity-70">
                        {row.businessId === "N/A" ? (
                          <span className="opacity-35 font-mono">—</span>
                        ) : (
                          row.businessId
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded border text-[9.5px] font-bold ${typeBg}`}>
                          {row.businessType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-bold ${statusBg}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col gap-1 w-[120px] mx-auto">
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
                            Business Suite
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

      {/* 5. MONITOR LOGS LOGGING AREA */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 shrink-0">
        <h4 className="text-[10px] font-extrabold tracking-wider text-white/60 mb-2 uppercase flex items-center gap-1.5 border-b border-white/10 pb-1.5 select-none">
          <Activity className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
          Nhật ký Kiểm tra Quản trị & business_management (BM Console)
        </h4>

        <div className="bg-[#030a13] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-white/90 h-[100px] overflow-y-auto flex flex-col-reverse custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-white/30 italic select-none">Chưa có nhật ký hoạt động kiểm tra quyền quản trị nào được chạy. Click vào "Kiểm tra quyền & BM" để bắt đầu nạp log trực tiếp...</div>
          ) : (
            logs.map((log) => {
              let tagColor = "text-teal-300";
              if (log.status === "success") tagColor = "text-emerald-400";
              if (log.status === "failed") tagColor = "text-rose-400 font-bold";
              if (log.status === "skipped") tagColor = "text-white/50";

              return (
                <div key={log.id} className="py-0.5 border-b border-white/5 leading-relaxed flex gap-2">
                  <span className="text-white/40 font-semibold select-none">{log.time}</span>
                  <span className={`${tagColor} max-w-[120px] truncate select-none border-r border-white/10 pr-2 font-bold`}>
                    [{log.context}]
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
