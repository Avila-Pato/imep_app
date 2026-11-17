import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  TEXT,
} from "@/constants/constans";
import HojaCompartir from "@/screens/perfil/HojaCompartir";
import { generarCodigo, useEsPastor, useEstudios } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { codigoVisible, mensajeInvitacion } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// En "Editar sala" (solo el pastor): el codigo para invitar a ESTA sala y
// el boton para compartirlo (la misma tarjeta e invitacion que en el Panel).
// Si aun no tiene codigo, se crea aqui mismo
export default function CodigoDeSala({ sala }: { sala: Grupo }) {
  const esPastor = useEsPastor();
  const { codigos, iglesia } = useEstudios();
  const [compartiendo, setCompartiendo] = useState(false);
  if (!esPastor || sala.id === "general") return null;
  const codigo = codigos[sala.id]?.codigo;
  const usos = codigos[sala.id]?.usos ?? 0;
  const sede = iglesia?.sede ?? "nuestra iglesia";

  return (
    <View style={styles.caja}>
      <View style={styles.flex}>
        <Text style={styles.etiqueta}>CÓDIGO DE LA SALA</Text>
        {codigo ? (
          <>
            <Text style={styles.codigo}>{codigoVisible(codigo)}</Text>
            <Text style={styles.meta}>
              {usos === 0
                ? "Nadie ha entrado con él aún"
                : `${usos} ${usos === 1 ? "persona entró" : "personas entraron"} con él`}
            </Text>
          </>
        ) : (
          <Text style={styles.meta}>
            Crea un código para invitar a los hermanos a esta sala
          </Text>
        )}
      </View>
      {codigo ? (
        <Pressable
          onPress={() => setCompartiendo(true)}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          accessibilityLabel={`Compartir el código de ${sala.label}`}
        >
          <Octicons name="share-android" size={14} color={DARK_BG} />
          <Text style={styles.botonTexto}>Compartir</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => generarCodigo(sala.id)}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Text style={styles.botonTexto}>Crear código</Text>
        </Pressable>
      )}
      {compartiendo && codigo && (
        <HojaCompartir
          codigo={codigo}
          mensaje={mensajeInvitacion(sede, codigo, sala.label)}
          titulo={`${sede} · sala ${sala.label}`}
          iglesia={sede}
          sala={sala.label}
          onCerrar={() => setCompartiendo(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    padding: SPACING * 1.25,
    marginTop: SPACING,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_BG,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: MUTED,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 24,
    letterSpacing: 4,
    color: TEXT,
    marginTop: 2,
  },
  meta: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.6,
  },
});
