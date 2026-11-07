import { Href, Redirect } from "expo-router";

// Inicio se quito: su contenido (versiculo, mapa y proximo culto) esta en Anuncios
export default function Inicio() {
  return <Redirect href={"/eventos" as Href} />;
}
