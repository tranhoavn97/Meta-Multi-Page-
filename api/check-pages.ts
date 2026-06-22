import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE, checkRequiredEnvVars } from "./_lib/meta-config";
import { metaFetchJson } from "./_lib/meta-client";
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
          message: "Chỉ hỗ trợ phương thức POST để kiểm tra trạng thái."
        }
      });
    }

    const userToken = getMetaAccessToken(req);
    if (!userToken) {
      return res.status(401).json({
        success: false,
        status: "disconnected",
        error: {
          code: "UNAUTHORIZED",
          message: "Phiên làm việc Facebook đã hết hạn. Vui lòng kết nối lại tài khoản.",
          reconnectRequired: true
        }
      });
    }

    const meUrl = `${GRAPH_API_BASE}/me?fields=id,name&access_token=${encodeURIComponent(userToken)}`;
    let meData: any;
    try {
      const result = await metaFetchJson(meUrl);
      meData = result.data;
    } catch (err: any) {
      if (err.code === "TOKEN_EXPIRED") {
        return res.status(401).json({
          success: false,
          status: "disconnected",
          error: {
            code: "TOKEN_EXPIRED",
            message: "Mã xác thực Facebook đã hết hạn hoặc bị huỷ bỏ, vui lòng tái liên kết tài khoản.",
            reconnectRequired: true
          }
        });
      }
      if (err.code === "PERMISSION_DENIED") {
        return res.status(200).json({
          success: false,
          status: "missing_permission",
          error: {
            code: "PERMISSION_DENIED",
            message: `Truy vấn tài khoản bị từ chối: ${err.message}`
          }
        });
      }
      throw err;
    }

    let pagesCount = 0;
    try {
      const accountsUrl = `${GRAPH_API_BASE}/me/accounts?fields=id&access_token=${encodeURIComponent(userToken)}&limit=100`;
      const result = await metaFetchJson(accountsUrl);
      const accountsData = result.data;
      pagesCount = (accountsData && accountsData.data) ? accountsData.data.length : 0;
    } catch (err: any) {
      console.warn("[Check-Pages] Failed tracking page scope counts", err);
      if (err.code === "PERMISSION_DENIED") {
        return res.status(200).json({
          success: true,
          status: "missing_permission",
          user: meData,
          pagesCount: 0,
          error: {
            code: "PERMISSION_DENIED",
            message: "Chưa được cấp quyền truy vấn danh sách Fanpage (pages_show_list)."
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      status: "connected",
      user: meData,
      pagesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const errorMsg = error.message || "Không thể kết nối hoặc phân tích trạng thái từ Facebook.";
    console.error("Lỗi khi kết nối kiểm tra Fanpages:", sanitizeSensitiveText(error.stack || error.message));
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: errorMsg
      }
    });
  }
}
