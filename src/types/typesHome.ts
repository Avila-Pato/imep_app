import { ImageSource } from "expo-image";

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
  imagen?: ImageSource; // ej: require("@/assets/images/iglesia.jpg")
};

export type Devocional = {
  id: string;
  dia: string;
  titulo: string;
  enfoque: string;
};
