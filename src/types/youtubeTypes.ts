export interface YoutubeVideo {
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
