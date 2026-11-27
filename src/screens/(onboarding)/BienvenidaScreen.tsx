import {
  BORDER,
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { extraerCodigo } from "@/services/iglesias";
import {
  guardarInvitacion,
  RolIglesia,
  useEstudios,
  verBienvenida,
} from "@/store/estudios";
import { codigoVisible } from "@/utils/invitacion";
import * as Application from "expo-application";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Text,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import PasoCargando from "./pasos/PasoCargando";
import PasoCuenta from "./pasos/PasoCuenta";
import PasoFunciones from "./pasos/PasoFunciones";
import PasoGrupo from "./pasos/PasoGrupo";
import PasoGuiaPastor from "./pasos/PasoGuiaPastor";
import PasoHistorias from "./pasos/PasoHistorias";
import PasoHorarios from "./pasos/PasoHorarios";
import PasoIglesia from "./pasos/PasoIglesia";
import PasoMotivos from "./pasos/PasoMotivos";
import PasoNombre from "./pasos/PasoNombre";
import PasoRol from "./pasos/PasoRol";
import PasoVersiones from "./pasos/PasoVersiones";

// Orden del onboarding: bienvenida (historias), conocer a la persona y
// presentar la app, al final crear la cuenta (la carga va aparte, despues).
// Despues de elegir el rol cambia un paso: el pastor ubica su iglesia y el
// hermano se une con la invitacion
const pasosPara = (rol?: RolIglesia) => {
  const pastor = rol === "pastor";
  return [
    PasoHistorias,
    PasoNombre,
    PasoRol,
    // el pastor: sus iglesias y despues los dias y horarios de culto
    ...(pastor ? [PasoIglesia, PasoHorarios] : []),
    // "¿Qué te trae aquí?" no aplica al pastor
    ...(pastor ? [] : [PasoMotivos]),
    PasoFunciones,
    // el pastor recibe una guia detallada de como administrar
    ...(pastor ? [PasoGuiaPastor] : []),
    PasoVersiones,
    ...(pastor ? [] : [PasoGrupo]),
    PasoCuenta,
  ];
};

// al terminar, el layout raiz lleva a la app
const terminar = () => verBienvenida(true);

// Entrada de un paso: aparece y se corre un poco desde el lado
const SUAVE = { duration: 320, easing: Easing.out(Easing.cubic) };
const entrada = (desde: number) => () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateX: desde }] },
    animations: {
      opacity: withTiming(1, SUAVE),
      transform: [{ translateX: withTiming(0, SUAVE) }],
    },
  };
};
const entraDerecha = entrada(40); // al avanzar
const entraIzquierda = entrada(-40); // al volver

// Onboarding por pasos (solo la primera vez): crear cuenta, conocer a la
// persona, presentar la app y entrar a su grupo
export default function BienvenidaScreen() {
  const { nombre, rol, invitacion } = useEstudios(
    "nombre",
    "rol",
    "invitacion",
  );

  // Instalo la app desde la invitacion (Google Play): el codigo viene en el
  // "referrer" de la instalacion. Se guarda para el paso "Unete a tu iglesia"
  useEffect(() => {
    if (Platform.OS !== "android" || invitacion) return;
    Application.getInstallReferrerAsync()
      .then((ref) => {
        const codigo = extraerCodigo(decodeURIComponent(ref ?? ""));
        if (codigo) guardarInvitacion(codigo);
      })
      .catch(() => {});
    // solo al abrir el onboarding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const PASOS = pasosPara(rol);
  const [paso, setPaso] = useState(0);
  // hacia donde se mueve (para que el paso entre del lado correcto)
  const [avanza, setAvanza] = useState(true);
  // entro con una cuenta que ya tenia iglesia: salta directo a la carga
  const [yaTiene, setYaTiene] = useState(false);
  // entro con un Google que no tenia cuenta: se le cuenta en el paso 1
  const [cuentaNueva, setCuentaNueva] = useState<{ correo?: string } | null>(
    null,
  );
  const cargando = yaTiene || paso === PASOS.length;

  const ir = (nuevo: number) => {
    setAvanza(nuevo > paso);
    setPaso(nuevo);
  };

  // Boton "atras" del celular (Android): vuelve al paso anterior en vez de
  // cerrar la app. En el primer paso (las historias) si sale, como siempre
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (paso === 0 || paso >= PASOS.length) return false;
      setAvanza(false);
      setPaso(paso - 1);
      return true; // ya lo manejamos: no cierra la app
    });
    return () => sub.remove();
  }, [paso, PASOS.length]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.flex}>
          <PasoCargando nombre={nombre} onListo={terminar} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const PasoActual = PASOS[paso];

  // Bienvenida: historias a pantalla completa, tambien detras de la barra
  // de estado (traen sus propias barras y margenes)
  if (paso === 0) {
    return (
      <PasoHistorias
        onSeguir={() => ir(1)}
        onYaTiene={() => setYaTiene(true)}
        onCuentaNueva={(correo) => setCuentaNueva({ correo })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Arriba: volver + segmentos de progreso */}
        <View style={styles.arriba}>
          {/* desde el primer paso, volver lleva a las historias */}
          <Pressable
            onPress={() => ir(paso - 1)}
            hitSlop={10}
            style={styles.volver}
            accessibilityLabel="Paso anterior"
          >
            <Octicons name="arrow-left" size={18} color={TEXT} />
          </Pressable>
          {/* un segmento por pregunta (las historias no cuentan) */}
          <View style={styles.segmentos}>
            {PASOS.slice(1).map((_, i) => (
              <Segmento key={i} lleno={i + 1 <= paso} />
            ))}
          </View>
        </View>

        {/* Llego con una invitacion: sabe que al final se une solo */}
        {!!invitacion && !cuentaNueva && paso === 1 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.aviso}>
            <View style={styles.avisoIcono}>
              <Octicons name="people" size={16} color={PRIMARY} />
            </View>
            <View style={styles.flexTexto}>
              <Text style={styles.avisoTitulo}>Te invitaron a tu iglesia</Text>
              <Text style={styles.avisoTexto}>
                Tu código{" "}
                <Text style={styles.avisoCorreo}>
                  {codigoVisible(invitacion)}
                </Text>{" "}
                ya está guardado. Completa estos pasos y al final te unes con
                un toque. ¿Eres el pastor? Vuelve atrás y toca «Entra con
                Google» para abrir tu cuenta.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Cuenta de Google nueva: se le explica que pasa (en el primer paso) */}
        {cuentaNueva && paso === 1 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.aviso}>
            <View style={styles.avisoIcono}>
              <Octicons name="person-add" size={16} color={PRIMARY} />
            </View>
            <View style={styles.flexTexto}>
              <Text style={styles.avisoTitulo}>
                No encontramos una cuenta con este correo
              </Text>
              <Text style={styles.avisoTexto}>
                Creamos tu cuenta nueva
                {cuentaNueva.correo ? (
                  <Text style={styles.avisoCorreo}> {cuentaNueva.correo}</Text>
                ) : null}
                . Completa estos pasos para crear tu iglesia o unirte con una
                invitación.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Paso actual: entra deslizandose del lado al que se avanza */}
        <Animated.View
          key={paso}
          entering={avanza ? entraDerecha : entraIzquierda}
          style={styles.flex}
        >
          <PasoActual onSeguir={() => ir(paso + 1)} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Un tramo de la barra de progreso (se llena con animacion)
function Segmento({ lleno }: { lleno: boolean }) {
  const estilo = useAnimatedStyle(() => ({
    width: withTiming(lleno ? "100%" : "0%", { duration: 350 }),
  }));
  return (
    <View style={styles.segmento}>
      <Animated.View style={[styles.segmentoLleno, estilo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
    // web: "hidden" igual se puede desplazar (el navegador lo corre para
    // mostrar el campo con foco mientras el paso entra de lado) y todo
    // queda pegado a la izquierda. "clip" recorta sin dejar desplazarse
    overflow: (Platform.OS === "web" ? "clip" : "hidden") as "hidden",
  },
  aviso: {
    flexDirection: "row",
    gap: SPACING * 1.2,
    marginHorizontal: PADDING,
    marginTop: SPACING * 1.6,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: primarioAlfa(0.12),
    borderWidth: 1,
    borderColor: primarioAlfa(0.35),
  },
  avisoIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.18),
  },
  flexTexto: {
    flex: 1,
    gap: 3,
  },
  avisoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  avisoTexto: {
    fontFamily: FUENTE.regular,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  avisoCorreo: {
    fontFamily: FUENTE.semibold,
    color: TEXT,
  },
  arriba: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
  },
  volver: {
    width: 24,
  },
  segmentos: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  segmentoLleno: {
    height: 4,
    borderRadius: 2,
    backgroundColor: TEXT,
  },
});
