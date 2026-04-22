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

    boot: ['pinia', 'network'],

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
      workboxMode: 'InjectManifest',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

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
