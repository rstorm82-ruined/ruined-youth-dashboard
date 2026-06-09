const BASE = process.env.ZERNIO_API_BASE ?? "https://api.zernio.com";
const KEY = process.env.ZERNIO_API_KEY!;

async function zernioFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zernio ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

export interface ZernioPostPayload {
  account_id: string;
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
}

export interface ZernioPostResult {
  job_id: string;
  status: string;
}

export async function createPost(
  payload: ZernioPostPayload
): Promise<ZernioPostResult> {
  return zernioFetch<ZernioPostResult>("/v1/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ZernioAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export async function getPostAnalytics(
  accountId: string,
  jobId: string
): Promise<ZernioAnalytics> {
  return zernioFetch<ZernioAnalytics>(
    `/v1/posts/${jobId}/analytics?account_id=${accountId}`
  );
}

export interface ZernioDM {
  id: string;
  sender: string;
  sender_avatar?: string;
  message: string;
  received_at: string;
}

export async function getDMs(accountId: string): Promise<ZernioDM[]> {
  return zernioFetch<ZernioDM[]>(`/v1/inbox?account_id=${accountId}`);
}

export interface ZernioTrend {
  tag: string;
  volume: number;
  platform: string;
}

export async function getTrends(platform: string): Promise<ZernioTrend[]> {
  return zernioFetch<ZernioTrend[]>(`/v1/trends?platform=${platform}`);
}
