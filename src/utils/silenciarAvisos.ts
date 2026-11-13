// Avisos conocidos que no son errores. Se importa PRIMERO en el layout raiz:
// expo-notifications avisa apenas se carga, antes que cualquier otro codigo
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  // En Expo Go las push remotas no funcionan (los recordatorios locales si).
  // Se prueban con el development build
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);
