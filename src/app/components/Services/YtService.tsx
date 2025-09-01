import { YoutubeVideo } from "@/app/types/youtubeTypes";

export async function getYouTubeVideos(
  query: string,
  pageToken?: string
): Promise<{ items: YoutubeVideo[]; nextPageToken: string | undefined }> {
  try {
    const url = new URL("/api/youtube/search", window.location.origin);
    url.searchParams.append("q", query);
    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    const items: YoutubeVideo[] = data.items.map((item: any) => ({
      id: {
        videoId: item.id.videoId,
      },
      snippet: {
        title: item.snippet.title,
        description: item.snippet.description,
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
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      },
    }));

    return {
      items,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
}
