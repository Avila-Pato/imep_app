// Anuncios de ejemplo (luego vendran de la API)
import { Anuncio } from "@/types/typesAnuncios";

export const ANUNCIOS: Anuncio[] = [
  {
    id: "1",
    categoria: "evento",
    titulo: "Aniversario de la iglesia",
    descripcion:
      "Celebramos 25 años juntos. Culto especial, almuerzo y testimonios.",
    fecha: "2026-10-25",
    hora: "10:00",
    lugar: "Templo principal",
    destacado: true,
  },
  {
    id: "2",
    categoria: "evento",
    titulo: "Cambio de horario del culto",
    descripcion:
      "Desde este domingo el culto general comienza a las 11:00 hrs.",
    fecha: "2026-10-15",
    urgente: true,
  },
  {
    id: "3",
    categoria: "jovenes",
    titulo: "Noche de alabanza",
    descripcion: "Trae a un amigo. Habrá once al final de la reunión.",
    fecha: "2026-10-17",
    hora: "20:00",
    lugar: "Salón de jóvenes",
  },
  {
    id: "4",
    categoria: "ninos",
    titulo: "Escuela dominical especial",
    descripcion: "Actividades y manualidades para niños de 4 a 12 años.",
    fecha: "2026-10-18",
    hora: "10:00",
    lugar: "Sala infantil",
  },
  {
    id: "5",
    categoria: "evento",
    titulo: "Colecta de alimentos",
    descripcion:
      "Recibimos alimentos no perecibles durante todo el mes en recepción.",
    fecha: "2026-10-31",
  },
  {
    id: "6",
    categoria: "evento",
    titulo: "Bautizos",
    descripcion:
      "Si deseas bautizarte, inscríbete con el pastor antes del 1 de noviembre.",
    fecha: "2026-11-08",
    hora: "11:00",
    lugar: "Templo principal",
  },
  {
    id: "7",
    categoria: "varones",
    titulo: "Desayuno de varones",
    descripcion:
      "Compartimos la Palabra y un desayuno entre hermanos. Invita a un amigo.",
    fecha: "2026-10-24",
    hora: "09:00",
    lugar: "Comedor del templo",
  },
];
