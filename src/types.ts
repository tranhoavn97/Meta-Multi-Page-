export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data?: {
      url: string;
    };
  } | any;
  monetization_status?: string;
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  status_type?: string;
  attachments?: {
    data?: Array<{
      media?: {
        image?: {
          src: string;
          height: number;
          width: number;
        };
      };
      type?: string;
      url?: string;
    }>;
  };
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  likes?: {
    summary?: {
      total_count?: number;
    };
  };
  comments?: {
    summary?: {
      total_count?: number;
    };
  };
  shares?: {
    count?: number;
  };
}

export interface FilterCriteria {
  olderThanDays: number;
  enableOlderThan: boolean;
  dateFrom: string;
  dateTo: string;
  enableDateRange: boolean;
  keyword: string;
  enableKeyword: boolean;
  maxPostsToFetch: number; // For API query limit
  maxPostsToShow: number; // For UI list restriction
  timeRangePreset?: "today" | "week" | "month" | "year" | "all" | "custom";
}

export interface DeletionLog {
  id: string; // Unique logger row ID
  postId: string;
  postMessageSnippet: string;
  pageName: string;
  status: "pending" | "processing" | "success" | "skipped" | "failed";
  error?: string;
  timestamp: string;
}
