const cache = new Map<string, { token: string; name: string; timestamp: number }>();
const TTL = 10 * 60 * 1000; // 10 minutes

export async function getPageToken(userToken: string, pageId: string): Promise<{ token: string; name: string }> {
  const cacheKey = `${userToken}_${pageId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { token: cached.token, name: cached.name };
  }

  const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userToken}&limit=100`;
  const res = await fetch(pagesUrl);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch pages: ${text.slice(0, 500)}`);
  }
  const data: any = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "Meta API error fetching page token");
  }

  const pages = data.data || [];
  const matched = pages.find((p: any) => p.id === pageId);
  if (!matched) {
    throw new Error(`Page with ID ${pageId} not found in this account.`);
  }

  const result = { token: matched.access_token, name: matched.name, timestamp: Date.now() };
  cache.set(cacheKey, result);
  return { token: matched.access_token, name: matched.name };
}
