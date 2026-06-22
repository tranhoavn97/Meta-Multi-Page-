import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE, checkRequiredEnvVars } from "./_lib/meta-config";
import { metaFetchJson } from "./_lib/meta-client";
import { getPageAccessToken } from "./_lib/page-token-store";
import { sanitizeSensitiveText } from "./_lib/sanitize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const envCheck = checkRequiredEnvVars();
    if (!envCheck.valid) {
      return res.status(500).json({
        success: false,
        error: {
          code: "MISSING_SERVER_CONFIG",
          message: "Máy chủ đang thiếu cấu hình cần thiết."
        }
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Chỉ hỗ trợ phương thức POST để kiểm tra chi tiết trạng thái trang."
        }
      });
    }

  const { pageId, pageAccessToken } = req.body || {};
  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Thiếu thông tin pageId nhận dạng trang kiểm tra."
      }
    });
  }

  const userToken = getMetaAccessToken(req);
  if (!userToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Mã truy cập Facebook của bạn đã hết hạn hoặc chưa được tạo.",
        reconnectRequired: true
      }
    });
  }

  let activeToken = pageAccessToken ;
  if (!activeToken) {
    try {
      activeToken = await getPageAccessToken(pageId, userToken);
    } catch {
      activeToken = userToken;
    }
  }

  try {
    const infoUrl = `${GRAPH_API_BASE}/${pageId}?fields=id,name,category,tasks&access_token=${activeToken}`;
    let pageInfo: any = null;
    let infoError: string | null = null;
    let isOAuthError = false;
    let isPermissionError = false;
    let tasks: string[] = [];

    try {
      const result = await metaFetchJson(infoUrl);
      pageInfo = result.data;
      tasks = pageInfo.tasks || [];
    } catch (err: any) {
      infoError = err.message || "Lỗi API truy xuất thông tin";
      if (err.code === "TOKEN_EXPIRED") {
        isOAuthError = true;
      } else if (err.code === "PERMISSION_DENIED") {
        isPermissionError = true;
      }
    }

    let postsSuccess = false;
    let postsError: string | null = null;
    let postSample: any = null;

    if (!isOAuthError) {
      const postsUrl = `${GRAPH_API_BASE}/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=1&access_token=${activeToken}`;
      try {
        const result = await metaFetchJson(postsUrl);
        postsSuccess = true;
        const postsData = result.data;
        if (postsData && Array.isArray(postsData.data) && postsData.data.length > 0) {
          postSample = postsData.data[0];
        }
      } catch (err: any) {
        postsError = err.message || "Lỗi API lấy bài viết";
        if (err.code === "PERMISSION_DENIED") {
          isPermissionError = true;
        }
      }
    }

    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("MANAGE") || tasks.includes("pages_manage_posts");

    let status = "Bình thường";
    let detail = "";

    if (isOAuthError) {
      status = "Token lỗi / hết hạn";
      detail = infoError || "Mã truy cập fanpage hết hạn hoặc không có giá trị.";
    } else if (isPermissionError) {
      status = "Thiếu quyền";
      detail = infoError || "Bạn không đủ quyền hạn truy vấn hoặc quản lý trang này.";
    } else if (tasks.length > 0 && !hasManage) {
      status = "Thiếu quyền MANAGE";
      detail = "Tài khoản cần có bổ sung vai trò MANAGE để thực thi các thay đổi.";
    } else if (tasks.length > 0 && !hasCreateContent) {
      status = "Thiếu quyền CREATE_CONTENT";
      detail = "Tài khoản cần thêm quyền CREATE_CONTENT để đăng và xoá bài.";
    } else if (postsError) {
      status = "Không lấy được bài";
      detail = `Tìm bài viết lỗi: ${postsError}`;
    } else if (!pageInfo) {
      status = "Cần kiểm tra thủ công";
      detail = infoError || "Lỗi không xác định khi liên lạc với Meta.";
    }

    return res.status(200).json({
      success: true,
      data: {
        pageId,
        name: pageInfo?.name || "Không xác định",
        category: pageInfo?.category || "Không xác định",
        tasks,
        status,
        detail,
        hasPageAccessToken: !!pageAccessToken,
        postsSuccess,
        postsCountFetched: postSample ? 1 : 0,
        postSample,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Lỗi kiểm tra trạng thái trang:", sanitizeSensitiveText(error.stack || error.message));
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Lỗi hệ thống khi tải kiểm tra trang."
      }
    });
  }
} catch (globalError: any) {
  console.error("Lỗi toàn cục trong page-status API:", sanitizeSensitiveText(globalError.stack || globalError.message));
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: globalError.message || "Đã xảy ra lỗi không phân loại trên hệ thống."
    }
  });
}
}
