import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.tradblestory.app',
    appName: 'TradbleStory',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        Filesystem: {
            iosFileLocation: 'Library/Application Support'
        }
    }
};

export default config;
