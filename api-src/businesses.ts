import { Request, Response } from "express";

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

  const userToken = (req.query?.user_token || req.query?.userToken || req.body?.user_token || req.body?.userToken) as string;
  if (!userToken) {
    return res.status(400).json({ success: false, error: "Missing META_ACCESS_TOKEN" });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,primary_page&access_token=${userToken}&limit=100`;
    const data = await backendFetchJson(url);

    if (data.error) {
      const errMsg = data.error.message || "Unknown error fetching businesses";
      // Gracefully handle if business_management permission is missing
      const isMissingPermission = errMsg.includes("OAuthException") || errMsg.includes("permission") || errMsg.includes("required");
      return res.status(200).json({
        success: true,
        data: [],
        hasPermission: !isMissingPermission,
        error: isMissingPermission ? "Tài khoản chưa cấp quyền business_management" : errMsg
      });
    }

    return res.status(200).json({
      success: true,
      data: data.data || [],
      hasPermission: true
    });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      data: [],
      hasPermission: false,
      error: error.message || "Không thể kết nối API Business Manager"
    });
  }
}
