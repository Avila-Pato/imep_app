// Datos de ejemplo del Home (luego vendran de la API)
import { Iglesia, PalabraDelDia, RedSocial } from "@/types/typesHome";

export const NOTIFICACIONES = 2;

// Versiculos cortos (RV1960): en Inicio se muestra uno al azar cada vez
export const PALABRAS: PalabraDelDia[] = [
  { texto: "Estad quietos, y conoced que yo soy Dios.", cita: "Salmos 46:10" },
  { texto: "Jehová es mi pastor; nada me faltará.", cita: "Salmos 23:1" },
  {
    texto: "Todo lo puedo en Cristo que me fortalece.",
    cita: "Filipenses 4:13",
  },
  { texto: "Dios es amor.", cita: "1 Juan 4:8" },
  {
    texto: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
    cita: "Salmos 119:105",
  },
  {
    texto:
      "Echad toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.",
    cita: "1 Pedro 5:7",
  },
  {
    texto: "Mas buscad primeramente el reino de Dios y su justicia.",
    cita: "Mateo 6:33",
  },
  {
    texto:
      "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.",
    cita: "Proverbios 3:5",
  },
  {
    texto: "No temas, porque yo estoy contigo.",
    cita: "Isaías 41:10",
  },
  {
    texto: "Yo soy el camino, y la verdad, y la vida.",
    cita: "Juan 14:6",
  },
  {
    texto: "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.",
    cita: "Salmos 118:24",
  },
  {
    texto:
      "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    cita: "Mateo 11:28",
  },
  { texto: "Orad sin cesar.", cita: "1 Tesalonicenses 5:17" },
  {
    texto: "El gozo de Jehová es vuestra fuerza.",
    cita: "Nehemías 8:10",
  },
  {
    texto: "Jehová peleará por vosotros, y vosotros estaréis tranquilos.",
    cita: "Éxodo 14:14",
  },
  {
    texto: "Por nada estéis afanosos.",
    cita: "Filipenses 4:6",
  },
  {
    texto: "Mira que te mando que te esfuerces y seas valiente.",
    cita: "Josué 1:9",
  },
  {
    texto: "Bueno es Jehová; para siempre es su misericordia.",
    cita: "Salmos 100:5",
  },
  {
    texto: "La paz os dejo, mi paz os doy.",
    cita: "Juan 14:27",
  },
  {
    texto: "Nuevas son cada mañana; grande es tu fidelidad.",
    cita: "Lamentaciones 3:23",
  },
];

export const IGLESIA: Iglesia = {
  sede: "IMEP · Sede central",
  lugar: "Templo principal", // el dia y la hora salen del horario de cultos
  direccion: "Pje. Volcán Tronador 859, El Bosque, Región Metropolitana",
  // Centro del pasaje Volcán Tronador (OpenStreetMap no tiene el numero exacto)
  lat: -33.5821853,
  lng: -70.6739371,
};

// TODO: reemplazar por los links y usuarios reales de la iglesia
export const REDES: RedSocial[] = [
  {
    id: "facebook",
    nombre: "Facebook",
    usuario: "IMEP Iglesia",
    url: "https://www.facebook.com/",
    icono: "facebook-f",
  },
  {
    id: "instagram",
    nombre: "Instagram",
    usuario: "@imep",
    url: "https://www.instagram.com/",
    icono: "instagram",
  },
  {
    id: "tiktok",
    nombre: "TikTok",
    usuario: "@imep",
    url: "https://www.tiktok.com/",
    icono: "tiktok",
  },
  {
    id: "youtube",
    nombre: "YouTube",
    usuario: "@imep",
    url: "https://www.youtube.com/",
    icono: "youtube",
  },
];
