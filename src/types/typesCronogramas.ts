import Octicons from "@expo/vector-icons/Octicons";
import { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Octicons>["name"];

export type RolId =
  "palabra" | "pasillo" | "alabanza" | "ofrenda" | "recepcion";

export type Rol = {
  label: string;
  icon: IconName;
};

export type Turno = {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  rol: RolId;
  persona: string;
  hora: string; // inicio "HH:MM"
  horaFin: string; // termino "HH:MM"
};
