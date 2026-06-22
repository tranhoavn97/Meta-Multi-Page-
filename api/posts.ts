async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  const rateLimitInfo = {
    appUsage: response.headers.get("x-app-usage"),
    pageUsage: response.headers.get("x-page-usage"),
    businessUsage: response.headers.get("x-business-use-case-usage"),
  };

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!response.ok && !data.error) {
         data.error = { message: `API Error ${response.status}: ${text.slice(0, 500)}` };
      }
      if (data && typeof data === "object") {
        data._rateLimitInfo = rateLimitInfo;
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

const cache = new Map<string, { savedAt: number; posts: any[] }>();

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Thiếu pageId hoặc page_id truy cập Fanpage" });
  }

  const forceRefresh = req.query.forceRefresh === "true";
  const requestedLimit = parseInt(req.query.limit as string, 10) || 500;
  
  const cacheKey = `meta_posts_cache_${pageId}_${requestedLimit}`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey)!;
    if (Date.now() - cachedData.savedAt < 5 * 60 * 1000) {
      return res.status(200).json({
        data: cachedData.posts,
        fromCache: true,
        rateLimitInfo: { appUsage: null, pageUsage: null, businessUsage: null }
      });
    } else {
      cache.delete(cacheKey);
    }
  }

  const suppliedPageToken = req.query.page_access_token || req.query.pageAccessToken;
  let activeToken = suppliedPageToken as string;

  if (!activeToken) {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || (req.query.user_token || req.query.userToken) as string;
    if (!META_ACCESS_TOKEN) {
      return res.status(400).json({ error: "Missing page_access_token và user_token" });
    }

    try {
      const pagesUrl = `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}&limit=100`;
      let allPagesData = await backendFetchJson(pagesUrl);

      if (allPagesData && allPagesData.data) {
        const pageItem = allPagesData.data.find((p: any) => p.id === pageId);
        if (pageItem) {
          activeToken = pageItem.access_token;
        }
      }
      if (!activeToken) {
        activeToken = META_ACCESS_TOKEN;
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Lỗi khi lấy access token cho page" });
    }
  }

  try {
    const initialLimit = 100;
    let postsUrl = `https://graph.facebook.com/v23.0/${pageId}/posts?fields=id,message,story,created_time,permalink_url,status_type,full_picture&access_token=${activeToken}&limit=${initialLimit}`;
    
    let allPosts: any[] = [];
    let nextUrl: string | null = postsUrl;

    const maxRequests = Math.ceil(requestedLimit / 100);
    let requestCount = 0;

    let rateLimitInfo = {};

    while (nextUrl && allPosts.length < requestedLimit && requestCount < maxRequests) {
      requestCount++;
      const data = await backendFetchJson(nextUrl);

      if (data._rateLimitInfo) {
        rateLimitInfo = data._rateLimitInfo;
      }

      if (data.error) {
        // If it's code 4 (API User's request count has reached the limit)
        if (data.error.code === 4 || data.error.code === 17) {
            return res.status(429).json({
               error: "Ứng dụng đã đạt giới hạn request của Meta (Application request limit reached). Vui lòng thử lại sau.",
               errorCode: data.error.code,
               pageId: pageId,
               isDetailedError: true,
               partialData: allPosts // maybe return what we have so far
            });
        }
        
        if (allPosts.length === 0) {
          return res.status(500).json({ 
             error: data.error.message || "Meta API Error when fetching posts",
             errorCode: data.error.code,
             pageId: pageId,
             isDetailedError: true
          });
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
      if (nextUrl) {
        const delayMs = Math.floor(Math.random() * 131) + 120; // 120 - 250 ms
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const finalPosts = allPosts.slice(0, requestedLimit);
    
    // Process and sort posts (deduplication & sorting by date descending)
    const postsMap = new Map();
    for (const item of finalPosts) {
      if (!postsMap.has(item.id)) {
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
    uniquePosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    cache.set(cacheKey, {
      savedAt: Date.now(),
      posts: uniquePosts
    });

    return res.status(200).json({ 
      data: uniquePosts,
      rateLimitInfo: rateLimitInfo
    });
  } catch (error: any) {
    console.error(`Lỗi khi lấy danh sách bài viết cho page ${pageId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy danh sách bài viết" });
  }
}
