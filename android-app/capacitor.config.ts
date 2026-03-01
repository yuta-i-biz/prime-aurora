import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.primeaurora.app',
  appName: 'Prime Aurora',
  webDir: 'www',
  server: {
    url: 'https://prime-aurora-xi.vercel.app',
    cleartext: true
  }
};

export default config;
