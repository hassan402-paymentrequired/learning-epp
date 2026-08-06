export type AppVersionPolicy = {
  ios_min_version: string;
  android_min_version: string;
  ios_store_url: string;
  android_store_url: string;
  force_update: boolean;
  message: string;
  update_required?: boolean;
  client_version?: string;
  min_version?: string;
  store_url?: string;
};

export type ForceUpdatePayload = {
  message: string;
  minVersion: string | null;
  storeUrl: string;
};
