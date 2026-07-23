import { useEffect } from 'react';

const preloadedImages = new Map<string, HTMLImageElement>();

export function useImagePreloader(imageUrls: Array<string | null | undefined>) {
  useEffect(() => {
    imageUrls
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url))
      .forEach((url) => {
        if (preloadedImages.has(url)) return;

        const image = new Image();
        image.decoding = 'async';
        image.loading = 'eager';
        image.src = url;
        preloadedImages.set(url, image);
      });
  }, [imageUrls]);
}
