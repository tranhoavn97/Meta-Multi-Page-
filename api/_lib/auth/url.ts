export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const customAppId = req.query.app_id as string;
    const customAppSecret = req.query.app_secret as string;
    
    const appId = customAppId || process.env.META_APP_ID;
    const appSecret = customAppSecret || process.env.META_APP_SECRET;

    if (!appId) {
      return res.status(400).json({ error: "Chưa cấu hình Meta App ID. Vui lòng cấu hình biến môi trường." });
    }

    const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
    const redirectUri = `${appUrl}/auth/callback`;

    const stateObj = {
      appId,
      appSecret: appSecret || "",
      redirectUri
    };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const scopes = "pages_manage_posts,pages_read_engagement";
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${stateStr}&response_type=code`;

    return res.status(200).json({ url: authUrl });
  } catch (error: any) {
    console.error("Lỗi khi tạo Auth URL:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi tạo URL đăng nhập: " + error.message });
  }
}
