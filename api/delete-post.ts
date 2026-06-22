async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
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
      // JSON parse failed
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

  // Only allow POST requests for deletion
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const META_ACCESS_TOKEN = (req.body?.user_token || req.body?.userToken || req.query?.user_token || req.query?.userToken || process.env.META_ACCESS_TOKEN) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  const { post_id, postId, confirm, pageId: reqPageId, page_id: reqPageId2, itemType, deleteSource } = req.body || {};
  const activePostId = post_id || postId;
  const providedPageId = reqPageId || reqPageId2;

  const pageId = providedPageId || (activePostId && activePostId.includes("_") ? activePostId.split("_")[0] : null);

  if (!pageId) {
    return res.status(400).json({ error: "Không tìm thấy pageId trong request hoặc postId." });
  }

  if (confirm !== true) {
    return res.status(400).json({ error: "Yêu cầu xóa không hợp lệ. Phải xác nhận xóa bằng tham số confirm=true." });
  }

  // Determine what object to delete
  // If it is video/reel and user chose deleteSource: we delete sourceObjectId
  // Otherwise, we delete postId
  const { sourceObjectId } = req.body || {};
  let deletedObjectId = activePostId;
  let deletingSourceObj = false;

  if ((itemType === "video" || itemType === "reel") && deleteSource === true && sourceObjectId) {
    deletedObjectId = sourceObjectId;
    deletingSourceObj = true;
  }

  if (!deletedObjectId) {
    return res.status(400).json({ error: "Thiếu postId hoặc sourceObjectId để thực hiện xóa." });
  }

  try {
    // 2. Fetch pages list to find the corresponding page_access_token
    let pageToken: string | null = null;
    try {
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}&limit=100`;
      let allPagesData = await backendFetchJson(pagesUrl);

      if (allPagesData && allPagesData.data) {
        const pageItem = allPagesData.data.find((p: any) => p.id === pageId);
        if (pageItem) {
          pageToken = pageItem.access_token;
        }
      }
    } catch (e) {
      console.warn("Could not fetch page token from accounts endpoint, falling back to provided token:", e);
    }

    const activeToken = pageToken || META_ACCESS_TOKEN;

    // 3. Make the Meta delete-post graph API call
    const deleteUrl = `https://graph.facebook.com/v19.0/${deletedObjectId}?access_token=${activeToken}`;
    const result = await backendFetchJson(deleteUrl, {
      method: "DELETE"
    });

    if (result && result.error) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: "DELETE_API_ERROR",
          message: result.error.message || "Không thể xoá bài viết thông qua Meta Graph API."
        },
        errorCode: result.error.code,
        metaResponse: sanitize(result)
      });
    }

    // Strict validation: Meta response must confirm deletion success (i.e. result.success === true or result === true)
    const isConfirmedSuccess = result === true || result?.success === true;
    if (!isConfirmedSuccess) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DELETE_NOT_CONFIRMED",
          message: "Meta không xác nhận xoá thành công."
        },
        metaResponse: sanitize(result)
      });
    }

    // 4. Verify post-deletion by trying to fetch the deleted object
    let verified = false;
    try {
      const checkUrl = `https://graph.facebook.com/v19.0/${deletedObjectId}?fields=id&access_token=${activeToken}`;
      const checkRes = await fetch(checkUrl);
      const checkData = await checkRes.json();

      if (
        checkRes.status === 404 || 
        checkRes.status === 400 || 
        (checkData.error && (checkData.error.code === 100 || checkData.error.code === 803 || checkData.error.message?.includes("does not exist") || checkData.error.message?.includes("Unsupported get request")))
      ) {
        verified = true;
      } else if (checkData.id) {
        // Object still exists on Meta!
        return res.status(400).json({
          success: false,
          verified: false,
          error: {
            code: "DELETE_VERIFICATION_FAILED",
            message: "Xác minh thất bại: Đối tượng vẫn tồn tại trên Meta sau khi xóa."
          },
          deletedObjectId,
          itemType,
          pageId
        });
      } else {
        // Unknown error during check
        return res.status(400).json({
          success: false,
          verified: false,
          error: {
            code: "DELETE_VERIFICATION_FAILED",
            message: checkData.error?.message || "Không xác minh được trạng thái xóa từ Meta."
          },
          deletedObjectId,
          itemType,
          pageId
        });
      }
    } catch (e: any) {
      console.error("Lỗi xác minh sau khi xóa:", e);
      return res.status(400).json({
        success: false,
        verified: false,
        error: {
          code: "DELETE_VERIFICATION_FAILED",
          message: `Lỗi kết nối khi xác minh xóa: ${e.message}`
        },
        deletedObjectId,
        itemType,
        pageId
      });
    }

    // 5. Successful Response
    return res.status(200).json({
      success: true,
      verified: true,
      deletedObjectId,
      itemType,
      pageId
    });
  } catch (error: any) {
    console.error(`Lỗi khi xóa bài viết ${deletedObjectId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi xoá bài viết" });
  }
}

function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const cleaned = JSON.parse(JSON.stringify(obj));
  
  const scrub = (target: any) => {
    if (!target || typeof target !== "object") return;
    for (const key of Object.keys(target)) {
      if (
        key.toLowerCase().includes("token") || 
        key.toLowerCase().includes("secret") || 
        key.toLowerCase().includes("password")
      ) {
        target[key] = "[HIDDEN]";
      } else if (typeof target[key] === "object") {
        scrub(target[key]);
      }
    }
  };

  scrub(cleaned);
  return cleaned;
}
