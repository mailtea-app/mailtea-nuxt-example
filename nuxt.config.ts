export default defineNuxtConfig({
  compatibilityDate: "2026-08-27",

  // Keys at the top level of `runtimeConfig` are server-only — Nuxt never
  // ships them to the browser. (Only a `public` sub-object would be.) Each key
  // is overridden at runtime by its NUXT_-prefixed, SCREAMING_SNAKE env var,
  // so `mailteaApiKey` reads NUXT_MAILTEA_API_KEY.
  runtimeConfig: {
    mailteaApiKey: "",
    mailteaFrom: "",
    // Only for local dev or a self-hosted Mailtea. Empty means api.mailtea.app.
    mailteaApiBaseUrl: ""
  }
});
