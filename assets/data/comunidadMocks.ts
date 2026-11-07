// Publicaciones de ejemplo de otros hermanos (luego vendran de la API)
import { GrupoId, Mensaje, Miembro, Publicacion } from "@/types/typesComunidad";
import { haceHoras } from "@/utils/tiempo";

// Fechas relativas: el muro solo muestra lo de las ultimas 24 horas
export const PUBLICACIONES: Publicacion[] = [
  // Esperando aprobacion del lider
  {
    id: "m0",
    autor: "Rosa Herrera",
    grupo: "general",
    cita: "",
    texto:
      "Pido oración por la salud de mi mamá, mañana la operan de la cadera. Que el Señor guíe las manos de los médicos y le dé paz a toda la familia en estos días difíciles.",
    fecha: haceHoras(1),
    orando: 0,
    estado: "pendiente",
  },
  {
    id: "m1",
    autor: "María González",
    grupo: "general",
    cita: "Filipenses 4:6-7",
    mostrarCita: true,
    texto:
      "Señor, te entrego mi ansiedad por el trabajo. Gracias porque tu paz guarda mi corazón aunque no entienda todo.",
    fecha: haceHoras(2),
    orando: 14,
  },
];

// Miembros de cada sala (el usuario actual se agrega solo a todas)
export const MIEMBROS: Record<GrupoId, Miembro[]> = {
  general: [
    { nombre: "Pastor Luis Soto", rol: "Pastor" },
    { nombre: "Ana Muñoz", rol: "Secretaria" },
    { nombre: "María González" },
    { nombre: "Daniel Rojas" },
    { nombre: "Camila Torres" },
    { nombre: "Jorge Pérez" },
    { nombre: "Felipe Díaz" },
    { nombre: "Rosa Herrera" },
  ],
};

export const MENSAJES: Mensaje[] = [
  {
    id: "c1",
    grupo: "general",
    autor: "Pastor Luis Soto",
    texto:
      "Bendiciones hermanos. Recuerden que el domingo celebramos el aniversario 🙌",
    fecha: "2026-10-16T08:10:00",
  },
  {
    id: "c2",
    grupo: "general",
    autor: "María González",
    texto: "Amén pastor, ahí estaremos con la familia.",
    fecha: "2026-10-16T08:32:00",
  },
  {
    id: "c3",
    grupo: "general",
    autor: "Ana Muñoz",
    texto: "Quienes puedan traer algo para el almuerzo me avisan por aquí 🙏",
    fecha: "2026-10-16T10:05:00",
  },
];
