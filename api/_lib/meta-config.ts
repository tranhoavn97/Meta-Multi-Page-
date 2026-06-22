export const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v23.0";
export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export function checkRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const required = [
    "META_APP_ID",
    "META_APP_SECRET",
    "META_GRAPH_API_VERSION",
    "APP_URL",
    "SESSION_SECRET"
  ];
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  return {
    valid: missing.length === 0,
    missing
  };
}
