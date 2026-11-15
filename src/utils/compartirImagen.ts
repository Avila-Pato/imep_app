// Compartir una imagen desde la web (solo se usa en Platform.OS === "web").
// En el navegador del telefono abre el menu de compartir con la imagen y el
// texto juntos (WhatsApp los manda en un solo mensaje). En el computador, o si
// el navegador no deja compartir archivos, la descarga.

// La "foto" de un elemento de la pagina tal como lo dibuja el navegador
// (html2canvas, el de react-native-view-shot, perdia fondos y fuentes).
// ancho: el de la imagen final en pixeles
export async function capturarWeb(elemento: unknown, ancho = 1080) {
  const { toPng } = await import("html-to-image");
  const nodo = elemento as HTMLElement;
  return toPng(nodo, {
    pixelRatio: ancho / nodo.getBoundingClientRect().width,
    cacheBust: true,
  });
}

// "compartido" | "descargado" | "cancelado" (cerro el menu sin elegir)
export async function compartirImagenWeb(
  dataUrl: string,
  nombre: string,
  texto: string,
): Promise<"compartido" | "descargado" | "cancelado"> {
  const blob = await (await fetch(dataUrl)).blob();
  const archivo = new File([blob], nombre, { type: "image/png" });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto });
      return "compartido";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelado";
      // NotAllowedError u otro: se descarga
    }
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return "descargado";
}
