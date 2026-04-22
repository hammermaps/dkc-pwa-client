/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & {
    __WB_MANIFEST: { url: string; revision: string | null }[];
  };
