import { PUBLICACIONES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import ModalFormAnuncio from "@/screens/(tab)/components/ModalFormAnuncio";
import ModalFormPredicacion from "@/screens/predicacion/ModalFormPredicacion";
import ModalIglesia from "@/screens/(tab)/components/ModalIglesia";
import ModalNuevaSala from "@/screens/(tab)/components/ModalNuevaSala";
import {
  generarCodigo,
  useEstudios,
  useGrupos,
  useIglesia,
  useMiembros,
  usePuede,
  useRoles,
} from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import { GrupoId } from "@/types/typesComunidad";
import { proximoCulto } from "@/utils/cultos";
import { codigoVisible, enlaceDeCodigo } from "@/utils/invitacion";
import { estadoPeticion } from "@/utils/peticiones";
import { unirTurnos } from "@/utils/turnos";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

const pad = (n: number) => String(n).padStart(2, "0");
const aKey = (f: Date) =>
  `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;

// Panel de administracion en el Perfil.
// Pastor: todo (resumen, invitar, roles, salas, ubicacion).
// Secretario/a (u otro rol con permisos): solo cronograma y anuncios
export default function PanelAdmin({ esPastor }: { esPastor: boolean }) {
  const {
    codigos,
    turnosEditados,
    publicaciones,
    revisiones,
    anuncios,
    nombre,
  } = useEstudios();
  // anuncio nuevo directo desde el perfil
  const [escribiendo, setEscribiendo] = useState(false);
  const [predicando, setPredicando] = useState(false);
  const grupos = useGrupos();
  const iglesia = useIglesia();
  const miembros = useMiembros();
  const puedeCronograma = usePuede("cronograma");
  const puedeAnuncios = usePuede("anuncios");
  const puedeRoles = usePuede("roles"); // pastor o secretaria
  const roles = useRoles();
  const [creandoSala, setCreandoSala] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // el pastor siempre tiene un codigo de la iglesia listo para compartir
  useEffect(() => {
    if (esPastor && !codigos.general) generarCodigo("general");
    // iglesia?.id: una iglesia antigua recibe su id del servidor despues
  }, [esPastor, codigos.general, iglesia?.id]);

  // el aviso "Copiado" se va solo
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1600);
    return () => clearTimeout(t);
  }, [copiado]);

  // Resumen
  const culto = proximoCulto();
  const diaCulto = culto ? aKey(culto.fecha) : "";
  const asignados = unirTurnos(turnosEditados).filter(
    (t) => t.fecha === diaCulto,
  ).length;
  const sinAsignar = Math.max(0, roles.lista.length - asignados);
  const porAprobar = [...PUBLICACIONES, ...publicaciones].filter(
    (p) => estadoPeticion(p, revisiones) === "pendiente",
  ).length;
  const hoyKey = aKey(new Date());
  const proximosAnuncios = anuncios.filter((a) => a.fecha >= hoyKey).length;

  const resumen: {
    valor: number;
    label: string;
    icono: IconName;
    alerta?: boolean;
    onPress?: () => void;
  }[] = [
    ...(esPastor
      ? [
          {
            valor: miembros.length,
            label: "Miembros",
            icono: "people" as IconName,
          },
          {
            valor: grupos.length,
            label: "Salas",
            icono: "comment-discussion" as IconName,
            onPress: () => router.push("/gestion/salas" as Href),
          },
          {
            valor: porAprobar,
            label: "Por aprobar",
            icono: "inbox" as IconName,
            alerta: porAprobar > 0,
            onPress: () => router.push("/gestion/salas" as Href),
          },
        ]
      : []),
    ...(puedeCronograma
      ? [
          {
            valor: sinAsignar,
            label: "Turnos sin asignar",
            icono: "calendar" as IconName,
            alerta: sinAsignar > 0,
            onPress: () => router.push("/gestion/cronograma" as Href),
          },
        ]
      : []),
    ...(puedeAnuncios
      ? [
          {
            valor: proximosAnuncios,
            label: "Anuncios próximos",
            icono: "megaphone" as IconName,
            onPress: () => router.push("/gestion/anuncios" as Href),
          },
        ]
      : []),
  ];

  const acciones: { label: string; icono: IconName; onPress: () => void }[] = [
    ...(puedeCronograma
      ? [
          {
            label: "Cronograma",
            icono: "calendar" as IconName,
            onPress: () => router.push("/gestion/cronograma" as Href),
          },
        ]
      : []),
    ...(puedeAnuncios
      ? [
          {
            label: "Nuevo anuncio",
            icono: "pencil" as IconName,
            onPress: () => setEscribiendo(true),
          },
          {
            label: "Anuncios",
            icono: "megaphone" as IconName,
            onPress: () => router.push("/gestion/anuncios" as Href),
          },
        ]
      : []),
    ...(puedeRoles
      ? [
          {
            label: "Roles y permisos",
            icono: "shield-check" as IconName,
            onPress: () => router.push("/permisos" as Href),
          },
        ]
      : []),
    ...(esPastor
      ? [
          {
            label: "Salas",
            icono: "comment-discussion" as IconName,
            onPress: () => router.push("/gestion/salas" as Href),
          },
          {
            label: "Nueva sala",
            icono: "plus" as IconName,
            onPress: () => setCreandoSala(true),
          },
          {
            label: "Ubicación",
            icono: "location" as IconName,
            onPress: () => setUbicando(true),
          },
        ]
      : []),
  ];

  const general = codigos.general;
  const compartir = (codigo: string, sala?: string) =>
    Share.share({
      message:
        `Únete a ${iglesia?.sede ?? "nuestra iglesia"}${sala ? ` (sala ${sala})` : ""} en la app:\n` +
        `${enlaceDeCodigo(codigo)}\n\n` +
        `O escribe el código ${codigoVisible(codigo)} en Perfil → Tengo un código.`,
    }).catch(() => {});

  return (
    <View style={styles.panel}>
      <View style={styles.cabecera}>
        <Text style={styles.eyebrow}>PANEL DE ADMINISTRACIÓN</Text>
        <Text style={styles.titulo}>
          {esPastor ? "Tu " : "Lo que "}
          <Text style={styles.cursiva}>
            {esPastor ? "iglesia" : "administras"}
          </Text>
        </Text>
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        {resumen.map((r) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            disabled={!r.onPress}
            style={({ pressed }) => [
              styles.dato,
              resumen.length <= 2 && styles.datoAncho,
              pressed && styles.presionado,
            ]}
          >
            <View style={styles.datoFila}>
              <Octicons
                name={r.icono}
                size={14}
                color={r.alerta ? PRIMARY : MUTED}
              />
              {r.alerta && <View style={styles.punto} />}
            </View>
            <Text style={[styles.datoValor, r.alerta && styles.datoAlerta]}>
              {r.valor}
            </Text>
            <Text style={styles.datoLabel}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Invitar (solo pastor) */}
      {esPastor && general && (
        <View style={styles.invitar}>
          <View style={styles.invitarFila}>
            <View style={styles.flex}>
              <Text style={styles.invitarEtiqueta}>CÓDIGO DE LA IGLESIA</Text>
              <Text style={styles.codigo}>{codigoVisible(general.codigo)}</Text>
              <Text style={styles.usos}>
                {general.usos === 0
                  ? "Nadie se ha unido aún"
                  : `${general.usos} ${general.usos === 1 ? "persona se unió" : "personas se unieron"}`}
              </Text>
            </View>
            {/* QR para mostrar en el culto */}
            <View style={styles.qr}>
              <QRCode
                value={enlaceDeCodigo(general.codigo)}
                size={96}
                color="#121212"
                backgroundColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.invitarBotones}>
            <Pressable
              onPress={() => compartir(general.codigo)}
              style={({ pressed }) => [
                styles.botonPrincipal,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="share-android" size={14} color={DARK_BG} />
              <Text style={styles.botonPrincipalTexto}>Compartir</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(codigoVisible(general.codigo));
                setCopiado(true);
              }}
              style={({ pressed }) => [
                styles.botonSecundario,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Copiar código"
            >
              <Octicons
                name={copiado ? "check" : "copy"}
                size={14}
                color={TEXT}
              />
            </Pressable>
            <Pressable
              onPress={() => generarCodigo("general")}
              style={({ pressed }) => [
                styles.botonSecundario,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Generar código nuevo"
            >
              <Octicons name="sync" size={14} color={TEXT} />
            </Pressable>
          </View>
          <Text style={styles.nota}>
            Generar uno nuevo anula el anterior (por si se compartió de más).
          </Text>

          {/* Codigos de cada sala: unen a la iglesia y a esa sala */}
          <Text style={[styles.invitarEtiqueta, styles.salasTitulo]}>
            CÓDIGOS POR SALA
          </Text>
          {grupos
            .filter((g) => g.id !== "general")
            .map((g) => (
              <FilaCodigo
                key={g.id}
                grupo={g.id}
                nombre={g.label}
                icono={g.icono}
                tono={g.tono}
                codigo={codigos[g.id]?.codigo}
                usos={codigos[g.id]?.usos ?? 0}
                onCompartir={(c) => compartir(c, g.label)}
              />
            ))}
        </View>
      )}

      {/* Accesos rapidos */}
      <View style={styles.acciones}>
        {acciones.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.accion,
              pressed && styles.presionado,
            ]}
          >
            <View style={styles.accionIcono}>
              <Octicons name={a.icono} size={18} color={TEXT} />
            </View>
            <Text style={styles.accionTexto}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <ModalNuevaSala
        visible={creandoSala}
        onCerrar={() => setCreandoSala(false)}
      />
      <ModalIglesia visible={ubicando} onCerrar={() => setUbicando(false)} />
      {predicando && (
        <ModalFormPredicacion
          predicador={nombre ?? USUARIO.nombre}
          onCerrar={() => setPredicando(false)}
        />
      )}
      {escribiendo && (
        <ModalFormAnuncio
          autor={nombre ?? USUARIO.nombre}
          onCerrar={() => setEscribiendo(false)}
        />
      )}
    </View>
  );
}

// Una sala con su codigo (o el boton para crearlo)
function FilaCodigo({
  grupo,
  nombre,
  icono,
  tono,
  codigo,
  usos,
  onCompartir,
}: {
  grupo: GrupoId;
  nombre: string;
  icono: IconName;
  tono?: string;
  codigo?: string;
  usos: number;
  onCompartir: (codigo: string) => void;
}) {
  return (
    <View style={styles.sala}>
      <Octicons name={icono} size={14} color={tono ?? TEXT} />
      <View style={styles.flex}>
        <Text style={styles.salaNombre}>{nombre}</Text>
        {codigo && (
          <Text style={styles.salaCodigo}>
            {codigoVisible(codigo)} · {usos} {usos === 1 ? "uso" : "usos"}
          </Text>
        )}
      </View>
      {codigo ? (
        <>
          <Pressable
            onPress={() => generarCodigo(grupo)}
            hitSlop={8}
            accessibilityLabel={`Nuevo código para ${nombre}`}
          >
            <Octicons name="sync" size={14} color={MUTED} />
          </Pressable>
          <Pressable
            onPress={() => onCompartir(codigo)}
            hitSlop={8}
            accessibilityLabel={`Compartir código de ${nombre}`}
          >
            <Octicons name="share-android" size={14} color={TEXT} />
          </Pressable>
        </>
      ) : (
        <Pressable
          onPress={() => generarCodigo(grupo)}
          style={({ pressed }) => [styles.crear, pressed && styles.presionado]}
        >
          <Text style={styles.crearTexto}>Crear código</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  panel: {
    marginHorizontal: PADDING,
    gap: SPACING * 1.4,
  },
  cabecera: {
    gap: 2,
  },
  eyebrow: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },

  // Resumen
  resumen: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING,
  },
  dato: {
    flexGrow: 1,
    flexBasis: "30%",
    gap: 4,
    padding: SPACING * 1.2,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  datoAncho: {
    flexBasis: "45%",
  },
  datoFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  datoValor: {
    fontFamily: SERIF,
    fontSize: 28,
    color: TEXT,
  },
  datoAlerta: {
    color: PRIMARY,
  },
  datoLabel: {
    fontSize: 11,
    color: MUTED,
  },

  // Invitar
  invitar: {
    gap: SPACING,
    padding: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  invitarFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
  },
  invitarEtiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: MUTED,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 26,
    letterSpacing: 2,
    color: TEXT,
    marginTop: 4,
  },
  usos: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  qr: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  invitarBotones: {
    flexDirection: "row",
    gap: SPACING,
    marginTop: 4,
  },
  botonPrincipal: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: TEXT,
  },
  botonPrincipalTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: DARK_BG,
  },
  botonSecundario: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  nota: {
    fontSize: 11,
    color: MUTED,
  },
  salasTitulo: {
    marginTop: SPACING,
  },
  sala: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING / 2,
  },
  salaNombre: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: TEXT,
  },
  salaCodigo: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  crear: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  crearTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT,
  },

  // Accesos rapidos
  acciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING,
  },
  accion: {
    flexGrow: 1,
    flexBasis: "30%",
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 1.4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  accionIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  accionTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: TEXT,
    textAlign: "center",
  },
});
