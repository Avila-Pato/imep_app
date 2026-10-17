// Publicaciones de ejemplo de otros hermanos (luego vendran de la API)
import {
  EstudioSala,
  GrupoId,
  Mensaje,
  Miembro,
  Publicacion,
} from "@/types/typesComunidad";
import { haceHoras } from "@/utils/tiempo";

// Fechas relativas: el muro solo muestra lo de las ultimas 24 horas
export const PUBLICACIONES: Publicacion[] = [
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
  {
    id: "m2",
    autor: "Daniel Rojas",
    grupo: "jovenes",
    cita: "Isaías 41:10",
    texto:
      "Padre, que no tema a lo que viene esta semana. Sostenme con tu diestra y dame fuerzas para servir.",
    fecha: haceHoras(5),
    orando: 9,
  },
  {
    id: "m3",
    autor: "Camila Torres",
    grupo: "dorcas",
    cita: "Salmos 23:1",
    texto:
      "Nada me falta porque Tú eres mi pastor. Oro por mi familia, que también te conozcan así.",
    fecha: haceHoras(9),
    orando: 22,
  },
  {
    id: "m4",
    autor: "Jorge Pérez",
    grupo: "varones",
    cita: "Josué 1:9",
    mostrarCita: true,
    texto:
      "Señor, dame valor para guiar a mi casa. Que sea esforzado y valiente porque Tú vas conmigo.",
    fecha: haceHoras(14),
    orando: 11,
  },
  {
    id: "m5",
    autor: "Felipe Díaz",
    grupo: "jovenes",
    cita: "1 Timoteo 4:12",
    texto:
      "Que mi vida sea ejemplo en palabra y conducta para mis amigos del colegio.",
    fecha: haceHoras(1),
    orando: 6,
  },
  {
    id: "m6",
    autor: "Rosa Herrera",
    grupo: "ninos",
    cita: "Mateo 19:14",
    texto:
      "Oramos por los niños de la escuela dominical, que crezcan amando a Jesús.",
    fecha: haceHoras(20),
    orando: 18,
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
  jovenes: [
    { nombre: "Daniel Rojas", rol: "Líder" },
    { nombre: "Felipe Díaz" },
    { nombre: "Camila Torres" },
  ],
  varones: [
    { nombre: "Jorge Pérez", rol: "Líder" },
    { nombre: "Pastor Luis Soto", rol: "Pastor" },
    { nombre: "Daniel Rojas" },
  ],
  dorcas: [
    { nombre: "Rosa Herrera", rol: "Líder" },
    { nombre: "María González" },
    { nombre: "Ana Muñoz" },
    { nombre: "Camila Torres" },
  ],
  ninos: [
    { nombre: "Camila Torres", rol: "Maestra" },
    { nombre: "Rosa Herrera", rol: "Maestra" },
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
  {
    id: "c4",
    grupo: "jovenes",
    autor: "Daniel Rojas",
    texto: "Jóvenes, el jueves ensayamos a las 19:00 antes de la reunión.",
    fecha: "2026-10-15T19:40:00",
  },
  {
    id: "c5",
    grupo: "jovenes",
    autor: "Felipe Díaz",
    texto: "Voy! Llevo la guitarra 🎸",
    fecha: "2026-10-15T20:02:00",
  },
  {
    id: "c6",
    grupo: "varones",
    autor: "Jorge Pérez",
    texto: "Varones, el sábado hay desayuno a las 9:00 en el templo.",
    fecha: "2026-10-14T21:15:00",
  },
  {
    id: "c7",
    grupo: "dorcas",
    autor: "Rosa Herrera",
    texto: "Hermanas, oremos por la salud de la hermana Carmen.",
    fecha: "2026-10-16T12:20:00",
  },
  {
    id: "c8",
    grupo: "dorcas",
    autor: "María González",
    texto: "Amén, la tengo en oración 🙏",
    fecha: "2026-10-16T12:41:00",
  },
  {
    id: "c9",
    grupo: "ninos",
    autor: "Camila Torres",
    texto: "Este domingo los niños presentan el versículo de memoria 😊",
    fecha: "2026-10-13T17:00:00",
  },
];

// Estudio de la semana de cada sala
export const ESTUDIOS_SALA: EstudioSala[] = [
  {
    id: "es-varones-42",
    grupo: "varones",
    titulo: "Esfuérzate y sé valiente",
    cita: "Josué 1:8-9",
    guia: "Hno. Luis Morales",
    semana: "2026-10-12",
  },
  {
    id: "es-jovenes-42",
    grupo: "jovenes",
    titulo: "Que nadie tenga en poco tu juventud",
    cita: "1 Timoteo 4:12",
    guia: "Hna. Camila Rojas",
    semana: "2026-10-12",
  },
  {
    id: "es-dorcas-42",
    grupo: "dorcas",
    titulo: "Llena de buenas obras",
    cita: "Hechos 9:36-39",
    guia: "Hna. Rosa Fuentes",
    semana: "2026-10-12",
  },
  {
    id: "es-ninos-42",
    grupo: "ninos",
    titulo: "El buen pastor",
    cita: "Juan 10:11-14",
    guia: "Hna. Paula Díaz",
    semana: "2026-10-12",
  },
];
