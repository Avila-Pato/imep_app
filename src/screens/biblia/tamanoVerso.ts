// Letra mas chica para los versiculos largos (que quepan en la pantalla).
// "letra" es el tamaño elegido con A− / A+; el tope evita que un versiculo
// largo se salga de la pantalla
export const tamanoVerso = (texto: string, letra = 1) => {
  const n = texto.length;
  const base = n < 90 ? 34 : n < 170 ? 29 : n < 280 ? 25 : 21;
  const tope = n < 90 ? 56 : n < 170 ? 42 : n < 280 ? 33 : 27;
  return Math.min(base * letra, tope);
};
