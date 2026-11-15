"""Imagenes para la ficha de Google Play.

Uso (desde la raiz del proyecto):
    python tienda/imagenes.py

1) Grafico destacado (1024x500): tienda/grafico-destacado.png
2) Capturas con marco (1080x1920): pon tus capturas del telefono en
   tienda/capturas/originales/ con el numero de su frase (01.png ... 08.png)
   y salen listas en tienda/capturas/listas/
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
TIENDA = RAIZ / "tienda"
ORIGINALES = TIENDA / "capturas" / "originales"
LISTAS = TIENDA / "capturas" / "listas"
FUENTES = RAIZ / "node_modules" / "@expo-google-fonts"

# los colores de la app (tema rojo, fondo oscuro)
FONDO = (18, 18, 18)
SUPERFICIE = (30, 30, 30)
BORDE = (52, 52, 52)
TEXTO = (242, 242, 242)
TENUE = (154, 154, 154)
PRIMARIO = (229, 72, 77)

# Se quitan la barra de estado (hora, bateria) y la de botones de Android:
# que parte del alto de la captura cortar arriba y abajo. Si tu telefono
# usa gestos (sin los 3 botones), baja ABAJO a 0.03
ARRIBA = 0.035
ABAJO = 0.065

# la frase de cada captura (mismo orden que en ficha-play-store.md)
FRASES = {
    "01": ("Todo lo de tu iglesia", "en un solo lugar"),
    "02": ("Organiza los turnos", "de servicio de cada culto"),
    "03": ("Una sala para cada grupo", "con su chat, su líder y encuentros"),
    "04": ("Oren unos por otros", "peticiones de oración con tu iglesia"),
    "05": ("La Biblia en tu bolsillo", "RVR1960, NTV, LBLA y más"),
    "06": ("Un versículo nuevo", "cada vez que deslizas"),
    "07": ("Aprende versículos", "jugando, solo o en familia"),
    "08": ("Invita a tu iglesia", "con un código o un QR"),
}


ICONOS = RAIZ / "node_modules" / "@expo" / "vector-icons" / "build" / "vendor" / "react-native-vector-icons"


def icono(d: ImageDraw.ImageDraw, nombre: str, centro, tamano: int, color):
    """Un icono de Octicons (los mismos de la app)"""
    mapa = json.loads((ICONOS / "glyphmaps" / "Octicons.json").read_text())
    f = ImageFont.truetype(str(ICONOS / "Fonts" / "Octicons.ttf"), tamano)
    d.text(centro, chr(mapa[nombre]), font=f, fill=color, anchor="mm")


def fuente(familia: str, peso: str, tamano: int):
    carpeta = FUENTES / familia / peso
    ttf = next(carpeta.glob("*.ttf"))
    return ImageFont.truetype(str(ttf), tamano)


def resplandor(ancho: int, alto: int, centro, radio: int, alfa: int):
    """Un brillo suave del color del tema (como el de la app)"""
    capa = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    x, y = centro
    d.ellipse((x - radio, y - radio, x + radio, y + radio), fill=(*PRIMARIO, alfa))
    return capa.filter(ImageFilter.GaussianBlur(radio // 2))


def logo_en_circulo(tamano: int):
    """El logo sobre un circulo blanco (como en la app)"""
    circulo = Image.new("RGBA", (tamano, tamano), (0, 0, 0, 0))
    ImageDraw.Draw(circulo).ellipse((0, 0, tamano - 1, tamano - 1), fill="white")
    logo = Image.open(RAIZ / "assets" / "images" / "logo.png").convert("RGBA")
    interior = int(tamano * 0.78)
    logo = logo.resize((interior, interior), Image.LANCZOS)
    m = (tamano - interior) // 2
    circulo.alpha_composite(logo, (m, m))
    return circulo


def centrado(d: ImageDraw.ImageDraw, texto: str, f, y: int, ancho: int, color):
    w = d.textlength(texto, font=f)
    d.text(((ancho - w) / 2, y), texto, font=f, fill=color)


def redondear(im: Image.Image, radio: int):
    mascara = Image.new("L", im.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, *im.size), radio, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mascara)
    return out


def telefono(captura: Image.Image, ancho: int):
    """La captura con bordes redondeados, un marco fino y sombra"""
    alto = int(captura.height * ancho / captura.width)
    pantalla = redondear(captura.resize((ancho, alto), Image.LANCZOS), 52)
    marco = 12
    caja = Image.new("RGBA", (ancho + marco * 2, alto + marco * 2), (0, 0, 0, 0))
    ImageDraw.Draw(caja).rounded_rectangle(
        (0, 0, caja.width - 1, caja.height - 1), 64, fill=(*BORDE, 255)
    )
    caja.alpha_composite(pantalla, (marco, marco))
    # sombra
    sombra = Image.new("RGBA", (caja.width + 120, caja.height + 120), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle(
        (60, 80, 60 + caja.width, 80 + caja.height), 64, fill=(0, 0, 0, 170)
    )
    sombra = sombra.filter(ImageFilter.GaussianBlur(30))
    sombra.alpha_composite(caja, (60, 60))
    return sombra


def grafico_destacado():
    W, H = 1024, 500
    im = Image.new("RGBA", (W, H), (*FONDO, 255))
    im.alpha_composite(resplandor(W, H, (230, 250), 300, 70))
    im.alpha_composite(resplandor(W, H, (900, 40), 220, 40))
    d = ImageDraw.Draw(im)

    # izquierda: logo + nombre + frase
    im.alpha_composite(logo_en_circulo(132), (72, 92))
    d.text((72, 246), "Congrega", font=fuente("eb-garamond", "600SemiBold", 86), fill=TEXTO)
    d.text((76, 352), "La app de tu iglesia", font=fuente("inter", "600SemiBold", 34), fill=PRIMARIO)
    d.text(
        (76, 404),
        "Anuncios · Turnos · Salas · Oración · Biblia",
        font=fuente("inter", "500Medium", 21),
        fill=TENUE,
    )

    # derecha: si ya hay capturas, dos telefonos asomando
    caps = sorted(ORIGINALES.glob("*.png")) if ORIGINALES.exists() else []
    if caps:
        for i, (cap, x, y) in enumerate(
            zip([caps[0], caps[min(2, len(caps) - 1)]], (600, 790), (70, 130))
        ):
            tel = telefono(Image.open(cap).convert("RGB"), 190)
            im.alpha_composite(tel, (x - 60, y - 60))
    else:
        # sin capturas: tarjetas que imitan la app
        tarjetas = [
            ("megaphone", "Culto de jóvenes", "Sábado · 19:00"),
            ("checklist", "Te asignaron un turno", "Palabra · domingo 11:00"),
            ("heart", "Ana pide oración", "12 hermanos orando"),
        ]
        fT = fuente("inter", "600SemiBold", 22)
        fS = fuente("inter", "500Medium", 17)
        for i, (ic, t, s) in enumerate(tarjetas):
            x, y = 600 + i * 22, 110 + i * 100
            d.rounded_rectangle((x, y, x + 340, y + 82), 20, fill=SUPERFICIE, outline=BORDE)
            d.ellipse((x + 18, y + 21, x + 58, y + 61), fill=PRIMARIO)
            icono(d, ic, (x + 38, y + 41), 20, "white")
            d.text((x + 74, y + 16), t, font=fT, fill=TEXTO)
            d.text((x + 74, y + 47), s, font=fS, fill=TENUE)

    salida = TIENDA / "grafico-destacado.png"
    im.convert("RGB").save(salida, optimize=True)
    print("listo:", salida.relative_to(RAIZ))


def captura_con_marco(origen: Path):
    W, H = 1080, 1920
    titulo, sub = FRASES.get(origen.stem[:2], ("Congrega", "la app de tu iglesia"))
    im = Image.new("RGBA", (W, H), (*FONDO, 255))
    im.alpha_composite(resplandor(W, H, (W // 2, 120), 420, 80))
    d = ImageDraw.Draw(im)
    centrado(d, titulo, fuente("inter", "600SemiBold", 66), 120, W, TEXTO)
    centrado(d, sub, fuente("inter", "500Medium", 38), 214, W, PRIMARIO)

    cap = Image.open(origen).convert("RGB")
    cap = cap.crop((0, int(cap.height * ARRIBA), cap.width, int(cap.height * (1 - ABAJO))))
    tel = telefono(cap, 760)
    # el telefono puede salirse por abajo (se ve mas grande y cercano)
    im.alpha_composite(tel, ((W - tel.width) // 2, 300))
    LISTAS.mkdir(parents=True, exist_ok=True)
    salida = LISTAS / f"{origen.stem}.png"
    im.convert("RGB").save(salida, optimize=True)
    print("listo:", salida)


def icono_tienda():
    """Icono de la ficha (512x512, PNG, sin esquinas redondeadas: Google
    las redondea solo). Sale del mismo icono de la app"""
    im = Image.open(RAIZ / "assets" / "images" / "icon.png").convert("RGB")
    salida = TIENDA / "icono-512.png"
    im.resize((512, 512), Image.LANCZOS).save(salida, optimize=True)
    print("listo:", salida, f"({salida.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    icono_tienda()
    grafico_destacado()
    ORIGINALES.mkdir(parents=True, exist_ok=True)
    caps = sorted(ORIGINALES.glob("*.png")) + sorted(ORIGINALES.glob("*.jpg"))
    if not caps:
        print(f"Sin capturas aún: ponlas en {ORIGINALES.relative_to(RAIZ)} (01.png ... 08.png)")
    for c in caps:
        captura_con_marco(c)
