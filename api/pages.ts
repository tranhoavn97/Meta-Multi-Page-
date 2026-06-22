import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE, checkRequiredEnvVars } from "./_lib/meta-config";
import { metaFetchJson, parseUsagePercentage } from "./_lib/meta-client";
import { registerPageTokens } from "./_lib/page-token-store";

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

    const userToken = getMetaAccessToken(req);
    if (!userToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Phiên làm việc Facebook chưa được khởi tạo. Vui lòng kết nối lại tài khoản của bạn.",
          reconnectRequired: true
        }
      });
    }

  try {
    const url = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,picture{url},tasks&access_token=${encodeURIComponent(userToken)}&limit=100`;
    
    let allPagesRaw: any[] = [];
    let nextUrl: string | null = url;
    let lastRateLimitInfo = { appUsage: null, pageUsage: null, businessUsage: null };
    let warning: string | null = null;

    while (nextUrl) {
      const result = await metaFetchJson(nextUrl);
      const data = result.data;
      lastRateLimitInfo = result.rateLimitInfo as any;

      const pagesBatch = data.data || [];
      allPagesRaw = allPagesRaw.concat(pagesBatch);

      if (pagesBatch.length === 0) {
        break;
      }

      // Check current rate limit usage
      const appUsage = parseUsagePercentage(lastRateLimitInfo.appUsage);
      const pageUsage = parseUsagePercentage(lastRateLimitInfo.pageUsage);

      if (appUsage >= 80 || pageUsage >= 80) {
        warning = `Giới hạn API gần đạt đỉnh (${Math.max(appUsage, pageUsage)}%). Hệ thống đã dừng tải danh sách phân trang để bảo toàn giới hạn.`;
        break;
      }

      nextUrl = (data.paging && data.paging.next) || null;
      if (nextUrl) {
        // Quick 100-200ms delay between pages as requested in Part 11
        const delayMs = Math.floor(Math.random() * 101) + 100;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Register true page tokens server-side securely
    registerPageTokens(allPagesRaw);

    // Strip sensitive access_tokens before responding to client browser
    const sanitizedPages = allPagesRaw.map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      picture: page.picture,
      tasks: page.tasks || []
    }));

    return res.status(200).json({
      success: true,
      data: sanitizedPages,
      warning,
      rateLimitInfo: lastRateLimitInfo
    });
  } catch (err: any) {
    console.error("Lỗi trong quá trình lấy danh sách Page:", err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || "PAGES_FETCH_FAILED",
        message: err.message || "Lỗi máy chủ khi lấy danh sách Fanpage.",
        metaCode: err.metaCode,
        retryable: err.retryable || false,
        reconnectRequired: err.reconnectRequired || false
      }
    });
  }
} catch (globalError: any) {
  console.error("Lỗi toàn cục trong pages API:", globalError);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: globalError.message || "Đã xảy ra lỗi không phân loại trên hệ thống."
    }
  });
}
}
