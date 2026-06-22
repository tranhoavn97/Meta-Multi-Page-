import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMetaAccessToken } from "./_lib/session";
import { GRAPH_API_BASE } from "./_lib/meta-config";
import { metaFetchJson } from "./_lib/meta-client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const userToken = getMetaAccessToken(req);
  if (!userToken) {
    return res.status(200).json({
      success: true,
      data: [],
      hasPermission: false,
      error: "Yêu cầu chưa được xác thực tài khoản Facebook."
    });
  }

  try {
    const url = `${GRAPH_API_BASE}/me/businesses?fields=id,name,primary_page&access_token=${encodeURIComponent(userToken)}&limit=100`;
    const result = await metaFetchJson(url);
    const data = result.data;

    return res.status(200).json({
      success: true,
      data: data.data || [],
      hasPermission: true
    });
  } catch (error: any) {
    const errMsg = error.message || "Unknown error fetching businesses";
    const isMissingPermission =
      error.code === "PERMISSION_DENIED" ||
      errMsg.includes("OAuthException") ||
      errMsg.includes("permission") ||
      errMsg.includes("required");

    return res.status(200).json({
      success: true,
      data: [],
      hasPermission: !isMissingPermission,
      error: isMissingPermission ? "Tài khoản chưa cấp quyền business_management" : errMsg
    });
  }
}
