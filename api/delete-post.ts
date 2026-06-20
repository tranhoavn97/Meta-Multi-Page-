async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text.slice(0, 500)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  // Only allow POST requests for deletion
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || (req.body?.user_token || req.body?.userToken || req.query?.user_token || req.query?.userToken) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  const { post_id, postId, confirm } = req.body || {};
  const activePostId = post_id || postId;

  if (!activePostId) {
    return res.status(400).json({ error: "Thiếu post_id hoặc postId của bài viết." });
  }

  if (confirm !== true) {
    return res.status(400).json({ error: "Yêu cầu xóa không hợp lệ. Phải xác nhận xóa bằng tham số confirm=true." });
  }

  try {
    // 1. Get pageId from the post_id (post_id is typically [pageId]_[postId])
    const parts = activePostId.split("_");
    const pageId = parts[0];

    // 2. Fetch pages list to find the corresponding page_access_token
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}&limit=100`;
    let pageToken: string | null = null;
    let allPagesData = await backendFetchJson(pagesUrl);

    if (allPagesData && allPagesData.data) {
      const pageItem = allPagesData.data.find((p: any) => p.id === pageId);
      if (pageItem) {
        pageToken = pageItem.access_token;
      }
    }

    const activeToken = pageToken || META_ACCESS_TOKEN;

    // 3. Make the Meta delete-post graph API call
    const deleteUrl = `https://graph.facebook.com/v19.0/${activePostId}?access_token=${activeToken}`;
    const result = await backendFetchJson(deleteUrl, {
      method: "DELETE"
    });

    if (result && result.error) {
      return res.status(400).json({ error: result.error.message || "Không thể xoá bài viết thông qua Meta Graph API." });
    }

    return res.status(200).json({ success: true, response: result });
  } catch (error: any) {
    console.error(`Lỗi khi xóa bài viết ${activePostId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi xoá bài viết" });
  }
}
