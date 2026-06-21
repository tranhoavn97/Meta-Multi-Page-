import { Request, Response } from "express";
import { fetchWithTimeout } from "./utils/wrapper.js";

async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetchWithTimeout(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!response.ok && !data.error) {
        data.error = { message: `API Error ${response.status}: ${text.slice(0, 500)}` };
      }
      return data;
    } catch (e) {
      // ignore JSON parse fail, fall back
    }
  }

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text.slice(0, 500)}`);
  }

  throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const method = req.method;
  if (method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được phép" });
  }

  const userToken = (req.body?.userToken || req.body?.user_token) as string;
  const pageId = req.body?.pageId as string;
  const pageAccessToken = req.body?.pageAccessToken as string;

  if (!pageId) {
    return res.status(400).json({ success: false, error: "Thiếu pageId" });
  }

  const activeToken = pageAccessToken || userToken;
  if (!activeToken) {
    return res.status(400).json({ success: false, error: "Thiếu facebook access token" });
  }

  try {
    // 1. Check Page Info and Basic Access
    const infoUrl = `https://graph.facebook.com/v23.0/${pageId}?fields=id,name,category,tasks&access_token=${activeToken}`;
    let pageInfo: any = null;
    let infoError: string | null = null;
    let isOAuthError = false;
    let isPermissionError = false;
    let tasks: string[] = [];

    try {
      const data = await backendFetchJson(infoUrl);
      if (data.error) {
        // Safe access token extraction
        const errMsg = data.error.message || "Lỗi không xác định";
        infoError = errMsg;
        if (errMsg.includes("OAuthException") || errMsg.includes("expired") || errMsg.includes("session")) {
          isOAuthError = true;
        }
        if (errMsg.includes("permission") || errMsg.includes("privilege") || errMsg.includes("tasks")) {
          isPermissionError = true;
        }
      } else {
        pageInfo = data;
        tasks = data.tasks || [];
      }
    } catch (e: any) {
      infoError = e.message || "Lỗi khi lấy thông tin trang";
    }

    // 2. Check Post Retrieval
    let postsSuccess = false;
    let postsError: string | null = null;
    let postSample: any = null;

    if (!infoError || infoError.indexOf("OAuth") === -1) {
      const postsUrl = `https://graph.facebook.com/v23.0/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=1&access_token=${activeToken}`;
      try {
        const postsData = await backendFetchJson(postsUrl);
        if (postsData.error) {
          postsError = postsData.error.message || "Không thể tải bài viết";
          if (postsError.includes("permission") || postsError.includes("tasks") || postsError.includes("privilege")) {
            isPermissionError = true;
          }
        } else {
          postsSuccess = true;
          if (postsData.data && postsData.data.length > 0) {
            postSample = postsData.data[0];
          }
        }
      } catch (e: any) {
        postsError = e.message || "Lỗi tải bài viết";
      }
    }

    // 3. Evaluate Permissions
    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("MANAGE") || tasks.includes("pages_manage_posts");

    // Formulate final status
    let status = "Bình thường";
    let detail = "";

    if (isOAuthError || (infoError && (infoError.includes("OAuth") || infoError.includes("session") || infoError.includes("expired")))) {
      status = "Token lỗi / hết hạn";
      detail = infoError || "Mã truy cập fanpage đã hết hạn hoặc không hợp lệ.";
    } else if (isPermissionError || (infoError && (infoError.includes("permission") || infoError.includes("tasks")))) {
      status = "Thiếu quyền";
      detail = infoError || "Tài khoản không đủ quyền truy cập API Fanpage.";
    } else if (tasks.length > 0 && !hasManage) {
      status = "Thiếu quyền MANAGE";
      detail = "Tài khoản thiếu quyền quản trị cấp độ MANAGE trên trang.";
    } else if (tasks.length > 0 && !hasCreateContent) {
      status = "Thiếu quyền CREATE_CONTENT";
      detail = "Tài khoản thiếu quyền đăng hoặc xóa bài viết (CREATE_CONTENT).";
    } else if (postsError) {
      status = "Không lấy được bài";
      detail = `Tìm bài viết lỗi: ${postsError}`;
    } else if (!pageInfo) {
      status = "Cần kiểm tra thủ công";
      detail = infoError || "Không lấy được thông tin chi tiết qua API.";
    }

    // Detect restriction check block
    if (infoError && (infoError.includes("restricted") || infoError.includes("disabled") || infoError.includes("status"))) {
      status = "Nghi bị hạn chế";
      detail = infoError;
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
    return res.status(500).json({
      success: false,
      error: error.message || "Lỗi hệ thống khi kiểm tra trạng thái trang"
    });
  }
}
