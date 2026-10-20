import { IconName } from "./typesCronogramas";

export type CategoriaId = "evento" | "jovenes" | "varones" | "ninos";

export type Categoria = {
  label: string;
  icon: IconName;
};

// Lo minimo para publicar: titulo, texto, fecha y categoria
export type Anuncio = {
  id: string;
  categoria: CategoriaId;
  titulo: string;
  descripcion: string;
  fecha: string; // "YYYY-MM-DD"
  hora?: string;
  lugar?: string;
  // Opcionales: se ven al abrir el anuncio
  detalle?: string; // texto largo
  imagen?: string; // URL de la imagen del evento
};

// Horario fijo de culto (configurable por el lider)
export type HorarioCulto = {
  dia: number; // Date.getDay(): 0 = domingo ... 6 = sabado
  hora: string; // "19:30"
  nombre?: string; // ej: "Culto de oración"
};
