import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ComponentProps } from "react";

export type PalabraDelDia = {
  texto: string;
  cita: string;
};

export type Iglesia = {
  id?: string; // separa los datos de cada iglesia (las antiguas no lo tienen)
  subida?: boolean; // ya esta en el servidor (si luego no aparece, se borro)
  sede: string;
  lugar: string;
  direccion: string; // se usa en "Como llegar" (Google/Apple ubican el numero exacto)
  // Ubicacion del templo para dibujar el mapa
  lat: number;
  lng: number;
};

export type RedSocial = {
  id: string;
  nombre: string;
  usuario: string; // como se muestra, ej: "@iglesia"
  url: string;
  icono: ComponentProps<typeof FontAwesome6>["name"];
};
