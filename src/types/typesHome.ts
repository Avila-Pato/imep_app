import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ComponentProps } from "react";

export type PalabraDelDia = {
  texto: string;
  cita: string;
};

export type Iglesia = {
  sede: string;
  culto: string;
  detalle: string;
  estado: string;
  cuando: string;
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

export type Devocional = {
  id: string;
  dia: string;
  titulo: string;
  enfoque: string;
};
