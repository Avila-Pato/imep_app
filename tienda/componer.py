"""Capturas de Play Store "de diseno": varias pantallas por imagen.

Uso:
    python tienda/componer.py <carpeta-con-pantallas>

Las pantallas (1236x2745, sacadas de la version web con una iglesia de
ejemplo) se llaman anuncios-rojo.png, cronograma.png, biblia.png... Salen
listas en tienda/capturas/listas/ (1080x1920, en el orden de la ficha).
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from imagenes import (  # noqa: E402
    FONDO,
    LISTAS,
    PRIMARIO,
    TENUE,
    TEXTO,
    centrado,
    fuente,
    resplandor,
    telefono,
)

W, H = 1080, 1920
COLORES = {
    "rojo": (229, 72, 77),
    "azul": (62, 142, 247),
    "verde": (48, 164, 108),
    "morado": (142, 78, 198),
}


def lienzo(titulo: str, sub: str, color=PRIMARIO):
    im = Image.new("RGBA", (W, H), (*FONDO, 255))
    capa = resplandor(W, H, (W // 2, 80), 460, 85)
    if color != PRIMARIO:  # el brillo del color de esa imagen
        r, g, b, _ = capa.split()
        capa = Image.merge(
            "RGBA",
            (
                r.point(lambda _: color[0]),
                g.point(lambda _: color[1]),
                b.point(lambda _: color[2]),
                capa.getchannel("A"),
            ),
        )
    im.alpha_composite(capa)
    d = ImageDraw.Draw(im)
    centrado(d, titulo, fuente("inter", "600SemiBold", 64), 110, W, TEXTO)
    centrado(d, sub, fuente("inter", "500Medium", 36), 200, W, color)
    return im


def tel(carpeta: Path, nombre: str, ancho: int, giro: float = 0):
    t = telefono(Image.open(carpeta / f"{nombre}.png").convert("RGB"), ancho)
    return t.rotate(giro, resample=Image.BICUBIC, expand=True) if giro else t


def poner(im, t, cx: int, y: int):
    """Pone el telefono centrado en cx, con su borde de arriba en y"""
    im.alpha_composite(t, (cx - t.width // 2, y - 60))


def uno(carpeta, nombre, titulo, sub, ancho=640):
    im = lienzo(titulo, sub)
    poner(im, tel(carpeta, nombre, ancho), W // 2, 330)
    return im


def dos(carpeta, izq, der, titulo, sub, ancho=530):
    """Dos pantallas grandes: la de la derecha mas abajo y adelante, y se
    salen un poco por abajo (se ven cerca, como en las fichas de diseno)"""
    im = lienzo(titulo, sub)
    poner(im, tel(carpeta, izq, ancho), 292, 330)
    poner(im, tel(carpeta, der, ancho), 788, 500)
    return im


def colores(carpeta):
    """La app a tu preferencia: modo claro al centro y dos colores a los
    lados (todo el diseno cambia), con los colores y el claro/oscuro"""
    im = lienzo("La app a tu preferencia", "modo claro u oscuro y el color que quieras")
    poner(im, tel(carpeta, "anuncios-azul", 470, 8), 255, 470)
    poner(im, tel(carpeta, "anuncios-verde", 470, -8), 825, 470)
    poner(im, tel(carpeta, "anuncios-claro", 570), W // 2, 360)
    d = ImageDraw.Draw(im)
    r, sep, y = 24, 26, 292
    # los colores, un espacio, y los dos modos (claro y oscuro)
    puntos = [(c, None) for c in COLORES.values()] + [None] + [
        ((246, 244, 240), None),
        ((18, 18, 18), (120, 120, 120)),
    ]
    anchos = [2 * r if p else sep for p in puntos]
    x = (W - (sum(anchos) + sep * (len(puntos) - 1))) // 2
    for p, a in zip(puntos, anchos):
        if p:
            relleno, borde = p
            d.ellipse((x, y - r, x + 2 * r, y + r), fill=relleno, outline=borde, width=3)
        x += a + sep
    return im


def guardar(im: Image.Image, n: int, nombre: str):
    LISTAS.mkdir(parents=True, exist_ok=True)
    salida = LISTAS / f"{n:02d}-{nombre}.png"
    im.convert("RGB").save(salida, optimize=True)
    print("listo:", salida.name)


if __name__ == "__main__":
    c = Path(sys.argv[1])
    guardar(uno(c, "anuncios-rojo", "Todo lo de tu iglesia", "anuncios, cultos y eventos en un lugar"), 1, "anuncios")
    guardar(colores(c), 2, "colores")
    guardar(dos(c, "cronograma", "perfil", "Horarios y turnos", "cada hermano sabe cuándo le toca servir"), 3, "turnos")
    guardar(dos(c, "nueva-sala-tipos", "comunidad", "Una sala para cada grupo", "jóvenes, mujeres, niños, alabanza…"), 4, "salas")
    guardar(dos(c, "sala-jovenes", "oracion", "Decidan juntos y oren", "encuentros con «Voy» y muro de oración"), 5, "encuentros")
    guardar(dos(c, "biblia", "para-ti", "La Biblia en tu bolsillo", "resalta, guarda y descubre versículos"), 6, "biblia")
    guardar(dos(c, "memorizar-2", "memorizar-fin", "Aprende versículos jugando", "completa, ordena y gana estrellas"), 7, "memorizar")
    guardar(dos(c, "editar-perfil", "perfil", "Tu perfil, a tu manera", "tu foto, tu portada o tu avatar"), 8, "perfil")
