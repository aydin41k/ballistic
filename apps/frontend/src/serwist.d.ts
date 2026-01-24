declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: Array<unknown>;
  }
}

export {};
