import {
  BIBLIA_VERSION,
  BORDER,
  COLORES_RESALTADO,
  DARK_BG,
  FUENTE,
  LIBROS_BIBLIA,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Verso } from "@/services/biblia";
import { guardarVersiculo, resaltar, useEstudios } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import ModalOracion from "./ModalOracion";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type SeleccionBiblia = {
  libro: number;
  capitulo: number;
  versos: Verso[]; // ordenados por numero
};

// Clave de un versiculo para los resaltados: "libro-capitulo-verso"
export const claveVerso = (libro: number, capitulo: number, verso: number) =>
  `${libro}-${capitulo}-${verso}`;

// "Génesis 1:3" | "Génesis 1:3-5" (seguidos) | "Génesis 1:3, 7"
export function citaDe({ libro, capitulo, versos }: SeleccionBiblia) {
  const nums = versos.map((v) => v.numero);
  const seguidos = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  const versiculos =
    nums.length === 1
      ? `${nums[0]}`
      : seguidos
        ? `${nums[0]}-${nums[nums.length - 1]}`
        : nums.join(", ");
  return `${LIBROS_BIBLIA[libro - 1]} ${capitulo}:${versiculos}`;
}

type Props = {
  seleccion: SeleccionBiblia;
  onListo: () => void; // limpia la seleccion
};

// Barra que aparece al tocar versiculos: resaltar, guardar, copiar, compartir, orar
export default function AccionesVersiculo({ seleccion, onListo }: Props) {
  const { resaltados } = useEstudios();
  // aviso corto en lugar de la cita (la barra no se cierra)
  const [aviso, setAviso] = useState<string | null>(null);
  const avisar = setAviso;
  // el aviso se va solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2000);
    return () => clearTimeout(t);
  }, [aviso]);
  const [orando, setOrando] = useState(false);
  const [paleta, setPaleta] = useState(false); // todos los colores abiertos

  const cita = citaDe(seleccion);
  const texto = seleccion.versos.map((v) => v.texto).join(" ");
  const mensaje = `«${texto}»\n— ${cita} (${BIBLIA_VERSION})`;
  const claves = seleccion.versos.map((v) =>
    claveVerso(seleccion.libro, seleccion.capitulo, v.numero),
  );
  // color actual (si todos tienen el mismo)
  const colorActual = claves.every(
    (k) => resaltados[k] === resaltados[claves[0]],
  )
    ? resaltados[claves[0]]
    : undefined;
  // En la barra van 3 colores (el activo primero) y el resto en "más"
  const visibles = (
    colorActual
      ? [colorActual, ...COLORES_RESALTADO.filter((c) => c !== colorActual)]
      : COLORES_RESALTADO
  ).slice(0, 3);
  const elegirColor = (c: string) => {
    resaltar(claves, c === colorActual ? null : c);
    setPaleta(false);
  };

  const acciones: {
    id: string;
    label: string;
    icono: "bookmark" | "copy" | "share-android" | "heart";
    onPress: () => void;
  }[] = [
    {
      id: "guardar",
      label: "Guardar",
      icono: "bookmark",
      onPress: () => {
        guardarVersiculo({
          id: claves.join("_"),
          cita,
          texto,
          fecha: new Date().toISOString(),
        });
        avisar("Guardado en tu perfil");
      },
    },
    {
      id: "copiar",
      label: "Copiar",
      icono: "copy",
      onPress: async () => {
        // el telefono ya avisa que se copio
        await Clipboard.setStringAsync(mensaje);
      },
    },
    {
      id: "compartir",
      label: "Compartir",
      icono: "share-android",
      onPress: () => {
        Share.share({ message: mensaje }).catch(() => {});
      },
    },
    {
      id: "orar",
      label: "Orar",
      icono: "heart",
      onPress: () => setOrando(true),
    },
  ];

  return (
    <View style={styles.barra}>
      {/* Todos los colores: se abre hacia arriba desde "más" */}
      {paleta && (
        <View style={styles.paleta}>
          {COLORES_RESALTADO.map((c) => {
            const activo = c === colorActual;
            return (
              <Pressable
                key={c}
                onPress={() => elegirColor(c)}
                style={[styles.color, { backgroundColor: c }]}
                accessibilityLabel={activo ? "Quitar resaltado" : "Resaltar"}
              >
                {activo && <Octicons name="x" size={16} color={DARK_BG} />}
              </Pressable>
            );
          })}
          {/* cerrar la paleta */}
          <Pressable
            onPress={() => setPaleta(false)}
            style={[styles.color, styles.cerrarPaleta]}
            accessibilityLabel="Cerrar colores"
          >
            <Octicons name="x" size={16} color={TEXT} />
          </Pressable>
        </View>
      )}

      {/* asa: tocarla cierra el panel */}
      <Pressable
        onPress={onListo}
        hitSlop={12}
        style={styles.asaZona}
        accessibilityLabel="Cerrar"
      >
        <View style={styles.asa} />
      </Pressable>
      <Text style={styles.cita} numberOfLines={1}>
        {aviso ?? cita}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
      >
        {/* Colores para resaltar (el activo muestra una X para quitarlo) */}
        <View style={styles.colores}>
          {visibles.map((c) => {
            const activo = c === colorActual;
            return (
              <Pressable
                key={c}
                onPress={() => elegirColor(c)}
                style={[styles.color, { backgroundColor: c }]}
                accessibilityLabel={activo ? "Quitar resaltado" : "Resaltar"}
              >
                {activo && <Octicons name="x" size={16} color={DARK_BG} />}
              </Pressable>
            );
          })}
          {/* "más": tres circulitos superpuestos */}
          <Pressable
            onPress={() => setPaleta((p) => !p)}
            hitSlop={6}
            style={styles.mas}
            accessibilityLabel="Más colores"
          >
            {COLORES_RESALTADO.slice(4, 7).map((c, i) => (
              <View
                key={c}
                style={[
                  styles.masPunto,
                  { backgroundColor: c, marginLeft: i ? -6 : 0 },
                ]}
              />
            ))}
          </Pressable>
        </View>

        {acciones.map((a) => (
          <Pressable
            key={a.id}
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.accion,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name={a.icono} size={18} color={TEXT} />
            <Text style={styles.accionTexto}>{a.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Orar con el versiculo: guardar en el perfil o compartir */}
      <ModalOracion
        visible={orando}
        cita={cita}
        texto={texto}
        onCerrar={() => setOrando(false)}
        onGuardar={(oracion) => {
          guardarVersiculo({
            id: `${claves.join("_")}-oracion`,
            cita,
            texto,
            oracion,
            fecha: new Date().toISOString(),
          });
          setOrando(false);
          avisar("Oración guardada en tu perfil");
        }}
        onCompartir={(oracion) => {
          Share.share({
            message: `${mensaje}\n\n🙏 ${oracion}`,
          }).catch(() => {});
          setOrando(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Panel de abajo, de lado a lado (como en la app de la Biblia)
  barra: {
    gap: SPACING,
    paddingTop: 6,
    paddingBottom: SPACING * 1.4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: DARK_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  asaZona: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  asa: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: TEXT,
  },
  cita: {
    textAlign: "center",
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
    paddingHorizontal: SPACING * 2,
  },
  fila: {
    gap: 8,
    paddingHorizontal: SPACING * 1.6,
    alignItems: "stretch",
  },
  colores: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  mas: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  masPunto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: SURFACE,
  },
  // panel con todos los colores, flota sobre la barra
  paleta: {
    position: "absolute",
    bottom: "100%",
    left: SPACING * 1.6,
    right: SPACING * 1.6,
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    padding: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cerrarPaleta: {
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  accion: {
    width: 70,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  accionTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: TEXT,
  },
  presionado: {
    opacity: 0.6,
  },
});
