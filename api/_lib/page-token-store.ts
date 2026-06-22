import { GRAPH_API_BASE } from "./meta-config";

const pageTokenMap = new Map<string, string>();

export async function getPageAccessToken(pageId: string, userToken: string): Promise<string> {
  const cached = pageTokenMap.get(pageId);
  if (cached) {
    return cached;
  }

  if (!userToken) {
    throw new Error("Missing Facebook user access credentials to resolve page access.");
  }

  // Fetch /me/accounts directly to get latest authorized page tokens
  const url = `${GRAPH_API_BASE}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(userToken)}&limit=100`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta API failed to resolve page tokens (HTTP ${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data && Array.isArray(data.data)) {
    for (const item of data.data) {
      if (item.id && item.access_token) {
        pageTokenMap.set(item.id, item.access_token);
      }
    }
  }

  const resolvedToken = pageTokenMap.get(pageId);
  if (!resolvedToken) {
    // Fallback: return the user token itself if we couldn't resolve the page-specific token
    return userToken;
  }

  return resolvedToken;
}

export function registerPageTokens(pages: { id: string; access_token?: string }[]) {
  for (const page of pages) {
    if (page.id && page.access_token) {
      pageTokenMap.set(page.id, page.access_token);
    }
  }
}

export function clearPageTokens() {
  pageTokenMap.clear();
}
