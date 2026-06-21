import { fetchWithTimeout } from "./utils/wrapper.js";

const GRAPH_API_VERSION = "v23.0";

async function fbFetchJson(url: string, options: any = {}): Promise<any> {
  const res = await fetchWithTimeout(url, options);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Facebook API returned invalid JSON: ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    throw new Error(data.error?.message || `API Error ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

export async function fetchFacebookPages(userToken: string): Promise<any[]> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token,tasks,category&access_token=${userToken}&limit=100`;
  const data = await fbFetchJson(url);
  return data.data || [];
}

export async function fetchFacebookPageAvatar(pageId: string, accessToken: string): Promise<string> {
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/picture?type=large&redirect=false&access_token=${accessToken}`;
    const picRes = await fbFetchJson(url);
    return picRes.data?.url || "";
  } catch (e) {
    console.error(`Error fetching page ${pageId} avatar:`, e);
    return "";
  }
}

export async function fetchFacebookPosts(pageId: string, pageToken: string, limit: number = 100, nextUrl?: string): Promise<{ data: any[]; next?: string }> {
  const queryLimit = Math.min(limit, 100);
  const url = nextUrl || `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts?fields=id,message,story,created_time,permalink_url,status_type,full_picture&access_token=${pageToken}&limit=${queryLimit}`;
  const data = await fbFetchJson(url);
  return {
    data: data.data || [],
    next: data.paging?.next || undefined
  };
}

export async function fetchFacebookVideos(pageId: string, pageToken: string, limit: number = 100, nextUrl?: string): Promise<{ data: any[]; next?: string }> {
  const queryLimit = Math.min(limit, 100);
  const url = nextUrl || `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/videos?fields=id,title,description,created_time,permalink_url,source&access_token=${pageToken}&limit=${queryLimit}`;
  const data = await fbFetchJson(url);
  return {
    data: data.data || [],
    next: data.paging?.next || undefined
  };
}

export async function deleteFacebookItem(itemId: string, pageToken: string): Promise<boolean> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${itemId}?access_token=${pageToken}`;
  const data = await fbFetchJson(url, { method: "DELETE" });
  return !!data.success;
}
