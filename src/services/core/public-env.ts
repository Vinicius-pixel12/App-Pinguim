/**
 * Variáveis públicas disponíveis no browser (prefixo VITE_).
 * Nada aqui pode ser secreto.
 */

export const publicEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
  /** Base do CDN para montar URLs de mídia (ex.: https://cdn.pinguim.app). */
  cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL as string | undefined,
  /** Config web do Firebase (chaves publicáveis por design). */
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID as string | undefined,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined,
  },
} as const;
