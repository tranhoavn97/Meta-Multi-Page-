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

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const META_ACCESS_TOKEN = (req.query.user_token || req.query.userToken || process.env.META_ACCESS_TOKEN) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Thiếu pageId hoặc page_id truy cập Fanpage" });
  }

  try {
    // 1. Fetch the pages to get the specific page's access_token
    let pageToken: string | null = null;
    let allPagesData: any = null;
    try {
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}&limit=100`;
      allPagesData = await backendFetchJson(pagesUrl);

      if (allPagesData && allPagesData.data) {
        const pageItem = allPagesData.data.find((p: any) => p.id === pageId);
        if (pageItem) {
          pageToken = pageItem.access_token;
        }
      }
    } catch (e) {
      console.warn("Could not fetch page token from accounts endpoint, falling back to provided token:", e);
    }

    // Fallback to the main user token if we couldn't resolve the page access token
    const activeToken = pageToken || META_ACCESS_TOKEN;

    const requestedLimit = parseInt(req.query.limit as string, 10) || 100;
    const initialLimit = Math.min(requestedLimit, 100);

    // 2. Fetch /posts with expanded fields (including attachments)
    let postsUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,story,created_time,permalink_url,status_type,full_picture,attachments{media,type,url,target}&access_token=${activeToken}&limit=${initialLimit}`;
    let allPosts: any[] = [];
    let nextUrl: string | null = postsUrl;

    while (nextUrl && allPosts.length < requestedLimit) {
      const data = await backendFetchJson(nextUrl);

      if (data.error) {
        if (allPosts.length === 0) {
          const pageName = allPagesData?.data?.find((p: any) => p.id === pageId)?.name || "Unknown Page";
          const endpointLog = nextUrl.replace(activeToken, "[HIDDEN_TOKEN]");
          return res.status(500).json({ 
             error: data.error.message || "Meta API Error when fetching posts",
             errorCode: data.error.code,
             pageName: pageName,
             pageId: pageId,
             endpoint: endpointLog,
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
        const delayMs = Math.floor(Math.random() * 501) + 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // 3. Fetch /videos (Page Videos Library)
    let videosUrl = `https://graph.facebook.com/v19.0/${pageId}/videos?fields=id,title,description,created_time,permalink_url,picture&access_token=${activeToken}&limit=${initialLimit}`;
    let allVideos: any[] = [];
    let nextVideoUrl: string | null = videosUrl;

    while (nextVideoUrl && allVideos.length < requestedLimit) {
      try {
        const data = await backendFetchJson(nextVideoUrl);
        if (data.error) {
          break;
        }
        const videosBatch = data.data || [];
        allVideos = allVideos.concat(videosBatch);
        if (videosBatch.length === 0 || allVideos.length >= requestedLimit) {
          break;
        }
        nextVideoUrl = (data.paging && data.paging.next) || null;
        if (nextVideoUrl) {
          const delayMs = Math.floor(Math.random() * 301) + 200;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (e) {
        console.error("Lỗi khi tải danh sách videos từ Meta:", e);
        break;
      }
    }

    const pageName = allPagesData?.data?.find((p: any) => p.id === pageId)?.name || "Unknown Page";

    // 4. Map posts to standardized layout
    const postsMapped = allPosts.map((item: any) => {
      const sourceObjId = item.object_id || item.attachments?.data?.[0]?.target?.id || undefined;
      const isVideo = item.status_type === "added_video" || (item.attachments?.data?.[0]?.type === "video") || (item.status_type === "shared_story" && item.attachments?.data?.[0]?.type === "video");
      return {
        id: item.id,
        postId: item.id,
        sourceObjectId: sourceObjId,
        pageId: pageId,
        pageName: pageName,
        message: item.message || item.story || "",
        created_time: item.created_time,
        permalink_url: item.permalink_url || "",
        full_picture: item.full_picture || "",
        status_type: item.status_type || "",
        attachments: item.attachments || {},
        itemType: isVideo ? ("video" as const) : ("post" as const),
        likes: item.likes || { summary: { total_count: 0 } },
        comments: item.comments || { summary: { total_count: 0 } },
        shares: item.shares || { count: 0 }
      };
    });

    // 5. Map videos to standardized layout
    const videosMapped = allVideos.map((video: any) => ({
      id: `${pageId}_${video.id}`, // constructed post wrapper ID
      postId: `${pageId}_${video.id}`, // post wrapper ID
      sourceObjectId: video.id,
      pageId: pageId,
      pageName: pageName,
      message: video.title || video.description || "",
      created_time: video.created_time,
      permalink_url: video.permalink_url || "",
      full_picture: video.picture || "",
      status_type: "added_video",
      itemType: "video" as const,
      likes: { summary: { total_count: 0 } },
      comments: { summary: { total_count: 0 } },
      shares: { count: 0 }
    }));

    // 6. Merge and Deduplicate by sourceObjectId or ID
    const uniqueMap = new Map<string, any>();
    for (const p of postsMapped) {
      uniqueMap.set(p.id, p);
    }

    for (const v of videosMapped) {
      let matchedKey: string | null = null;
      for (const [key, existing] of uniqueMap.entries()) {
        if (
          (existing.sourceObjectId && existing.sourceObjectId === v.sourceObjectId) ||
          (existing.id === v.id || existing.postId === v.postId)
        ) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        const existing = uniqueMap.get(matchedKey);
        existing.sourceObjectId = v.sourceObjectId;
        if (!existing.postId) existing.postId = v.postId;
        existing.itemType = "video";
        if (!existing.full_picture) existing.full_picture = v.full_picture;
      } else {
        uniqueMap.set(v.id, v);
      }
    }

    const finalPosts = Array.from(uniqueMap.values()).slice(0, requestedLimit);

    return res.status(200).json({ 
      data: finalPosts,
      rateLimitInfo: allPagesData?._rateLimitInfo || { appUsage: null, pageUsage: null, businessUsage: null }
    });
  } catch (error: any) {
    console.error(`Lỗi khi lấy danh sách bài viết cho page ${pageId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy danh sách bài viết" });
  }
}
