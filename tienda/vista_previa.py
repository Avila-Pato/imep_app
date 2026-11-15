"""Imagen de vista previa del enlace (og:image): la que muestra WhatsApp,
Facebook, etc. arriba del mensaje al compartir el enlace de invitacion.

  python tienda/vista_previa.py  ->  public/og-invitacion.png (1200x630)

Mismo estilo que la tarjeta de invitacion de la app: fondo blanco, el
titulo y un dibujo del campo «Unete a tu iglesia» donde va el codigo.
"""
from PIL import Image, ImageDraw

from imagenes import RAIZ, fuente, icono

ANCHO, ALTO = 1200, 630
TINTA = (27, 27, 27)
GRIS = (111, 107, 102)
SUAVE = (243, 241, 236)
ACENTO = (229, 72, 77)
BLANCO = (255, 255, 255)


def invitacion():
    img = Image.new("RGB", (ANCHO, ALTO), SUAVE)
    d = ImageDraw.Draw(img)

    # tarjeta blanca
    d.rounded_rectangle((40, 40, ANCHO - 40, ALTO - 40), 40, fill=BLANCO)

    # marca
    logo = Image.open(RAIZ / "assets" / "images" / "logo.png").convert("RGBA")
    logo.thumbnail((56, 56))
    img.paste(logo, (100, 92), logo)
    d.text((170, 120), "CONGREGA", font=fuente("inter", "600SemiBold", 24),
           fill=TINTA, anchor="lm")

    # titulo
    d.text((100, 205), "Te invitaron a", font=fuente("inter", "500Medium", 34),
           fill=GRIS, anchor="ls")
    d.text((96, 300), "tu iglesia", font=fuente("eb-garamond", "600SemiBold", 104),
           fill=TINTA, anchor="ls")

    # pasos
    pasos = ["Descarga la app Congrega", "Escribe tu código de 4 letras"]
    f_paso = fuente("inter", "500Medium", 30)
    f_num = fuente("inter", "600SemiBold", 24)
    for i, texto in enumerate(pasos):
        y = 380 + i * 62
        d.ellipse((100, y - 20, 140, y + 20), fill=TINTA)
        d.text((120, y), str(i + 1), font=f_num, fill=BLANCO, anchor="mm")
        d.text((160, y), texto, font=f_paso, fill=TINTA, anchor="lm")

    # el campo de la app (lado derecho)
    x0, x1 = 700, 1100
    d.text((x0, 268), "Únete a tu ", font=fuente("eb-garamond", "600SemiBold", 44),
           fill=TINTA, anchor="ls")
    ancho = d.textlength("Únete a tu ", font=fuente("eb-garamond", "600SemiBold", 44))
    d.text((x0 + ancho, 268), "iglesia",
           font=fuente("eb-garamond", "400Regular_Italic", 44), fill=ACENTO, anchor="ls")
    y0, y1 = 300, 380
    d.rounded_rectangle((x0, y0, x1, y1), 22, fill=BLANCO, outline=ACENTO, width=4)
    icono(d, "link", (x0 + 40, (y0 + y1) // 2), 26, GRIS)
    # 4 casillas vacias: ahi va su codigo
    for i in range(4):
        cx = x0 + 100 + i * 52
        d.rounded_rectangle((cx - 20, y0 + 20, cx + 20, y1 - 20), 8, fill=SUAVE)
    d.rectangle((x0 + 312, y0 + 22, x0 + 315, y1 - 22), fill=ACENTO)
    icono(d, "arrow-up", ((x0 + x1) // 2, 420), 30, ACENTO)
    d.text(((x0 + x1) // 2, 470), "tu código va aquí",
           font=fuente("inter", "600SemiBold", 28), fill=ACENTO, anchor="mm")

    # pie
    d.text((100, 540), "Anuncios · turnos · salas · Biblia",
           font=fuente("inter", "400Regular", 26), fill=GRIS, anchor="lm")

    destino = RAIZ / "public" / "og-invitacion.png"
    img.save(destino, optimize=True)
    print(destino, destino.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    invitacion()
