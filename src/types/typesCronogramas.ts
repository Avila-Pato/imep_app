import Octicons from "@expo/vector-icons/Octicons";
import { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Octicons>["name"];

// Casillas que trae la app
export type RolBase =
  "palabra" | "pasillo" | "alabanza" | "ofrenda" | "recepcion";
// + las que agrega la iglesia (ej: "devocional")
export type RolId = RolBase | (string & {});

export type Rol = {
  label: string;
  icon: IconName;
};

export type Turno = {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  rol: RolId;
  persona: string;
  hora?: string; // "HH:MM" que fijo el admin; sin hora = la del culto (horaTurno)
};
