import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuusuariomario.pethealth',
  appName: 'PetHealth',
  webDir: 'dist',
  server: {
    cleartext: false
  }
};

export default config;
