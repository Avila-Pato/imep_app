import { CATEGORIAS } from "@/constants/constans";
import { CategoriaId } from "@/types/typesAnuncios";
import { IconName } from "@/types/typesCronogramas";

// Nombre e icono de una categoria. Las que crea el admin ("Mujeres",
// "Matrimonios"...) se guardan con su nombre tal cual: asi el hermano la ve
// sin configurar nada (viaja con el anuncio)
export function categoriaDe(id: string): { label: string; icon: IconName } {
  return CATEGORIAS[id as CategoriaId] ?? { label: id, icon: "tag" };
}

// Categorias usadas en estos anuncios (sin repetir), despues de "evento"
export function categoriasUsadas(lista: { categoria: string }[]) {
  return [
    "evento",
    ...new Set(lista.map((a) => a.categoria).filter((c) => c !== "evento")),
  ];
}
