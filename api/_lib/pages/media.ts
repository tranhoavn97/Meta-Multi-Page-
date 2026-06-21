import { decrypt } from "../db.js";
import { fetchWithTimeout } from "../utils/wrapper.js";

async function fetchPagedFacebookData(initialUrl: string, maxItems: number): Promise<any[]> {
  let results: any[] = [];
  let url: string | null = initialUrl;
  let loopCount = 0;
  
  while (url && results.length < maxItems && loopCount < 5) {
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Lỗi API Meta");
    }
    if (data.data && data.data.length > 0) {
      results = results.concat(data.data);
    }
    url = data.paging?.next || null;
    loopCount++;
  }
  return results;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const pageId = (req.params.pageId || req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Thiếu pageId để lấy dữ liệu truyền thông" });
  }

  const pageAccessToken = (req.query.pageAccessToken || req.query.page_access_token || req.body?.pageAccessToken) as string;
  const userToken = (req.query.user_token || req.query.userToken || req.body?.userToken || req.body?.user_token) as string;
  const limitInput = parseInt(req.query.limit || req.body?.limit || "100") || 100;
  const queryLimit = Math.min(limitInput, 100);
  const type = (req.query.type || req.body?.type || "all") as "all" | "posts" | "videos";

  let pageToken = pageAccessToken || "";
  if (pageToken && pageToken.includes(":")) {
    pageToken = decrypt(pageToken);
  }

  // Fallback: If no page token is provided but user token is, search user accounts to find it
  if (!pageToken && userToken) {
    try {
      const accountsUrl = `https://graph.facebook.com/v23.0/me/accounts?fields=id,access_token&access_token=${userToken}&limit=100`;
      const res = await fetchWithTimeout(accountsUrl);
      const data = await res.json();
      if (data.data) {
        const found = data.data.find((p: any) => p.id === pageId);
        if (found) {
          pageToken = found.access_token || "";
        }
      }
    } catch (e: any) {
      console.error("Lỗi khi tự tìm Page token:", e);
    }
  }

  if (!pageToken) {
    return res.status(400).json({ error: "Không tìm thấy access token cho Page " + pageId });
  }

  try {
    // 1. Fetch Page Name
    let pageName = "Fanpage";
    try {
      const nameUrl = `https://graph.facebook.com/v23.0/${pageId}?fields=name&access_token=${pageToken}`;
      const nameRes = await fetchWithTimeout(nameUrl);
      const nameData = await nameRes.json();
      if (nameData.name) {
        pageName = nameData.name;
      }
    } catch (e) {
      console.error("Lỗi khi đồng bộ tên trang:", e);
    }

    let rawPosts: any[] = [];
    let rawVideos: any[] = [];

    // 2. Fetch posts if requested
    if (type === "posts" || type === "all") {
      const postsUrl = `https://graph.facebook.com/v23.0/${pageId}/posts?fields=id,message,story,created_time,permalink_url,status_type,full_picture&access_token=${pageToken}&limit=${queryLimit}`;
      try {
        rawPosts = await fetchPagedFacebookData(postsUrl, queryLimit);
      } catch (e: any) {
        console.error("Lỗi tải danh sách posts:", e);
        // If posts fetch errors, propagate error if we are only fetching posts
        if (type === "posts") throw e;
      }
    }

    // 3. Fetch videos if requested
    if (type === "videos" || type === "all") {
      const videosUrl = `https://graph.facebook.com/v23.0/${pageId}/videos?fields=id,title,description,created_time,permalink_url,picture&access_token=${pageToken}&limit=${queryLimit}`;
      try {
        rawVideos = await fetchPagedFacebookData(videosUrl, queryLimit);
      } catch (e: any) {
        console.error("Lỗi tải danh sách videos:", e);
        if (type === "videos") throw e;
      }
    }

    // 4. Standardize items
    const standardizedPosts = rawPosts.map((post: any) => ({
      id: post.id,
      pageId: pageId,
      pageName: pageName,
      message: post.message || post.story || "",
      created_time: post.created_time,
      permalink_url: post.permalink_url || "",
      thumbnail: post.full_picture || "",
      itemType: "post" as const,
      status_type: post.status_type || ""
    }));

    const standardizedVideos = rawVideos.map((video: any) => ({
      id: video.id,
      pageId: pageId,
      pageName: pageName,
      message: video.title || video.description || "",
      created_time: video.created_time,
      permalink_url: video.permalink_url || "",
      thumbnail: video.picture || "",
      itemType: "video" as const,
      status_type: "added_video"
    }));

    // 5. Merge and deduplicate
    const merged = [...standardizedPosts, ...standardizedVideos];
    const uniqueMap = new Map<string, any>();
    for (const item of merged) {
      uniqueMap.set(item.id, item);
    }
    const uniqueItems = Array.from(uniqueMap.values());

    // 6. Sort by created_time desc
    uniqueItems.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    return res.status(200).json({ data: uniqueItems });
  } catch (error: any) {
    console.error(`Lỗi khi lấy dữ liệu truyền thông cho page ${pageId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi tải dữ liệu trang" });
  }
}
