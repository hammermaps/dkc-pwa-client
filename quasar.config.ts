import { configure } from 'quasar/wrappers';

export default configure((/* ctx */) => {
  return {
    eslint: {
      fix: true,
      include: [],
      exclude: [],
      rawOptions: {},
      warnings: true,
      errors: true,
    },

    boot: ['pinia', 'axios'],

    css: ['app.scss'],

    extras: ['mdi-v7', 'roboto-font', 'material-icons'],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },

      typescript: {
        strict: true,
        vueShim: true,
      },

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            vueTsc: {
              tsconfigPath: 'tsconfig.vue-tsc.json',
            },
            eslint: {
              lintCommand:
                'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
            },
            overlay: {
              initialIsOpen: false,
            },
          },
          { server: false },
        ],
      ],
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        dark: 'auto',
        notify: {
          position: 'bottom',
          timeout: 3000,
        },
        loading: {
          spinnerColor: 'primary',
        },
      },

      iconSet: 'material-icons',
      lang: 'de',

      plugins: ['Notify', 'Loading', 'Dialog', 'LocalStorage', 'SessionStorage', 'BottomSheet'],
    },

    animations: 'all',

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: ['render'],
    },

    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/api\.php\?action=dashboard_data/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-dashboard',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 300,
              },
            },
          },
          {
            urlPattern: /\/api\.php\?action=(nea_|mm_|building_|keys_|projects_)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 3600,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },

      manifest: {
        name: 'DK-Control',
        short_name: 'DK-Control',
        description: 'DK-Control PWA – Zählererfassung & Facility Management',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1976D2',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true,
    },

    electron: {
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'de.hammermaps.dkc-pwa-client',
      },
    },

    bex: {
      extraScripts: [],
    },
  };
});
