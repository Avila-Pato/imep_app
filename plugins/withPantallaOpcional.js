// Play avisaba: "android.hardware.screen.portrait" obligatorio deja fuera a
// tablets, Chromebooks y Android XR. La app sigue en vertical
// ("orientation": "portrait"), pero ya no EXIGE que el equipo tenga pantalla
// vertical: se declara como opcional (y gana sobre la de las librerias)
const { withAndroidManifest } = require("expo/config-plugins");

const FUNCIONES = [
  "android.hardware.screen.portrait",
  "android.hardware.screen.landscape",
];

module.exports = function withPantallaOpcional(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    const lista = (manifest["uses-feature"] ??= []);
    for (const nombre of FUNCIONES) {
      const previa = lista.find((f) => f.$["android:name"] === nombre);
      const opcional = {
        "android:name": nombre,
        "android:required": "false",
        "tools:replace": "android:required",
      };
      if (previa) previa.$ = { ...previa.$, ...opcional };
      else lista.push({ $: opcional });
    }
    return c;
  });
};
