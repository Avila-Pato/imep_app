import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import { TURNOS } from "@/assets/data/cronogramasMocks";
import {
  BORDER,
  DARK_BG,
  DIAS_SEMANA,
  HOME_PADDING as PADDING,
  MUTED,
  ROLES,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Turno } from "@/types/typesCronogramas";
import { horaCulto } from "@/utils/cultos";
import { useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const RESORTE = { damping: 22, stiffness: 220 };

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

// Solo la primera letra en mayuscula ("Octubre de 2026")
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "19:30" -> 1170 minutos
const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const hoy = new Date();
const HOY_KEY = toKey(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

// Dias del mes con huecos al inicio para que el 1 caiga en su dia (Lunes primero)
function diasDelMes(y: number, m: number) {
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  return [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
}

const deKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const aKey = (f: Date) => toKey(f.getFullYear(), f.getMonth(), f.getDate());
// Dias de culto segun la configuracion de la iglesia
const DIAS_CULTO = HORARIOS_CULTO.map((h) => h.dia);
const esCulto = (f: Date) => DIAS_CULTO.includes(f.getDay());

// Dia de culto mas cercano desde esa fecha (ella misma si ya es de culto)
function siguienteCulto(key: string) {
  const f = deKey(key);
  while (!esCulto(f)) f.setDate(f.getDate() + 1);
  return aKey(f);
}

// Dias entre hoy y esa fecha (negativo = ya paso)
const diasDesdeHoy = (key: string) =>
  Math.round((deKey(key).getTime() - deKey(HOY_KEY).getTime()) / 86400000);

// "Hoy" | "Mañana" | "En 3 días" | "Ayer" | "Hace 4 días"
function relativo(key: string) {
  const d = diasDesdeHoy(key);
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  if (d === -1) return "Ayer";
  return d > 0 ? `En ${d} días` : `Hace ${-d} días`;
}

const fechaLarga = (key: string) =>
  deKey(key).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// Dias de culto de la semana (lunes a domingo) que contiene esa fecha
function cultosDeLaSemana(key: string) {
  const f = deKey(key);
  const lunes = new Date(f);
  lunes.setDate(f.getDate() - ((f.getDay() + 6) % 7));
  return [...DIAS_CULTO]
    .map((d) => (d + 6) % 7) // posicion desde el lunes
    .sort((x, y) => x - y)
    .map((offset) => {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + offset);
      return {
        key: aKey(dia),
        nombre: capitalizar(
          dia.toLocaleDateString("es-ES", { weekday: "long" }),
        ),
        numero: dia.getDate(),
      };
    });
}

const LINEA_SEP = 22; // separacion entre lineas del fondo

// Fondo de celdas: lineas punteadas y una solida cada 4 (como cuartos de hora)
function FondoCeldas({ alto }: { alto: number }) {
  return (
    <View pointerEvents="none" style={[styles.fondo, { height: alto }]}>
      <View style={styles.fondoVertical} />
      {Array.from({ length: Math.ceil(alto / LINEA_SEP) }, (_, i) => (
        <View key={i} style={[styles.fondoLinea, { top: i * LINEA_SEP }]}>
          <View
            style={i % 4 === 0 ? styles.lineaSolida : styles.lineaPunteada}
          />
        </View>
      ))}
    </View>
  );
}

export default function CronogramaView() {
  const [mes, setMes] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() });
  const [seleccionado, setSeleccionado] = useState(() =>
    siguienteCulto(HOY_KEY),
  );

  const cambiarMes = (delta: number) => {
    const d = new Date(mes.y, mes.m + delta, 1);
    setMes({ y: d.getFullYear(), m: d.getMonth() });
  };

  const titulo = capitalizar(
    new Date(mes.y, mes.m, 1).toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    }),
  );

  const semana = cultosDeLaSemana(seleccionado);
  const diasSel = diasDesdeHoy(seleccionado);

  // Todos los turnos comienzan a la hora del culto (en el orden de los roles)
  const hora = horaCulto(seleccionado);
  const ordenRoles = Object.keys(ROLES);
  const turnosDia = TURNOS.filter((t) => t.fecha === seleccionado).sort(
    (a, b) => ordenRoles.indexOf(a.rol) - ordenRoles.indexOf(b.rol),
  );

  // Linea "Ahora" (solo hoy): antes del culto arriba, despues abajo
  const ahora = hoy.getHours() * 60 + hoy.getMinutes();
  const esHoy = seleccionado === HOY_KEY && turnosDia.length > 0;
  const yaComenzo = !!hora && ahora >= aMinutos(hora);

  // Panel desplegable: "abajo" = bajo el calendario, "arriba" = tope de la vista
  const [listo, setListo] = useState(false);
  const [altoLista, setAltoLista] = useState(0);
  const top = useSharedValue(0);
  const inicio = useSharedValue(0);
  const arriba = useSharedValue(0);
  const abajo = useSharedValue(0);

  const onFijoLayout = (e: LayoutChangeEvent) => {
    const alto = e.nativeEvent.layout.height;
    // si estaba abajo, lo acompaña cuando el calendario cambia de alto
    if (!listo || top.get() > arriba.get() + 1) {
      top.set(listo ? withSpring(alto, RESORTE) : alto);
    }
    abajo.set(alto);
    setListo(true);
  };

  const arrastre = Gesture.Pan()
    .onStart(() => {
      inicio.set(top.get());
    })
    .onUpdate((e) => {
      top.set(
        Math.min(
          abajo.get(),
          Math.max(arriba.get(), inicio.get() + e.translationY),
        ),
      );
    })
    .onEnd((e) => {
      const mitad = (arriba.get() + abajo.get()) / 2;
      const subir =
        e.velocityY < -500 || (e.velocityY <= 500 && top.get() < mitad);
      top.set(withSpring(subir ? arriba.get() : abajo.get(), RESORTE));
    });

  const alternarPanel = () => {
    const mitad = (arriba.get() + abajo.get()) / 2;
    top.set(
      withSpring(top.get() > mitad ? arriba.get() : abajo.get(), RESORTE),
    );
  };

  const panelStyle = useAnimatedStyle(() => ({ top: top.get() }));

  // la hora solo se escribe en el primero: todos comienzan juntos
  const filaTurno = (t: Turno, primero: boolean) => {
    const rol = ROLES[t.rol];
    return (
      <View style={styles.fila}>
        <View style={styles.horas}>
          {primero && (
            <>
              <Text style={styles.horaInicio}>{hora}</Text>
              <Text style={styles.horaFin}>hrs</Text>
            </>
          )}
        </View>
        <View style={styles.bloqueFondo}>
          <View style={styles.bloque}>
            <View style={styles.bloqueIcono}>
              <Octicons name={rol.icon} size={16} color={TEXT} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.bloqueRol}>{rol.label.toUpperCase()}</Text>
              <Text style={styles.bloquePersona} numberOfLines={1}>
                {t.persona}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const lineaAhora = (
    <View style={styles.ahora}>
      <Text style={styles.ahoraTexto}>
        {pad(hoy.getHours())}:{pad(hoy.getMinutes())}
      </Text>
      <View style={styles.ahoraPunto} />
      <View style={styles.ahoraLinea} />
    </View>
  );

  return (
    <View style={styles.safe}>
      {/* Parte fija */}
      <View style={styles.fijo} onLayout={onFijoLayout}>
        <View style={styles.calendario}>
          <View style={styles.mesFila}>
            <Text style={styles.mesTitulo}>{titulo}</Text>
            <View style={styles.flechas}>
              <Pressable
                onPress={() => cambiarMes(-1)}
                hitSlop={8}
                style={styles.flecha}
                accessibilityLabel="Mes anterior"
              >
                <Octicons name="chevron-left" size={16} color={TEXT} />
              </Pressable>
              <Pressable
                onPress={() => cambiarMes(1)}
                hitSlop={8}
                style={styles.flecha}
                accessibilityLabel="Mes siguiente"
              >
                <Octicons name="chevron-right" size={16} color={TEXT} />
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            {DIAS_SEMANA.map((d, i) => (
              <Text key={i} style={[styles.celda, styles.diaSemana]}>
                {d}
              </Text>
            ))}

            {diasDelMes(mes.y, mes.m).map((dia, i) => {
              if (dia === null)
                return <View key={`v${i}`} style={styles.celda} />;

              const key = toKey(mes.y, mes.m, dia);
              const activo = key === seleccionado;
              const esHoy = key === HOY_KEY;
              const tieneTurnos = TURNOS.some((t) => t.fecha === key);
              const culto = esCulto(new Date(mes.y, mes.m, dia));

              return (
                <Pressable
                  key={key}
                  style={styles.celda}
                  onPress={() => setSeleccionado(siguienteCulto(key))}
                >
                  <View
                    style={[
                      styles.dia,
                      esHoy && styles.diaHoy,
                      activo && styles.diaActivo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.diaTexto,
                        !culto && styles.diaTextoApagado,
                        activo && styles.diaTextoActivo,
                      ]}
                    >
                      {dia}
                    </Text>
                  </View>
                  <View style={styles.puntoZona}>
                    {esHoy && !activo ? (
                      <Text style={styles.hoyEtiqueta}>HOY</Text>
                    ) : (
                      <View
                        style={[
                          styles.punto,
                          tieneTurnos && !activo && styles.puntoVisible,
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Panel desplegable */}
      {listo && (
        <Animated.View style={[styles.panel, panelStyle]}>
          <GestureDetector gesture={arrastre}>
            <View style={styles.panelCabecera}>
              <Pressable
                onPress={alternarPanel}
                hitSlop={12}
                style={styles.asaZona}
                accessibilityLabel="Desplegar panel"
              >
                <View style={styles.asa} />
              </Pressable>

              {/* Dias de culto de la semana */}
              <View style={styles.tabs}>
                {semana.map((d) => {
                  const activo = d.key === seleccionado;
                  const dias = diasDesdeHoy(d.key);
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => setSeleccionado(d.key)}
                      style={styles.tab}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activo }}
                    >
                      <Text
                        style={[
                          styles.tabTexto,
                          dias < 0 && styles.tabPasado,
                          activo && styles.tabActivo,
                        ]}
                      >
                        {d.nombre} {d.numero}
                      </Text>
                      <Text
                        style={[
                          styles.tabRelativo,
                          dias === 0 && styles.tabRelativoHoy,
                        ]}
                      >
                        {dias < 0 ? "Ya pasó" : relativo(d.key)}
                      </Text>
                      <View
                        style={[
                          styles.tabLinea,
                          activo && styles.tabLineaActiva,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={(_, h) => setAltoLista(h)}
          >
            <FondoCeldas alto={altoLista} />

            {/* Que dia se esta viendo y que dia es hoy (evita confusiones) */}
            <View style={styles.estado}>
              <View
                style={[
                  styles.estadoChip,
                  diasSel === 0 && styles.estadoChipHoy,
                ]}
              >
                <Text
                  style={[
                    styles.estadoChipTexto,
                    diasSel === 0 && styles.estadoChipTextoHoy,
                  ]}
                >
                  {diasSel < 0
                    ? "YA PASÓ"
                    : relativo(seleccionado).toUpperCase()}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.estadoDia}>
                  {capitalizar(fechaLarga(seleccionado))}
                </Text>
                <Text style={styles.estadoHoy}>
                  {diasSel === 0
                    ? "Este culto es hoy"
                    : `Hoy es ${fechaLarga(HOY_KEY)}`}
                </Text>
              </View>
            </View>

            {turnosDia.length === 0 ? (
              <View style={styles.vacio}>
                <Octicons name="calendar" size={22} color={MUTED} />
                <Text style={styles.vacioTexto}>No hay turnos este día</Text>
              </View>
            ) : (
              <View style={styles.agenda}>
                {esHoy && !yaComenzo && lineaAhora}
                {turnosDia.map((t, i) => (
                  <View key={t.id}>{filaTurno(t, i === 0)}</View>
                ))}
                {esHoy && yaComenzo && lineaAhora}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const HORA_LABEL_W = 44;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  fijo: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: SPACING,
    gap: SPACING * 1.2,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING * 1.4,
    paddingBottom: 120, // espacio para el tabbar flotante
    gap: SPACING * 2,
  },

  // Estado del dia seleccionado
  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  estadoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MUTED,
  },
  estadoChipHoy: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  estadoChipTexto: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: TEXT,
  },
  estadoChipTextoHoy: {
    color: DARK_BG,
  },
  estadoDia: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  estadoHoy: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Panel
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  panelCabecera: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    paddingBottom: 0,
  },
  asaZona: {
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: SPACING * 2,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    marginBottom: 4,
  },
  fondo: {
    position: "absolute",
    top: 0,
    left: PADDING + HORA_LABEL_W + SPACING / 2,
    right: PADDING,
  },
  fondoVertical: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#3D3D3D",
  },
  fondoLinea: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    overflow: "hidden",
  },
  lineaSolida: {
    height: 1,
    backgroundColor: "#383838",
  },
  // truco: borde punteado completo recortado a 1px (iOS no dibuja un solo lado)
  lineaPunteada: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#3A3A3A",
  },

  // Calendario
  calendario: {
    padding: SPACING * 1.2,
    borderRadius: 20,
    backgroundColor: SURFACE,
    gap: 6,
  },
  mesFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  mesTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
  flechas: {
    flexDirection: "row",
    gap: SPACING,
  },
  flecha: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  celda: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 1,
  },
  diaSemana: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    paddingBottom: 4,
  },
  dia: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  diaHoy: {
    borderWidth: 1.5,
    borderColor: MUTED,
  },
  diaActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  diaTexto: {
    fontSize: 13,
    color: TEXT,
  },
  diaTextoApagado: {
    color: "#4A4A4A",
  },
  diaTextoActivo: {
    fontWeight: "700",
    color: DARK_BG,
  },
  puntoZona: {
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  punto: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  hoyEtiqueta: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: TEXT,
  },
  puntoVisible: {
    backgroundColor: MUTED,
  },

  // Tabs de dias de culto
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 4,
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
  tabPasado: {
    color: "#5A5A5A",
  },
  tabRelativo: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    paddingBottom: SPACING,
  },
  tabRelativoHoy: {
    color: TEXT,
    fontWeight: "700",
  },
  tabActivo: {
    fontWeight: "700",
    color: TEXT,
  },
  tabLinea: {
    alignSelf: "stretch",
    marginHorizontal: SPACING,
    height: 2,
    borderRadius: 1,
  },
  tabLineaActiva: {
    backgroundColor: TEXT,
  },

  // Agenda
  agenda: {
    gap: SPACING,
  },
  fila: {
    flexDirection: "row",
    gap: SPACING,
  },
  horas: {
    width: HORA_LABEL_W,
    paddingTop: SPACING,
  },
  horaInicio: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  horaFin: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  bloqueFondo: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: SURFACE,
  },
  bloque: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#333333",
  },
  bloqueIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
  },
  bloqueRol: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },
  bloquePersona: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
    marginTop: 2,
  },
  ahora: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING,
  },
  ahoraTexto: {
    width: HORA_LABEL_W + SPACING - 4,
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
  },
  ahoraPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEXT,
  },
  ahoraLinea: {
    flex: 1,
    height: 1.5,
    backgroundColor: TEXT,
  },

  vacio: {
    backgroundColor: SURFACE,
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
  },
});
