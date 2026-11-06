import { Stack } from "expo-router";

// Pantallas del onboarding (bienvenida y, mas adelante, registro / login)
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
