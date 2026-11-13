import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
  RADIO_BORDE,
} from "@/constants/constans";
import { guardarPerfil, RolIglesia, useEstudios } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

const ROLES: {
  id: RolIglesia;
  titulo: string;
  texto: string;
  puede: string[];
  icono: IconName;
}[] = [
  {
    id: "hermano",
    titulo: "Hermano/a de la iglesia",
    texto:
      "Para todos los miembros de la congregación. Es la opción correcta para la mayoría.",
    puede: [
      "Leer la Biblia, orar y unirte a tu grupo",
      "Ver el cronograma, tus turnos y los anuncios",
      "Participar en las salas de tu iglesia",
    ],
    icono: "person",
  },
  {
    id: "pastor",
    titulo: "Pastor",
    texto:
      "Solo para quien dirige la iglesia. Tiene control sobre la congregación.",
    puede: [
      "Asignar roles y permisos a cada hermano",
      "Crear y editar el cronograma y los turnos",
      "Publicar anuncios y administrar las salas",
    ],
    icono: "shield-check",
  },
];

// "¿Quién eres en la iglesia?": el pastor administra casi toda la app
export default function PasoRol({ onSeguir }: { onSeguir: () => void }) {
  const [rol, setRol] = useState<RolIglesia | undefined>(useEstudios().rol);

  return (
    <Paso
      pie={
        <BotonPrincipal
          texto="Continuar"
          deshabilitado={!rol}
          onPress={() => {
            guardarPerfil({ rol });
            onSeguir();
          }}
        />
      }
    >
      <Titulo texto="¿Quién eres en la " destacado="iglesia?" />
      <Subtitulo>Así te mostramos lo que necesitas.</Subtitulo>

      <View style={styles.lista}>
        {ROLES.map((r) => {
          const activo = r.id === rol;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRol(r.id)}
              style={({ pressed }) => [
                styles.tarjeta,
                activo && styles.tarjetaActiva,
                pressed && styles.presionado,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <View style={styles.arriba}>
                <View style={[styles.icono, activo && styles.iconoActivo]}>
                  <Octicons
                    name={r.icono}
                    size={22}
                    color={activo ? "#FFFFFF" : TEXT}
                  />
                </View>
                <View style={[styles.radio, activo && styles.radioActivo]}>
                  {activo && <View style={styles.radioPunto} />}
                </View>
              </View>
              <Text style={styles.titulo}>{r.titulo}</Text>
              <Text style={styles.texto}>{r.texto}</Text>
              <View style={styles.puede}>
                {r.puede.map((p) => (
                  <View key={p} style={styles.puedeFila}>
                    <Octicons
                      name="check"
                      size={13}
                      color={activo ? PRIMARY : MUTED}
                    />
                    <Text style={styles.puedeTexto}>{p}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {rol === "pastor" ? (
        <View style={styles.aviso}>
          <Octicons name="alert" size={16} color={AVISO} />
          <Text style={styles.avisoTexto}>
            <Text style={styles.avisoFuerte}>Elige “Pastor” solo si diriges
            la iglesia.</Text>{" "}
            Esta elección no se puede cambiar después: tendrías que
            reinstalar la app y comenzar de nuevo. Si eres miembro, ayudas en el ministerio o eres líder de un grupo,
            elige “Hermano/a”: el pastor puede darte permisos (editar el
            cronograma, publicar anuncios…) desde su Perfil.
          </Text>
        </View>
      ) : (
        <Text style={styles.nota}>
          Elige con cuidado: el rol no se puede cambiar después. ¿Tienes
          alguna responsabilidad? Elige “Hermano/a”; tu pastor puede darte
          permisos extra más adelante.
        </Text>
      )}
    </Paso>
  );
}

const AVISO = "#E0A33A";
const RADIO_BORDE_AVISO = 16;

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.7,
  },
  lista: {
    gap: SPACING * 1.2,
    marginTop: SPACING * 1.6,
  },
  tarjeta: {
    gap: SPACING,
    padding: SPACING * 1.8,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tarjetaActiva: {
    borderColor: PRIMARY,
    backgroundColor: primarioAlfa(0.08),
  },
  arriba: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING / 2,
  },
  icono: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  iconoActivo: {
    backgroundColor: PRIMARY,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: RADIO_BORDE,
  },
  radioActivo: {
    borderColor: TEXT,
  },
  radioPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TEXT,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 17,
    color: TEXT,
  },
  texto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  puede: {
    gap: SPACING / 1.6,
    marginTop: SPACING / 2,
  },
  puedeFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 0.8,
  },
  puedeTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
  aviso: {
    flexDirection: "row",
    gap: SPACING,
    marginTop: SPACING * 1.4,
    padding: SPACING * 1.4,
    borderRadius: RADIO_BORDE_AVISO,
    borderWidth: 1,
    borderColor: "rgba(224,163,58,0.45)",
    backgroundColor: "rgba(224,163,58,0.10)",
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT,
  },
  avisoFuerte: {
    fontFamily: FUENTE.semibold,
  },
  nota: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    textAlign: "center",
    marginTop: SPACING,
  },
});
