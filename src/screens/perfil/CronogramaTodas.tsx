import AvatarPersona from "@/components/AvatarPersona";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  ROL_GENERICO,
  ROLES,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { bajarTurnos } from "@/services/contenido";
import { esUuid } from "@/services/iglesias";
import { useAvatarDe, useCronogramasDeTodas } from "@/store/estudios";
import { Turno } from "@/types/typesCronogramas";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DIAS_A_MOSTRAR = 14;

const aKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Culto = {
  fecha: string; // "YYYY-MM-DD"
  dia: Date;
  hora: string;
  nombre?: string;
  iglesia: Iglesia;
  roles: { id: string; label: string; persona?: string }[];
};

// Resumen del pastor: los cultos de los proximos 14 dias de TODAS sus
// iglesias, por dia, con quien sirve en cada rol. Tocar una iglesia la abre
// en el cronograma para editar
export default function CronogramaTodas({
  onAbrir,
}: {
  onAbrir: (iglesia: Iglesia) => void;
}) {
  const todas = useCronogramasDeTodas();
  const avatarDe = useAvatarDe();
  // lo del servidor (al dia) por iglesia; mientras llega, lo del telefono
  const [remotos, setRemotos] = useState<
    Record<string, Record<string, Turno[]>>
  >({});
  const [cargando, setCargando] = useState(true);
  const ids = todas.map((t) => t.iglesia.id).join(",");

  useEffect(() => {
    let vivo = true;
    const hoy = aKey(new Date());
    Promise.all(
      ids
        .split(",")
        .filter(esUuid)
        .map((id) =>
          bajarTurnos(id, hoy)
            .then((r) => [id, r] as const)
            .catch(() => [id, null] as const),
        ),
    ).then((pares) => {
      if (!vivo) return;
      const r: Record<string, Record<string, Turno[]>> = {};
      for (const [id, porDia] of pares) if (porDia) r[id] = porDia;
      setRemotos(r);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [ids]);

  // arma los cultos de los proximos dias de cada iglesia (segun SUS horarios)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cultos: Culto[] = [];
  for (const { iglesia, turnos, rolesExtra } of todas) {
    const porDia = (iglesia.id && remotos[iglesia.id]) || turnos;
    const listaRoles = [
      ...Object.keys(rolesExtra).reverse(),
      ...Object.keys(ROLES),
    ];
    const nombreRol = (id: string) =>
      (rolesExtra[id] ?? ROLES[id as keyof typeof ROLES] ?? ROL_GENERICO).label;
    for (let k = 0; k < DIAS_A_MOSTRAR; k++) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() + k);
      const fecha = aKey(dia);
      for (const h of iglesia.horarios ?? []) {
        if (h.dia !== dia.getDay()) continue;
        const delDia = porDia[fecha] ?? [];
        cultos.push({
          fecha,
          dia,
          hora: h.hora,
          nombre: h.nombre,
          iglesia,
          roles: listaRoles.map((id) => ({
            id,
            label: nombreRol(id),
            persona: delDia
              .find((t) => t.rol === id && t.persona.trim())
              ?.persona.trim(),
          })),
        });
      }
    }
  }
  cultos.sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
  );

  // una seccion por iglesia (en el orden en que las tiene), cada una con
  // sus cultos de las proximas 2 semanas
  const secciones = todas
    .filter((t) => t.iglesia.horarios?.length)
    .map((t) => ({
      iglesia: t.iglesia,
      cultos: cultos.filter((c) => c.iglesia === t.iglesia),
    }));

  const sinHorarios = todas.filter((t) => !t.iglesia.horarios?.length);

  return (
    <ScrollView
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Próximas 2 semanas</Text>
        {cargando && <ActivityIndicator size="small" color={MUTED} />}
      </View>
      <Text style={styles.ayuda}>
        Quién sirve en cada culto, iglesia por iglesia.
      </Text>

      {secciones.map(({ iglesia, cultos: lista }) => {
        const asignadosTotal = lista.reduce(
          (n, c) => n + c.roles.filter((r) => r.persona).length,
          0,
        );
        return (
          <View key={iglesia.id} style={styles.seccion}>
            {/* la iglesia: bien separada de la otra */}
            <View style={styles.seccionCabecera}>
              <View style={styles.seccionIcono}>
                {iglesia.logo ? (
                  <Image
                    source={{ uri: iglesia.logo }}
                    style={styles.seccionLogo}
                    contentFit="cover"
                  />
                ) : (
                  <Octicons name="home-fill" size={15} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.flex}>
                <Text style={styles.iglesia} numberOfLines={1}>
                  {iglesia.sede}
                </Text>
                <Text style={styles.hora}>
                  {lista.length} {lista.length === 1 ? "culto" : "cultos"}
                  {` · ${asignadosTotal} ${asignadosTotal === 1 ? "turno asignado" : "turnos asignados"}`}
                </Text>
              </View>
              <Pressable
                onPress={() => onAbrir(iglesia)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.asignar,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.asignarTexto}>Asignar</Text>
                <Octicons name="chevron-right" size={12} color={DARK_BG} />
              </Pressable>
            </View>

            {lista.length === 0 && (
              <Text style={styles.vacio}>
                No tiene cultos en los próximos 14 días.
              </Text>
            )}

            {lista.map((c) => {
              // los roles son una referencia: solo se muestra quien sirve
              const conTurno = c.roles.filter((r) => r.persona);
              return (
                <Pressable
                  key={`${c.fecha}-${c.hora}`}
                  onPress={() => onAbrir(c.iglesia)}
                  style={({ pressed }) => [
                    styles.culto,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel={`${c.iglesia.sede}, ${fechaBonita(c.dia)}, ${c.hora}. Abrir para asignar turnos`}
                >
                  <View style={styles.cultoCabecera}>
                    <View style={styles.flex}>
                      <Text style={styles.cultoFecha}>
                        {fechaBonita(c.dia)}
                      </Text>
                      <Text style={styles.hora}>
                        {c.hora} hrs{c.nombre ? ` · ${c.nombre}` : ""}
                      </Text>
                    </View>
                  </View>
                  {conTurno.length === 0 ? (
                    <Text style={styles.sinTurnos}>
                      Aún no hay turnos asignados
                    </Text>
                  ) : (
                    conTurno.map((r) => (
                      <View key={r.id} style={styles.rol}>
                        <Text style={styles.rolNombre}>{r.label}</Text>
                        <View style={styles.persona}>
                          <AvatarPersona
                            nombre={r.persona!}
                            avatar={avatarDe(r.persona!)}
                            tamano={20}
                          />
                          <Text style={styles.personaNombre} numberOfLines={1}>
                            {r.persona}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {sinHorarios.length > 0 && (
        <Text style={styles.ayuda}>
          Sin horarios de culto:{" "}
          {sinHorarios.map((t) => t.iglesia.sede).join(", ")}. Configúralos en
          su cronograma.
        </Text>
      )}
    </ScrollView>
  );
}

// "Domingo 16 de noviembre" (hoy y mañana con su nombre)
function fechaBonita(d: Date) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((d.getTime() - hoy.getTime()) / 86400000);
  const texto = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const bonito = texto.charAt(0).toUpperCase() + texto.slice(1);
  return dias === 0
    ? `Hoy · ${bonito}`
    : dias === 1
      ? `Mañana · ${bonito}`
      : bonito;
}

const styles = StyleSheet.create({
  sinTurnos: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
    paddingTop: 2,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  contenido: {
    paddingHorizontal: PADDING,
    paddingBottom: SPACING * 4,
    gap: SPACING * 1.4,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
  },
  ayuda: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  vacio: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    paddingVertical: SPACING * 3,
  },
  // cada iglesia en su bloque, separado de la siguiente
  seccion: {
    gap: SPACING * 0.8,
    paddingTop: SPACING,
    marginTop: SPACING,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  seccionCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    marginBottom: 4,
  },
  seccionIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: PRIMARY,
  },
  seccionLogo: {
    width: 36,
    height: 36,
  },
  asignar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  asignarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: DARK_BG,
  },
  cultoFecha: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  culto: {
    gap: 6,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cultoCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    marginBottom: 4,
  },
  iglesia: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
  },
  hora: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  faltan: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${PRIMARY}22`,
  },
  rol: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  rolNombre: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
  },
  persona: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "60%",
  },
  personaNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
});
