import {
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
  LINEA,
} from "@/constants/constans";
import { Unido, useUnirse } from "@/hooks/useUnirse";
import { useVerificarCodigo } from "@/hooks/useVerificarCodigo";
import { extraerCodigo } from "@/services/iglesias";
import {
  guardarInvitacion,
  useCargado,
  useEsPastor,
  useEstudios,
  useIglesia,
  useIglesias,
} from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Se abre con el enlace del pastor (https://congrega.expo.app/unirse?codigo=4K7Q).
// No se une sola: deja el codigo escrito y la persona toca "Unirme a mi
// iglesia". Si aun no hace el onboarding, el codigo queda listo en el paso
// "Unete a tu iglesia"; si ya lo hizo, se muestra aqui con el boton
export default function UnirseScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const cargado = useCargado();
  const { bienvenida } = useEstudios("bienvenida");
  const limpio = extraerCodigo(codigo ?? "");

  // esperar lo guardado en el telefono (si no, parece que no hizo el onboarding)
  if (!cargado) return <Cargando />;
  if (!bienvenida) {
    return (
      <>
        {limpio && <GuardarInvitacion codigo={limpio} />}
        <Redirect href={"/bienvenida" as Href} />
      </>
    );
  }
  return <Invitacion codigo={limpio} />;
}

// guarda el codigo para el paso "Unete a tu iglesia" (antes de redirigir)
function GuardarInvitacion({ codigo }: { codigo: string }) {
  useEffect(() => {
    guardarInvitacion(codigo);
  }, [codigo]);
  return null;
}

function Cargando({ texto }: { texto?: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centro}>
        <ActivityIndicator color={MUTED} />
        {!!texto && <Text style={styles.texto}>{texto}</Text>}
      </View>
    </SafeAreaView>
  );
}

// Ya usa la app: muestra a que iglesia lo invitan y se une al tocar el boton
function Invitacion({ codigo }: { codigo: string | null }) {
  const unirse = useUnirse();
  const iglesia = useIglesia();
  const revision = useVerificarCodigo(codigo ?? "");
  const [uniendo, setUniendo] = useState(false);
  // el pastor abrio el enlace que el mismo compartio (de una de sus iglesias)
  const esPastor = useEsPastor();
  const { codigos } = useEstudios("codigos");
  const misIglesias = useIglesias();
  const esMio =
    esPastor &&
    !!codigo &&
    (Object.values(codigos).some((c) => c?.codigo === codigo) ||
      (revision.estado === "valido" &&
        misIglesias.some(
          (i) =>
            i.sede.trim().toLowerCase() ===
            revision.iglesia?.trim().toLowerCase(),
        )));
  // undefined = aun no se une; null = no se pudo
  const [unido, setUnido] = useState<Unido | null>();

  const unirme = async () => {
    if (!codigo || uniendo) return;
    setUniendo(true);
    const r = await unirse(codigo);
    setUniendo(false);
    setUnido(r);
  };

  if (codigo && revision.estado === "revisando" && unido === undefined) {
    return <Cargando texto="Revisando la invitación…" />;
  }

  if (esMio) return <EnlacePropio codigo={codigo} />;

  const invalido = !codigo || revision.estado === "invalido" || unido === null;
  const listo = !!unido;
  const sala =
    unido?.sala ?? (revision.estado === "valido" ? revision.sala : undefined);
  const nombre =
    unido?.iglesia ??
    (revision.estado === "valido" ? revision.iglesia : undefined);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centro}>
        <View style={[styles.icono, invalido && styles.iconoError]}>
          <Octicons
            name={invalido ? "x" : listo ? "check" : "mail"}
            size={28}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.titulo}>
          {invalido
            ? "Código no válido"
            : listo
              ? "¡Bienvenido!"
              : "Te invitaron"}
        </Text>
        <Text style={styles.texto}>
          {invalido
            ? "Este enlace ya no sirve o está incompleto. Pídele uno nuevo a tu pastor."
            : listo
              ? `Te uniste a ${nombre ?? iglesia?.sede ?? "tu iglesia"}${
                  sala ? ` y a la sala de ${sala}` : ""
                }.`
              : `Únete a ${nombre ?? "tu iglesia"}${
                  sala ? ` (sala ${sala})` : ""
                } con el código ${codigo}.`}
        </Text>
        {!invalido && !listo && (
          <Pressable
            onPress={unirme}
            disabled={uniendo}
            style={({ pressed }) => [
              styles.boton,
              (pressed || uniendo) && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>
              {uniendo ? "Uniéndote…" : "Unirme a mi iglesia"}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.replace("/" as Href)}
          hitSlop={8}
          style={({ pressed }) => [
            listo || invalido ? styles.boton : styles.secundario,
            pressed && styles.presionado,
          ]}
        >
          <Text
            style={
              listo || invalido ? styles.botonTexto : styles.secundarioTexto
            }
          >
            {listo || invalido ? "Ir al inicio" : "Ahora no"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// El pastor abrio su propio enlace: es el que comparte con los hermanos
// (no se une como hermano ni cambia nada de su cuenta)
function EnlacePropio({ codigo }: { codigo: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centro}>
        <View style={styles.icono}>
          <Octicons name="link" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.titulo}>Es tu invitación</Text>
        <Text style={styles.texto}>
          Este es el enlace de tu iglesia (código {codigo}). Compártelo con los
          hermanos para que se unan. Tú ya eres el pastor: no tienes que hacer
          nada.
        </Text>
        <Pressable
          onPress={() => router.replace("/" as Href)}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Text style={styles.botonTexto}>Ir al inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 3,
  },
  icono: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    marginBottom: SPACING,
  },
  iconoError: {
    backgroundColor: LINEA,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    color: TEXT,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    textAlign: "center",
  },
  boton: {
    marginTop: SPACING * 1.6,
    paddingHorizontal: SPACING * 3,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.7,
  },
  secundario: {
    paddingVertical: SPACING,
  },
  secundarioTexto: {
    fontSize: 14,
    color: MUTED,
  },
});
