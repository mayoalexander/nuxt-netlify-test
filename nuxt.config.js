module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'travis-web-nuxt',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'yessir' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons' }
    ]
  },
  plugins: ['~/plugins/vuetify.js'],

  css: ['~/assets/style/app.styl'],

  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOOGLE_ANALYTICS_TOKEN: process.env.GOOGLE_ANALYTICS_TOKEN || 'fish',
    SENTRY_URI_KEY: process.env.SENTRY_URI_KEY || '20ca4e025ad2402b8dbe773f3845e0cc',
    SENTRY_PROJECT_ID: process.env.SENTRY_PROJECT_ID || '1215646',
    TRAVIS_API_ENDPOINT: process.env.TRAVIS_API_ENDPOINT || 'https://api.dev.travissupply.com',
    TRAVIS_HOWLER_API: process.env.TRAVIS_HOWLER_API || 'https://api.dev.travissupply.com/howler/v1/',
    TRAVIS_HOWLER_API_TOKEN: process.env.TRAVIS_HOWLER_API_TOKEN || 'Token ddc02d9ee40988f4f73f3f3fb5446b783195f258',
    TRAVIS_TAG_LINE: process.env.TRAVIS_TAG_LINE || 'YOUR LOCAL ROOFING DISTRIBUTOR',
    IP_FETCH_API: process.env.IP_FETCH_API || 'https://api.ipify.org/',
    TRAVIS_LOCATION_API: process.env.TRAVIS_LOCATION_API || 'https://api.dev.travissupply.com/location/v1/',
    GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY || 'AIzaSyA7PoPJWclO823y6nJig87TZge-uSoAFYg',
    TRAVIS_ACCTS_PAYABLE_EMAIL: process.env.TRAVIS_ACCTS_PAYABLE_EMAIL || 'ap@travissupply.com',
    TRAVIS_ACCTS_RECEIVABLE_EMAIL: process.env.TRAVIS_ACCTS_RECEIVABLE_EMAIL || 'credit@travissupply.com',
    TRAVIS_SUPPORT_LINK: process.env.TRAVIS_SUPPORT_LINK || 'https://trssupply.zendesk.com/hc/en-us/sections/115000816911-Customer-Support-',
    TRAVIS_PAYMENT_PORTAL: process.env.TRAVIS_PAYMENT_PORTAL || 'https://secure.billtrust.com/trssupply/ig/signin',
    TRAVIS_MOBILE_GOOGLE: process.env.TRAVIS_MOBILE_GOOGLE || 'https://play.google.com/store/apps/details?id=com.trssupply.mobile.travis&hl=en&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1',
    TRAVIS_MOBILE_ITUNES: process.env.TRAVIS_MOBILE_ITUNES || 'https://itunes.apple.com/us/app/travis-mobile/id1309410080?ls=1&amp;mt=8'
  },

  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {
    extractCSS: true,
    extend (config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
