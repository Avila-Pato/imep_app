// Separa la ultima palabra de un titulo para mostrarla en cursiva
export const partirTitulo = (titulo: string) => {
  const t = titulo.trim();
  const i = t.lastIndexOf(" ");
  return i === -1
    ? { inicio: "", final: t }
    : { inicio: t.slice(0, i + 1), final: t.slice(i + 1) };
};
