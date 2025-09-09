/// <reference types="vite/client" />
/// <reference path="./types/telegram.d.ts" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_WEBAPP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}