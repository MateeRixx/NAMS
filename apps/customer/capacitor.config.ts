import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.newsflow.customer',
  appName: 'NewsFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FCFAF6',
    },
  },
}

export default config
