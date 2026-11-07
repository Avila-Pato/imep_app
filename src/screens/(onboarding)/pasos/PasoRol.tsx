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
  icono: IconName;
}[] = [
  {
    id: "hermano",
    titulo: "Hermano/a de la iglesia",
    texto:
      "Lee la Biblia, ora con tu grupo, revisa tus turnos y entérate de todo.",
    icono: "person",
  },
  {
    id: "pastor",
    titulo: "Pastor",
    texto:
      "Administra la iglesia: los roles de cada persona, los turnos, los anuncios y las salas.",
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
            </Pressable>
          );
        })}
      </View>

      {rol === "pastor" && (
        <Text style={styles.nota}>
          Como pastor podrás asignar roles y dar permisos a otros hermanos
          (editar el cronograma, publicar anuncios…) desde tu Perfil.
        </Text>
      )}
    </Paso>
  );
}

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
  nota: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    textAlign: "center",
    marginTop: SPACING,
  },
});
