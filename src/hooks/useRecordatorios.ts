import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  Aviso,
  configurarNotificaciones,
  NOTIS_DISPONIBLES,
  programarAvisos,
} from "@/services/notificaciones";
import { CATEGORIAS } from "@/constants/constans";
import { useEstudios, useRoles } from "@/store/estudios";
import { horaTurno } from "@/utils/cultos";
import { unirTurnos } from "@/utils/turnos";
import { useEffect } from "react";

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
  } = useEstudios();
  const quiere = (t: "cultos" | "turnos" | "anuncios") => avisos[t] ?? true;
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
        });
      }
    }
  }

  // Mis turnos: el dia anterior a las 19:00
  if (quiere("turnos")) {
    for (const t of unirTurnos(turnosEditados).filter(
      (t) => t.persona === yo,
    )) {
      const fecha = deKey(t.fecha, "19:00");
      fecha.setDate(fecha.getDate() - 1);
      lista.push({
        titulo: "Mañana te toca servir 🙌",
        cuerpo: `${roles.de(t.rol).label} · ${horaTurno(t) ?? ""} hrs`,
        fecha,
      });
    }
  }

  // Palabra de la semana: el dia antes del plazo a las 19:00, si aun no responde
  if (quiere("turnos")) {
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
      });
    }
  }

  // Anuncios: a las 9:00 del dia del evento
  if (quiere("anuncios")) {
    for (const a of anuncios) {
      lista.push({
        titulo: `Hoy: ${a.titulo || CATEGORIAS[a.categoria].label}`,
        cuerpo: [a.hora && `${a.hora} hrs`, a.lugar]
          .filter(Boolean)
          .join(" · "),
        fecha: deKey(a.fecha, "09:00"),
      });
    }
  }

  // solo se reprograma si cambio algo (no en cada render)
  const firma = JSON.stringify(
    lista.map((a) => [a.titulo, a.cuerpo, a.fecha.getTime()]),
  );

  useEffect(() => {
    configurarNotificaciones().catch(() => {});
  }, []);

  useEffect(() => {
    if (!NOTIS_DISPONIBLES) return;
    const avisosAhora: Aviso[] = JSON.parse(firma).map(
      ([titulo, cuerpo, ms]: [string, string, number]) => ({
        titulo,
        cuerpo,
        fecha: new Date(ms),
      }),
    );
    programarAvisos(avisosAhora).catch(() => {});
  }, [firma]);
}
