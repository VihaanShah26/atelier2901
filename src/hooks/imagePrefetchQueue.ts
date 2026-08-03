import { useEffect } from 'react';

type QueueEntry = {
  url: string;
  priority: number;
  order: number;
};

const preloadedImages = new Map<string, HTMLImageElement>();
const queuedImages = new Map<string, QueueEntry>();
let queueCounter = 0;
let activeFetches = 0;
const MAX_CONCURRENT_FETCHES = 4;

const normalizeUrls = (imageUrls: Array<string | null | undefined>) =>
  imageUrls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

const startNext = () => {
  if (activeFetches >= MAX_CONCURRENT_FETCHES) return;

  const nextEntry = [...queuedImages.values()]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.order - b.order;
    })
    .find((entry) => !preloadedImages.has(entry.url));

  if (!nextEntry) return;

  queuedImages.delete(nextEntry.url);
  activeFetches += 1;

  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.onload = () => {
    activeFetches = Math.max(0, activeFetches - 1);
    startNext();
  };
  image.onerror = () => {
    activeFetches = Math.max(0, activeFetches - 1);
    startNext();
  };
  image.src = nextEntry.url;
  preloadedImages.set(nextEntry.url, image);
};

export const enqueueImagePrefetch = (imageUrls: Array<string | null | undefined>, priority = 100) => {
  normalizeUrls(imageUrls).forEach((url) => {
    if (preloadedImages.has(url)) return;

    const existing = queuedImages.get(url);
    const entry: QueueEntry = {
      url,
      priority: existing ? Math.min(existing.priority, priority) : priority,
      order: existing ? existing.order : queueCounter++,
    };

    queuedImages.set(url, entry);
  });

  startNext();
};

export const useImagePreloader = (imageUrls: Array<string | null | undefined>, priority = 100) => {
  useEffect(() => {
    enqueueImagePrefetch(imageUrls, priority);
  }, [imageUrls, priority]);
};

