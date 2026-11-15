import { FuncionSala, TipoSala } from "@/types/typesComunidad";
import { IconName } from "@/types/typesCronogramas";

// Tipos de sala: al crear una, el pastor elige para quien es y la sala parte
// lista (nombre, icono, color, que tiene y sus ajustes). Despues cambia lo que
// quiera
export type TipoDeSala = {
  id: TipoSala;
  titulo: string; // en la lista de tipos
  explica: string; // que trae listo
  nombre: string; // nombre sugerido de la sala
  descripcion: string;
  icono: IconName;
  tono: string;
  funciones: Record<FuncionSala, boolean>;
  soloLider?: boolean;
  letraGrande?: boolean;
};

const TODO = { chat: true, oracion: true, palabra: true };

export const TIPOS_SALA: TipoDeSala[] = [
  {
    id: "ninos",
    titulo: "Niños",
    explica: "Solo el líder escribe: avisos para los papás",
    nombre: "Niños",
    descripcion: "Avisos y actividades de los niños",
    icono: "smiley",
    tono: "#E8C47A",
    funciones: TODO,
    soloLider: true,
  },
  {
    id: "preadolescentes",
    titulo: "Preadolescentes",
    explica: "Chat con su líder, oración y palabra",
    nombre: "Preadolescentes",
    descripcion: "Grupo de preadolescentes",
    icono: "rocket",
    tono: "#9FC2E0",
    funciones: TODO,
  },
  {
    id: "jovenes",
    titulo: "Jóvenes",
    explica: "Todo activado: chat, oración y palabra",
    nombre: "Jóvenes",
    descripcion: "Grupo de jóvenes",
    icono: "flame",
    tono: "#E7A07E",
    funciones: TODO,
  },
  {
    id: "mujeres",
    titulo: "Mujeres",
    explica: "Todo activado: chat, oración y palabra",
    nombre: "Mujeres",
    descripcion: "Grupo de mujeres",
    icono: "heart",
    tono: "#D9A9B8",
    funciones: TODO,
  },
  {
    id: "varones",
    titulo: "Varones",
    explica: "Todo activado: chat, oración y palabra",
    nombre: "Varones",
    descripcion: "Grupo de varones",
    icono: "shield",
    tono: "#A9B8C9",
    funciones: TODO,
  },
  {
    id: "matrimonios",
    titulo: "Matrimonios",
    explica: "Todo activado: chat, oración y palabra",
    nombre: "Matrimonios",
    descripcion: "Grupo de matrimonios",
    icono: "people",
    tono: "#C9B7D6",
    funciones: TODO,
  },
  {
    id: "mayores",
    titulo: "Adultos mayores",
    explica: "Todo activado, con letra más grande",
    nombre: "Adultos mayores",
    descripcion: "Grupo de adultos mayores",
    icono: "sun",
    tono: "#C2CCB6",
    funciones: TODO,
    letraGrande: true,
  },
  {
    id: "alabanza",
    titulo: "Alabanza / ministerio",
    explica: "Chat y palabra, sin muro de oración",
    nombre: "Alabanza",
    descripcion: "Equipo de alabanza",
    icono: "unmute",
    tono: "#D8C8A8",
    funciones: { chat: true, oracion: false, palabra: true },
  },
  {
    id: "otra",
    titulo: "Otra",
    explica: "La armas tú desde cero",
    nombre: "",
    descripcion: "",
    icono: "people",
    tono: "#B8C4CC",
    funciones: TODO,
  },
];

export const tipoDeSala = (id?: TipoSala) =>
  TIPOS_SALA.find((t) => t.id === id);
