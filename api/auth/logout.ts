import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearMetaAccessToken } from "../_lib/session";
import { sanitizeSensitiveText } from "../_lib/sanitize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    // Destroy secure HTTP-Only user token cookie
    clearMetaAccessToken(res);

    return res.status(200).json({
      success: true,
      message: "Đăng xuất và thu hồi phiên làm việc cục bộ thành công."
    });
  } catch (error: any) {
    console.error("Lỗi khi đăng xuất:", sanitizeSensitiveText(error.stack || error.message));
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Có lỗi xảy ra khi thực hiện đăng xuất."
      }
    });
  }
}
