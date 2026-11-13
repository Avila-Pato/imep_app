import { supabase } from "@/lib/supabase";

// "Reiniciar la app" tambien borra lo del servidor (si no, al abrir la app
// todo volveria a aparecer):
// - pastor: borra SUS iglesias. La base de datos borra en cascada todo lo de
//   ellas: miembros, cargos, anuncios, turnos, predicaciones, salas, mensajes
//   e invitaciones
// - hermano: sale de las iglesias a las que se unio (no borra nada de ellas)
// En ambos casos: quita este telefono de los avisos push y cierra la sesion
export async function borrarDelServidor() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const yo = data.session?.user.id;
  if (!yo) return; // nunca se conecto: no hay nada arriba

  const { data: mias, error: e1 } = await supabase
    .from("miembros")
    .select("iglesia_id")
    .eq("usuario_id", yo)
    .eq("rol", "pastor");
  if (e1) throw e1;
  const ids = (mias ?? []).map((m) => m.iglesia_id);
  if (ids.length) {
    const { error } = await supabase.from("iglesias").delete().in("id", ids);
    if (error) throw error;
  }

  const { error: e2 } = await supabase
    .from("miembros")
    .delete()
    .eq("usuario_id", yo);
  if (e2) throw e2;
  const { error: e3 } = await supabase
    .from("dispositivos")
    .delete()
    .eq("usuario_id", yo);
  if (e3) throw e3;

  await supabase.auth.signOut();
}
