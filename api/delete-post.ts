import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE } from "./_lib/meta-config";
import { metaFetchJson } from "./_lib/meta-client";
import { getPageAccessToken } from "./_lib/page-token-store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Chỉ hỗ trợ phương thức POST để thực hiện xoá."
      }
    });
  }

  const { post_id, postId, pageId: suppliedPageId, confirm } = req.body || {};
  const activePostId = post_id || postId;

  if (!activePostId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Thiếu post_id hoặc postId của bài viết cần xoá."
      }
    });
  }

  if (confirm !== true) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Yêu cầu hành động chưa đầy đủ. Tham số xác nhận confirm=true là bắt buộc."
      }
    });
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

  // Derive pageId from post_id if not explicitly provided
  let pageId = suppliedPageId;
  if (!pageId) {
    const parts = activePostId.split("_");
    pageId = parts[0];
  }

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Không thể nhận dạng pageId từ ID bài viết được chuyển."
      }
    });
  }

  // Retrieve Page Access Token from store cache or dynamic query
  let pageToken: string;
  try {
    pageToken = await getPageAccessToken(pageId, userToken);
  } catch (err: any) {
    console.error(`[Delete Post API] Error checking or retrieving Page Token for page ${pageId}:`, err);
    pageToken = userToken; // Fallback to user credentials if page credentials unavailable
  }

  try {
    const deleteUrl = `${GRAPH_API_BASE}/${activePostId}?access_token=${pageToken}`;
    const result = await metaFetchJson(deleteUrl, { method: "DELETE" });

    return res.status(200).json({
      success: true,
      data: result.data,
      rateLimitInfo: result.rateLimitInfo
    });
  } catch (err: any) {
    console.error(`[Delete Post API] Failed during Graph API delete request on ${activePostId}:`, err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || "POST_DELETE_FAILED",
        message: err.message || "Lỗi máy chủ khi thực hiện xoá bài viết.",
        metaCode: err.metaCode,
        retryable: err.retryable || false,
        reconnectRequired: err.reconnectRequired || false
      }
    });
  }
}
