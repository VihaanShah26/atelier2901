import { useEffect, useState } from 'react';

type QueueEntry = {
  url: string;
  priority: number;
  order: number;
};

type ImagePreloaderStatus = {
  total: number;
  loaded: number;
  pending: number;
  isLoaded: boolean;
};

const preloadedImages = new Map<string, HTMLImageElement>();
const queuedImages = new Map<string, QueueEntry>();
const loadPromises = new Map<string, Promise<void>>();
const promiseResolvers = new Map<string, { resolve: () => void; reject: (reason?: unknown) => void }>();
const subscribers = new Set<() => void>();
let queueCounter = 0;
let activeFetches = 0;
const MAX_CONCURRENT_FETCHES = 6;

const normalizeUrls = (imageUrls: Array<string | null | undefined>) =>
  imageUrls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

const ensureLoadPromise = (url: string) => {
  if (loadPromises.has(url)) return loadPromises.get(url)!;

  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  promiseResolvers.set(url, { resolve, reject });
  loadPromises.set(url, promise);
  return promise;
};

const waitForImage = (url: string) => {
  if (preloadedImages.has(url)) return Promise.resolve();
  return ensureLoadPromise(url);
};

export const waitForImages = (imageUrls: Array<string | null | undefined>) =>
  Promise.all(normalizeUrls(imageUrls).map(waitForImage));

export const getPrefetchStatus = (imageUrls: Array<string | null | undefined>): ImagePreloaderStatus => {
  const urls = normalizeUrls(imageUrls);
  const loaded = urls.filter((url) => preloadedImages.has(url)).length;
  return {
    total: urls.length,
    loaded,
    pending: urls.length - loaded,
    isLoaded: urls.length === loaded,
  };
};

export const subscribeToPrefetchProgress = (callback: () => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

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
    preloadedImages.set(nextEntry.url, image);
    const resolver = promiseResolvers.get(nextEntry.url);
    resolver?.resolve();
    notifySubscribers();
    startNext();
  };
  image.onerror = () => {
    activeFetches = Math.max(0, activeFetches - 1);
    preloadedImages.set(nextEntry.url, image);
    const resolver = promiseResolvers.get(nextEntry.url);
    resolver?.resolve();
    notifySubscribers();
    startNext();
  };
  image.src = nextEntry.url;
  ensureLoadPromise(nextEntry.url);
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
    ensureLoadPromise(url);
  });

  notifySubscribers();
  startNext();
};

export const useImagePreloader = (
  imageUrls: Array<string | null | undefined>,
  priority = 100,
): ImagePreloaderStatus => {
  const [status, setStatus] = useState<ImagePreloaderStatus>(() => getPrefetchStatus(imageUrls));

  useEffect(() => {
    enqueueImagePrefetch(imageUrls, priority);
    const updateStatus = () => setStatus(getPrefetchStatus(imageUrls));
    updateStatus();
    const unsubscribe = subscribeToPrefetchProgress(updateStatus);
    return unsubscribe;
  }, [imageUrls, priority]);

  return status;
};

