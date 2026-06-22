import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE, checkRequiredEnvVars } from "./_lib/meta-config";
import { metaFetchJson, parseUsagePercentage, getSingleQueryParam } from "./_lib/meta-client";
import { getPageAccessToken } from "./_lib/page-token-store";
import { sanitizeSensitiveText } from "./_lib/sanitize";

const cache = new Map<string, { savedAt: number; posts: any[] }>();

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

    const pageId = getSingleQueryParam(req.query.pageId || req.query.page_id);
    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Yêu cầu thiếu pageId nhận diện Fanpage."
        }
      });
    }

  const forceRefresh = req.query.forceRefresh === "true";
  const requestedLimit = Math.min(500, parseInt((req.query.limit as string) || "500", 10));

  const cacheKey = `meta_posts_cache_${pageId}_${requestedLimit}`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey)!;
    if (Date.now() - cachedData.savedAt < 5 * 60 * 1000) {
      return res.status(200).json({
        success: true,
        data: cachedData.posts,
        fromCache: true,
        rateLimitInfo: { appUsage: null, pageUsage: null, businessUsage: null }
      });
    } else {
      cache.delete(cacheKey);
    }
  }

  const userToken = getMetaAccessToken(req);
  if (!userToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Phiên đăng nhập Facebook hết hạn. Vui lòng kết nối lại tài khoản.",
        reconnectRequired: true
      }
    });
  }

  let activeToken: string;
  try {
    activeToken = await getPageAccessToken(pageId, userToken);
  } catch (err: any) {
    console.error(`[Posts API] Failed to resolve Page Access Token for ${pageId}, falling back to user token:`, err);
    activeToken = userToken;
  }

  try {
    const initialLimit = 100;
    const postsUrl = `${GRAPH_API_BASE}/${pageId}/posts?fields=id,message,story,created_time,permalink_url,status_type,full_picture&access_token=${activeToken}&limit=${initialLimit}`;
    
    let allPostsRaw: any[] = [];
    let nextUrl: string | null = postsUrl;

    const maxRequests = Math.ceil(requestedLimit / 100);
    let requestCount = 0;
    let rateLimitInfo = { appUsage: null, pageUsage: null, businessUsage: null };
    let warning: string | null = null;

    while (nextUrl && allPostsRaw.length < requestedLimit && requestCount < maxRequests) {
      requestCount++;
      try {
        const result = await metaFetchJson(nextUrl);
        const data = result.data;
        rateLimitInfo = result.rateLimitInfo as any;

        const postsBatch = data.data || [];
        allPostsRaw = allPostsRaw.concat(postsBatch);

        if (postsBatch.length === 0 || allPostsRaw.length >= requestedLimit) {
          break;
        }

        // Terminate early if rate threshold exceeded
        const appUsage = parseUsagePercentage(rateLimitInfo.appUsage);
        const pageUsage = parseUsagePercentage(rateLimitInfo.pageUsage);

        if (appUsage >= 80 || pageUsage >= 80) {
          warning = `Giới hạn API đạt mức cảnh báo (${Math.max(appUsage, pageUsage)}%). Tải bài viết tạm dừng để tránh khóa ứng dụng.`;
          break;
        }

        nextUrl = (data.paging && data.paging.next) || null;
        if (nextUrl) {
          // Dedicated 120ms - 250ms spacing between paginated pulls as requested in Part 12
          const delayMs = Math.floor(Math.random() * 131) + 120;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (err: any) {
        if (allPostsRaw.length > 0) {
          console.warn(`[Posts API] Error mid-pagination: ${err.message}. Returning accumulated data.`);
          warning = `Gặp lỗi trong phân trang (${err.message}). Đã trả về dữ liệu tích lũy.`;
          break;
        } else {
          throw err;
        }
      }
    }

    // Deduplicate posts based on unique ID
    const postsMap = new Map<string, any>();
    for (const item of allPostsRaw) {
      if (item && item.id && !postsMap.has(item.id)) {
        postsMap.set(item.id, {
          id: item.id,
          message: item.message || item.story || "",
          created_time: item.created_time,
          permalink_url: item.permalink_url,
          full_picture: item.full_picture,
          status_type: item.status_type,
          pageId: pageId
        });
      }
    }

    const uniquePosts = Array.from(postsMap.values());
    
    // Sort by created_time descending
    uniquePosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    // Update Cache
    cache.set(cacheKey, {
      savedAt: Date.now(),
      posts: uniquePosts
    });

    return res.status(200).json({
      success: true,
      data: uniquePosts,
      warning,
      rateLimitInfo
    });
  } catch (err: any) {
    console.error(`Lỗi khi lấy bài viết cho page ${pageId}:`, sanitizeSensitiveText(err.stack || err.message));
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || "INTERNAL_SERVER_ERROR",
        message: err.message || "Lỗi máy chủ khi lấy danh sách bài viết.",
        metaCode: err.metaCode,
        retryable: err.retryable || false,
        reconnectRequired: err.reconnectRequired || false
      }
    });
  }
} catch (globalError: any) {
  console.error("Lỗi toàn cục trong posts API:", sanitizeSensitiveText(globalError.stack || globalError.message));
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: globalError.message || "Đã xảy ra lỗi không phân loại trên hệ thống."
    }
  });
}
}
