// src/exam-simulator/lib/mediaStreamService.ts

class MediaStreamService {
  private static instance: MediaStreamService;
  public stream: MediaStream | null = null;

  private constructor() {}

  public static getInstance(): MediaStreamService {
    if (!MediaStreamService.instance) {
      MediaStreamService.instance = new MediaStreamService();
    }
    return MediaStreamService.instance;
  }

  public setStream(stream: MediaStream | null) {
    this.stream = stream;
  }

  public getStream(): MediaStream | null {
    const tempStream = this.stream;
    this.stream = null; // Consume the stream so it's only used once
    return tempStream;
  }
}

export const mediaStreamService = MediaStreamService.getInstance();
