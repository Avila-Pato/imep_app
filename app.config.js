// Toma app.json y agrega lo que depende de variables de entorno (las claves
// no van escritas en el repo). En EAS salen de "Environment variables";
// en el computador, de .env.local
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    // mapa de Google en Android (Maps SDK for Android)
    [
      "react-native-maps",
      { androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY },
    ],
  ],
});
