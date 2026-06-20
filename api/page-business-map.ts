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

  const method = req.method;
  if (method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const userToken = (req.body?.userToken || req.body?.user_token) as string;
  const businessId = req.body?.businessId as string;

  if (!businessId) {
    return res.status(400).json({ success: false, error: "Missing businessId" });
  }
  if (!userToken) {
    return res.status(400).json({ success: false, error: "Missing USER_ACCESS_TOKEN" });
  }

  try {
    // Limit Graph API to 100 as per instructions
    const ownedUrl = `https://graph.facebook.com/v19.0/${businessId}/owned_pages?fields=id,name&access_token=${userToken}&limit=100`;
    const clientUrl = `https://graph.facebook.com/v19.0/${businessId}/client_pages?fields=id,name&access_token=${userToken}&limit=100`;

    let ownedPages: any[] = [];
    let clientPages: any[] = [];
    let ownedError: string | null = null;
    let clientError: string | null = null;

    try {
      const ownedData = await backendFetchJson(ownedUrl);
      if (ownedData.error) {
        ownedError = ownedData.error.message || "Error fetching owned pages";
      } else {
        ownedPages = ownedData.data || [];
      }
    } catch (e: any) {
      ownedError = e.message || "Failed to fetch owned pages";
    }

    try {
      const clientData = await backendFetchJson(clientUrl);
      if (clientData.error) {
        clientError = clientData.error.message || "Error fetching client pages";
      } else {
        clientPages = clientData.data || [];
      }
    } catch (e: any) {
      clientError = e.message || "Failed to fetch client pages";
    }

    return res.status(200).json({
      success: true,
      data: {
        businessId,
        ownedPages,
        clientPages,
        errors: {
          ownedError,
          clientError
        }
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error fetching page-business mapping"
    });
  }
}
