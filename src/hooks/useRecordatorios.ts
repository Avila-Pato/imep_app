import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  alActivarPermiso,
  avisarAhora,
  Aviso,
  configurarNotificaciones,
  NOTIS_DISPONIBLES,
  programarAvisos,
} from "@/services/notificaciones";
import { CATEGORIAS } from "@/constants/constans";
import {
  marcarTurnosAvisados,
  TipoAviso,
  useEstudios,
  useRoles,
} from "@/store/estudios";
import { horaTurno } from "@/utils/cultos";
import { unirTurnos } from "@/utils/turnos";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

const DIAS = 14; // se programan las proximas dos semanas

const deKey = (key: string, hora = "00:00") => {
  const [y, m, d] = key.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
};

// Arma y programa los recordatorios segun lo que la persona tiene activado.
// Se usa una vez en el layout raiz; se rehace cuando cambian sus datos
export function useRecordatorios() {
  const {
    avisos,
    turnosEditados,
    nombre,
    iglesia,
    anuncios,
    desafios,
    mensajes,
    turnosAvisados,
  } = useEstudios();
  const quiere = (t: TipoAviso) => avisos[t] ?? true;
  const yo = nombre ?? USUARIO.nombre;
  const roles = useRoles();

  const lista: Aviso[] = [];
  const hoy = new Date();

  // Cultos: 2 horas antes
  if (quiere("cultos")) {
    for (let i = 0; i < DIAS; i++) {
      const dia = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() + i,
      );
      for (const h of HORARIOS_CULTO.filter((h) => h.dia === dia.getDay())) {
        const [hh, mm] = h.hora.split(":").map(Number);
        const fecha = new Date(dia);
        fecha.setHours(hh - 2, mm);
        lista.push({
          titulo: `Hoy hay culto a las ${h.hora} hrs`,
          cuerpo: `Te esperamos${iglesia ? ` en ${iglesia.sede}` : ""}.`,
          fecha,
          url: "/eventos?vista=anuncios",
        });
      }
    }
  }

  // Mis turnos: el dia anterior a las 19:00 y el mismo dia 2 horas antes
  const misTurnos = unirTurnos(turnosEditados).filter((t) => t.persona === yo);
  if (quiere("turnos")) {
    for (const t of misTurnos) {
      const hora = horaTurno(t) ?? "19:00";
      const rol = roles.de(t.rol).label;
      const antes = deKey(t.fecha, "19:00");
      antes.setDate(antes.getDate() - 1);
      lista.push({
        titulo: "Mañana te toca servir 🙌",
        cuerpo: `${rol} · ${hora} hrs`,
        fecha: antes,
        url: "/eventos?vista=cronograma",
      });
      const hoy = deKey(t.fecha, hora);
      hoy.setHours(hoy.getHours() - 2);
      lista.push({
        titulo: `Hoy te toca: ${rol} 🙌`,
        cuerpo: `A las ${hora} hrs. ¡Gracias por servir!`,
        fecha: hoy,
        url: "/eventos?vista=cronograma",
      });
    }
  }

  // Turnos nuevos (que aun no pasan): "te asignaron" al momento.
  // La primera vez solo se anotan, para no avisar los que ya tenia
  const hoyKey = new Date().toISOString().slice(0, 10);
  const claveTurno = (t: (typeof misTurnos)[number]) =>
    `${t.fecha}|${t.rol}|${horaTurno(t) ?? ""}`;
  const nuevos = misTurnos.filter(
    (t) => t.fecha >= hoyKey && !(turnosAvisados ?? []).includes(claveTurno(t)),
  );
  const firmaNuevos = JSON.stringify(
    nuevos.map((t) => ({
      clave: claveTurno(t),
      rol: roles.de(t.rol).label,
      fecha: t.fecha,
      hora: horaTurno(t),
    })),
  );
  const primeraVez = turnosAvisados === undefined;
  const avisarTurnos = quiere("turnos");
  useEffect(() => {
    const lista: {
      clave: string;
      rol: string;
      fecha: string;
      hora?: string;
    }[] = JSON.parse(firmaNuevos);
    if (!lista.length) return;
    if (!primeraVez && avisarTurnos) {
      for (const t of lista) {
        const dia = deKey(t.fecha).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        avisarAhora(
          "Te asignaron un turno 📋",
          `${t.rol} · ${dia}${t.hora ? ` · ${t.hora} hrs` : ""}`,
          "/eventos?vista=cronograma",
        ).catch(() => {});
      }
    }
    marcarTurnosAvisados(lista.map((t) => t.clave));
  }, [firmaNuevos, primeraVez, avisarTurnos]);

  // Palabra de la semana: su dia a las 9:00 (o el dia antes del plazo), si
  // aun no responde. Va con "Mi sala"
  if (quiere("salas")) {
    for (const d of desafios) {
      const meToca =
        d.elegidos.includes(yo) || d.elegidos.includes(USUARIO.nombre);
      const respondi = mensajes.some((m) => m.desafio === d.id);
      if (!meToca || respondi) continue;
      // su dia: aviso en la mañana
      const miDia = d.dias?.[yo] ?? d.dias?.[USUARIO.nombre];
      if (miDia) {
        lista.push({
          titulo: "Hoy te toca hablar de tu palabra 📖",
          cuerpo: `Comparte en tu grupo lo que te enseñó ${d.cita ?? "el versículo que elijas"}.`,
          fecha: deKey(miDia, "09:00"),
          url: `/sala/${d.grupo}`,
        });
        continue;
      }
      const fecha = deKey(d.hasta, "19:00");
      fecha.setDate(fecha.getDate() - 1);
      lista.push({
        titulo: "Te falta tu palabra de la semana 📖",
        cuerpo: d.cita
          ? `Comparte lo que te enseñó ${d.cita}.`
          : "Elige un versículo y cuéntale a tu sala qué te enseñó.",
        fecha,
        url: `/sala/${d.grupo}`,
      });
    }
  }

  // Anuncios: 2 horas antes si tiene hora; si no, a las 9:00 de ese dia
  if (quiere("anuncios")) {
    for (const a of anuncios) {
      const fecha = a.hora ? deKey(a.fecha, a.hora) : deKey(a.fecha, "09:00");
      if (a.hora) fecha.setHours(fecha.getHours() - 2);
      lista.push({
        titulo: `Hoy: ${a.titulo || CATEGORIAS[a.categoria].label}`,
        cuerpo: [a.hora && `${a.hora} hrs`, a.lugar]
          .filter(Boolean)
          .join(" · "),
        fecha,
        url: "/eventos?vista=anuncios",
      });
    }
  }

  // solo se reprograma si cambio algo (no en cada render)
  const firma = JSON.stringify(
    lista.map((a) => [a.titulo, a.cuerpo, a.fecha.getTime(), a.url]),
  );

  // se vuelve a programar al activar el permiso o al volver a la app
  // (por si lo activo en los ajustes del telefono)
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    const quitar = alActivarPermiso(() => setVuelta((v) => v + 1));
    const sub = AppState.addEventListener("change", (e) => {
      if (e === "active") setVuelta((v) => v + 1);
    });
    return () => {
      quitar();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    configurarNotificaciones().catch(() => {});
  }, []);

  useEffect(() => {
    if (!NOTIS_DISPONIBLES) return;
    const avisosAhora: Aviso[] = JSON.parse(firma).map(
      ([titulo, cuerpo, ms, url]: [string, string, number, string?]) => ({
        titulo,
        cuerpo,
        fecha: new Date(ms),
        url: url ?? undefined,
      }),
    );
    programarAvisos(avisosAhora).catch(() => {});
  }, [firma, vuelta]);
}
