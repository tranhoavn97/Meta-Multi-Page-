import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE, checkRequiredEnvVars } from "./_lib/meta-config";
import { metaFetchJson } from "./_lib/meta-client";

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
          message: "Chỉ hỗ trợ phương thức POST để tra cứu ánh xạ trang."
        }
      });
    }

  const { businessId } = req.body || {};
  if (!businessId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Yêu cầu thiếu businessId nhận diện doanh nghiệp."
      }
    });
  }

  const userToken = getMetaAccessToken(req);
  if (!userToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Phiên làm việc Facebook đã hết hạn. Vui lòng kết nối lại tài khoản.",
        reconnectRequired: true
      }
    });
  }

  try {
    const ownedUrl = `${GRAPH_API_BASE}/${businessId}/owned_pages?fields=id,name&access_token=${userToken}&limit=100`;
    const clientUrl = `${GRAPH_API_BASE}/${businessId}/client_pages?fields=id,name&access_token=${userToken}&limit=100`;

    let ownedPages: any[] = [];
    let clientPages: any[] = [];
    let ownedError: string | null = null;
    let clientError: string | null = null;

    try {
      const ownedResult = await metaFetchJson(ownedUrl);
      ownedPages = ownedResult.data.data || [];
    } catch (e: any) {
      ownedError = e.message || "Lỗi khi tải trang sở hữu";
    }

    try {
      const clientResult = await metaFetchJson(clientUrl);
      clientPages = clientResult.data.data || [];
    } catch (e: any) {
      clientError = e.message || "Lỗi khi tải trang đối tác/khách hàng";
    }

    return res.status(200).json({
      success: true,
      data: {
        businessId,
        ownedPages,
        clientPages,
        errors: {
          ownedError,
          clientError
        }
      }
    });
  } catch (error: any) {
    console.error("Lỗi Page Business Map API:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "PAGE_BUSINESS_MAP_FAILED",
        message: error.message || "Lỗi máy chủ khi thiết lập ánh xạ Trang-Doanh nghiệp"
      }
    });
  }
} catch (globalError: any) {
  console.error("Lỗi toàn cục trong page-business-map:", globalError);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: globalError.message || "Đã xảy ra lỗi không phân loại trên hệ thống."
    }
  });
}
}
