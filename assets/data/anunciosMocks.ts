// Anuncios de ejemplo (luego vendran de la API)
import { Anuncio } from "@/types/typesAnuncios";

// Fecha "YYYY-MM-DD" a N dias de hoy (para que el ejemplo siempre tenga datos)
const enDias = (n: number) => {
  const f = new Date();
  f.setDate(f.getDate() + n);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};

export const ANUNCIOS: Anuncio[] = [
  {
    id: "1",
    categoria: "evento",
    titulo: "Aniversario de la iglesia",
    descripcion:
      "Celebramos 25 años juntos. Culto especial, almuerzo y testimonios.",
    fecha: enDias(5),
    hora: "10:00",
    lugar: "Templo principal",
    detalle:
      "Celebramos 25 años de fidelidad de Dios con nuestra iglesia. Tendremos un culto especial de acción de gracias, testimonios de hermanos que han caminado con nosotros desde el inicio y un almuerzo para toda la familia.\n\nTrae a tus familiares y amigos. Si puedes ayudar con la cocina o la decoración, habla con la secretaría.",
    imagen: "https://picsum.photos/seed/imep-aniversario/900/560",
  },
  {
    id: "3",
    categoria: "jovenes",
    titulo: "Noche de alabanza",
    descripcion: "Trae a un amigo. Habrá once al final de la reunión.",
    fecha: enDias(3),
    hora: "20:00",
    lugar: "Salón de jóvenes",
    detalle:
      "Una noche para adorar juntos con el grupo de alabanza de jóvenes. Habrá un momento de oración y compartiremos un once al final.\n\n¡Invita a un amigo que no conozca la iglesia!",
    imagen: "https://picsum.photos/seed/imep-alabanza/900/560",
  },
  {
    id: "4",
    categoria: "ninos",
    titulo: "Escuela dominical especial",
    descripcion: "Actividades y manualidades para niños de 4 a 12 años.",
    fecha: enDias(5),
    hora: "10:00",
    lugar: "Sala infantil",
  },
  {
    id: "7",
    categoria: "varones",
    titulo: "Desayuno de varones",
    descripcion:
      "Compartimos la Palabra y un desayuno entre hermanos. Invita a un amigo.",
    fecha: enDias(4),
    hora: "09:00",
    lugar: "Comedor del templo",
    detalle:
      "Desayuno y estudio de la Palabra para los varones de la iglesia. Este mes hablaremos sobre ser hombres de fe en el trabajo y en la familia.",
  },
  {
    id: "5",
    categoria: "evento",
    titulo: "Colecta de alimentos",
    descripcion:
      "Recibimos alimentos no perecibles durante todo el mes en recepción.",
    fecha: enDias(11),
  },
  {
    id: "6",
    categoria: "evento",
    titulo: "Bautizos",
    descripcion:
      "Si deseas bautizarte, inscríbete con el pastor antes del 1 de noviembre.",
    fecha: enDias(19),
    hora: "11:00",
    lugar: "Templo principal",
  },
];
