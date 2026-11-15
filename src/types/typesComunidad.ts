import { IconName } from "./typesCronogramas";

// Salas de la comunidad (cada grupo de la iglesia). Ademas de las de base,
// el pastor puede crear otras (por eso tambien acepta cualquier texto)
export type GrupoId = "general" | (string & {}); // "general" = toda la iglesia; el resto, salas creadas

export type Grupo = {
  id: GrupoId;
  label: string;
  descripcion: string;
  icono: IconName;
  tono?: string; // color suave del gajo en la rueda de salas
  lider?: string; // lo elige el pastor/administrador al crear la sala
  liderId?: string; // su cuenta (no se confunde con otro del mismo nombre)
  // tambien la administran (los elige el lider o el pastor entre los de la sala)
  ayudantes?: string[];
  ayudantesIds?: string[]; // sus cuentas (las que se saben)
  // que tiene la sala (sin dato = si). Miembros siempre esta
  funciones?: Partial<Record<FuncionSala, boolean>>;
  tipo?: TipoSala; // para quien es (niños, jovenes...): define lo de abajo
  foto?: string; // imagen de la sala (URL https, o la del telefono al subirla)
  soloLider?: boolean; // en el chat solo escriben el lider y el pastor
  letraGrande?: boolean; // la sala se ve con letra mas grande
};

export type TipoSala =
  | "ninos"
  | "preadolescentes"
  | "jovenes"
  | "mujeres"
  | "varones"
  | "matrimonios"
  | "mayores"
  | "alabanza"
  | "otra";

export type FuncionSala = "chat" | "oracion" | "palabra";

export type Miembro = {
  nombre: string;
  rol?: string; // ej: "Líder", "Pastor"
  id?: string; // usuario (los que vienen del servidor)
  esYo?: boolean;
  esPastor?: boolean;
  sinChat?: boolean; // el pastor no lo deja escribir en el chat
  sinOracion?: boolean; // el pastor no lo deja pedir oracion
};

// Mensaje del chat de una sala
export type Mensaje = {
  id: string;
  grupo: GrupoId;
  autor: string;
  texto: string; // puede ir vacio si es una nota de voz
  fecha: string; // ISO
  cita?: string; // versiculo sobre el que se comparte
  versiculo?: string; // texto de ese versiculo
  audio?: NotaDeVoz;
  audioVencido?: boolean; // la nota de voz se borro (tenia mas de 3 meses)
  desafio?: string; // id de la "Palabra de la semana" que responde
  // publicado por el lider para todo el grupo
  tipo?: "aviso" | "devocional" | "encuentro" | "memorizar";
  titulo?: string; // titulo del devocional
  notificar?: boolean; // aviso/devocional del lider: llega como notificacion
  para?: string[]; // nombres: solo a ellos (sin dato = a toda la sala)
  mio?: boolean; // lo escribio esta persona
  pendiente?: boolean; // aun no llega al servidor
  reacciones?: Record<string, number>; // emoji -> cuantos (como WhatsApp)
  miReaccion?: string; // la que puso esta persona
  encuentro?: Encuentro; // tipo "encuentro": cuando y donde
  respuestas?: RespuestaMensaje[]; // Voy / No puedo / Lo aprendi (de todos)
  miRespuesta?: ValorRespuesta; // la de esta persona
};

// Encuentro del grupo (desayuno, salida, reunion): los hermanos confirman
export type Encuentro = {
  fecha: string; // "YYYY-MM-DD"
  hora?: string; // "10:00"
  lugar?: string;
};

// Respuesta a una publicacion del lider: a un encuentro ("voy" / "no") o
// a un versiculo para memorizar ("aprendido", al ganar el juego)
export type ValorRespuesta = "voy" | "no" | "aprendido";
export type RespuestaMensaje = { nombre: string; valor: ValorRespuesta };

// "Palabra de la semana": el lider elige hermanos de su sala para que cada
// uno elija un versiculo (o uno fijo) y cuente en el chat que le enseño
export type Desafio = {
  id: string;
  grupo: GrupoId;
  autor: string; // el lider que lo dio
  consigna: string;
  cita?: string; // versiculo fijo; sin cita = cada uno elige el suyo
  elegidos: string[];
  dias?: Record<string, string>; // el dia que le toca a cada uno ("YYYY-MM-DD")
  desde: string; // ISO
  hasta: string; // "YYYY-MM-DD" (ultimo dia para responder)
};

export type NotaDeVoz = {
  uri: string;
  duracion: number; // segundos
};

// Estudio guiado que la persona guarda en su telefono
export type EstudioGuardado = {
  id: string;
  cita: string;
  respuestas: Record<string, string>; // id de pregunta -> respuesta
  fecha: string; // ISO
  compartido: boolean;
};

// Lo que se ve en el muro de la Comunidad
export type Publicacion = {
  id: string;
  autor: string;
  grupo: GrupoId; // sala donde se compartio
  cita: string;
  mostrarCita?: boolean; // si la persona quiso mostrar el pasaje estudiado
  texto: string; // la oracion o reflexion compartida
  fecha: string; // ISO
  orando: number; // cuantos hermanos estan orando
  estado?: EstadoPeticion; // sin estado = aprobada
  mia?: boolean; // la pidio esta persona
  fijada?: boolean; // el pastor la mantiene en el muro (no vence a las 24 h)
  porSubir?: boolean; // aun no llega al servidor
};

// Toda peticion pasa por el lider de la sala antes de llegar al muro
export type EstadoPeticion = "pendiente" | "aprobada" | "rechazada";

// Decision del lider (las 24 h del muro cuentan desde que se aprueba)
export type Revision = {
  estado: Exclude<EstadoPeticion, "pendiente">;
  fecha: string; // ISO
};

// Versiculo(s) que la persona guarda desde la Biblia
export type VersiculoGuardado = {
  id: string; // "1-1-3" (libro-capitulo-primer verso) + versos
  cita: string; // "Génesis 1:3-4"
  texto: string;
  oracion?: string; // si oro con ese versiculo
  fecha: string; // ISO
};
