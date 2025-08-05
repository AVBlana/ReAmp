import { YoutubeVideo } from "@/app/types/youtubeTypes";

export interface YouTubeSearchResponse {
  items: YoutubeVideo[];
  nextPageToken: string | null;
}

interface YouTubeAPIItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
  };
}

interface YouTubeAPIResponse {
  items: YouTubeAPIItem[];
  nextPageToken?: string;
}

export async function getYouTubeVideos(
  query: string,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("maxResults", "20");
    url.searchParams.append("q", query);
    url.searchParams.append("type", "video");
    url.searchParams.append("videoCategoryId", "10"); // Music category

    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    // Note: You'll need to add your YouTube API key to the environment variables
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API key not found");
    }

    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeAPIResponse = await response.json();

    const items: YoutubeVideo[] = data.items.map((item: YouTubeAPIItem) => ({
      id: {
        videoId: item.id.videoId,
      },
      snippet: {
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnails: {
          default: {
            url: item.snippet.thumbnails.default.url,
            width: item.snippet.thumbnails.default.width,
            height: item.snippet.thumbnails.default.height,
          },
          medium: {
            url: item.snippet.thumbnails.medium.url,
            width: item.snippet.thumbnails.medium.width,
            height: item.snippet.thumbnails.medium.height,
          },
          high: {
            url: item.snippet.thumbnails.high.url,
            width: item.snippet.thumbnails.high.width,
            height: item.snippet.thumbnails.high.height,
          },
        },
      },
    }));

    return {
      items,
      nextPageToken: data.nextPageToken || null,
    };
  } catch (error) {
    console.error("Error searching YouTube:", error);
    throw error;
  }
}
