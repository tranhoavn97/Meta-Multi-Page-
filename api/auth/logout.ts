import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearMetaAccessToken } from "../_lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  // Destroy secure HTTP-Only user token cookie
  clearMetaAccessToken(res);

  return res.status(200).json({
    success: true,
    message: "Đăng xuất và thu hồi phiên làm việc cục bộ thành công."
  });
}
