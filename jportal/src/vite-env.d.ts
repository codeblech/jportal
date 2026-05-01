interface ImportMetaEnv {
  readonly DEV: boolean; // builtin Vite variable ... cannot be overridden in .env
  readonly BASE_URL: string;
  readonly VITE_APP_BASE_PATH: string;
  readonly VITE_CLOUDFLARE_API_TOKEN: string;
  readonly VITE_USE_FAKE_DATA: boolean;
  readonly VITE_CLOUDFLARE_BASE_URL: string;
  readonly VITE_CLOUDFLARE_PROXY_URL: string;
  readonly VITE_CLOUDFLARE_ACCOUNT_TAG: string;
  readonly VITE_CLOUDFLARE_SITE_TAG: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
