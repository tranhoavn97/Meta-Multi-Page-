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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const META_ACCESS_TOKEN = (req.body?.user_token || req.body?.userToken || req.query?.user_token || req.query?.userToken || process.env.META_ACCESS_TOKEN) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  try {
    const meUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${META_ACCESS_TOKEN}`;
    const meData = await backendFetchJson(meUrl);

    if (meData && meData.error) {
      return res.status(400).json({ 
        success: false, 
        status: "disconnected", 
        error: meData.error.message || "Meta API Auth Token expired or invalid" 
      });
    }

    // Try fetching count of pages briefly
    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id&access_token=${META_ACCESS_TOKEN}&limit=100`;
    const accountsData = await backendFetchJson(accountsUrl);
    const pagesCount = (accountsData && accountsData.data) ? accountsData.data.length : 0;

    return res.status(200).json({
      success: true,
      status: "connected",
      user: meData,
      pagesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Lỗi khi kết nối kiểm tra Fanpages:", error);
    return res.status(500).json({ 
      success: false, 
      status: "error", 
      error: error.message || "Không thể xác thực kiểm tra kết nối với Meta Server" 
    });
  }
}
