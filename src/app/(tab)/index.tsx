import { tomarRegreso } from "@/constants/tema";
import { Href, Redirect } from "expo-router";

// Despues de cambiar el color la app se reinicia: se abre donde estaba
// (ej. el Perfil). Se lee una sola vez al cargar la app
const REGRESO = tomarRegreso();

// Inicio se quito: lleva a Anuncios (o a la pantalla pendiente del reinicio)
export default function Inicio() {
  return <Redirect href={(REGRESO ?? "/eventos") as Href} />;
}
