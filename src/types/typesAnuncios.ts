import { ImageSource } from "expo-image";
import { IconName } from "./typesCronogramas";

export type CategoriaId = "evento" | "aviso" | "jovenes" | "ninos";

export type Categoria = {
  label: string;
  icon: IconName;
};

export type Anuncio = {
  id: string;
  categoria: CategoriaId;
  titulo: string;
  descripcion: string;
  fecha: string; // "YYYY-MM-DD"
  hora?: string;
  lugar?: string;
  urgente?: boolean;
  destacado?: boolean;
  imagen?: ImageSource; // ej: require("@/assets/images/evento.jpg")
};
