export async function safeFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text.slice(0, 500)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text);
}
