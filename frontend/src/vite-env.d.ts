/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_FIXTURES?: string;
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
