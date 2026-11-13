import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

// Vuelta del login con Google (congrega://auth). La sesion la aplica
// services/cuenta; aqui solo se cierra la ventana (web) o se regresa
WebBrowser.maybeCompleteAuthSession();

export default function Auth() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, []);
  return null;
}
