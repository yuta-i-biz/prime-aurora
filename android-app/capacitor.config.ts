import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.primeaurora.app',
  appName: 'Prime Aurora',
  webDir: 'www',
  server: {
    url: 'https://あなたの-vercel-の-URL.vercel.app', // ここに本番URLを入れる
    cleartext: true
  }
};

export default config;
