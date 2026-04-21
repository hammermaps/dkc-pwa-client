/* eslint-disable */

/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TOKEN_NAME: string;
  readonly VITE_TOKEN_TTL_DAYS: string;
}
