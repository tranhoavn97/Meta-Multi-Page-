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

  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || (req.query.user_token || req.query.userToken) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Thiếu pageId hoặc page_id truy cập Fanpage" });
  }

  try {
    // 1. Fetch the pages to get the specific page's access_token
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}&limit=100`;
    let pageToken: string | null = null;
    let allPagesData = await backendFetchJson(pagesUrl);

    if (allPagesData && allPagesData.data) {
      const pageItem = allPagesData.data.find((p: any) => p.id === pageId);
      if (pageItem) {
        pageToken = pageItem.access_token;
      }
    }

    // Fallback to the main user token if we couldn't resolve the page access token
    const activeToken = pageToken || META_ACCESS_TOKEN;

    const requestedLimit = parseInt(req.query.limit as string, 10) || 100;
    const initialLimit = Math.min(requestedLimit, 100);

    let postsUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media,type,url},likes.summary(true).limit(0),comments.summary(true).limit(0),shares&access_token=${activeToken}&limit=${initialLimit}`;
    
    let allPosts: any[] = [];
    let nextUrl: string | null = postsUrl;

    while (nextUrl && allPosts.length < requestedLimit) {
      const data = await backendFetchJson(nextUrl);

      if (data.error) {
        if (allPosts.length === 0) {
          return res.status(500).json({ error: data.error.message || "Meta API Error when fetching posts" });
        } else {
          break;
        }
      }

      const postsBatch = data.data || [];
      allPosts = allPosts.concat(postsBatch);

      if (postsBatch.length === 0 || allPosts.length >= requestedLimit) {
        break;
      }

      nextUrl = (data.paging && data.paging.next) || null;
    }

    const finalPosts = allPosts.slice(0, requestedLimit);
    return res.status(200).json({ data: finalPosts });
  } catch (error: any) {
    console.error(`Lỗi khi lấy danh sách bài viết cho page ${pageId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy danh sách bài viết" });
  }
}
