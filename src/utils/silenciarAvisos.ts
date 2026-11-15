// Avisos conocidos que no son errores. Se importa PRIMERO en el layout raiz:
// expo-notifications avisa apenas se carga, antes que cualquier otro codigo
import { LogBox } from "react-native";

const CONOCIDOS = [
  // En Expo Go las push remotas no funcionan (los recordatorios locales si).
  // Se prueban con el development build
  "`expo-notifications` functionality is not fully supported in Expo Go",
  // En la web no hay push: escuchar el token no hace nada (en el celular si)
  "Listening to push token changes is not yet fully supported on web",
  // El equipo tiene "reducir animaciones": Reanimated lo respeta (el
  // esqueleto de carga queda quieto). Solo avisa en desarrollo
  "Reduced motion setting is enabled on this device",
];

// en la app (la ventanita amarilla)
LogBox.ignoreLogs(CONOCIDOS);

// en la terminal: LogBox no los filtra ahi. Solo en desarrollo; los demas
// avisos siguen saliendo igual
if (__DEV__) {
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    const texto = args.map(String).join(" ");
    if (CONOCIDOS.some((c) => texto.includes(c))) return;
    original(...args);
  };
}
