import { useTranslation } from "@/i18n";
import { startOutboxSync } from "@/lib/outbox-sync";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid refetching the same report when going back and forth
      staleTime: 30_000,
    },
  },
});

// A deep link straight into a report still gets the list underneath, so
// Back works even on a cold start.
export const unstable_settings = {
  anchor: "index",
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => startOutboxSync(queryClient), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="filters" options={{ presentation: "modal" }} />
          <Stack.Screen name="new-report" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="reports/[id]"
            options={{
              headerShown: true,
              title: t("details.title"),
              headerBackTitle: t("details.back"),
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: t("settings.title"),
              headerBackTitle: t("details.back"),
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
