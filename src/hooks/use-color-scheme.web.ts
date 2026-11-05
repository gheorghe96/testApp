import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

const subscribe = () => () => {};

// Static web rendering has no color scheme on the server. The server
// snapshot says "light" until hydration, without a setState-in-effect.
export function useColorScheme() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();
  return hydrated ? colorScheme : "light";
}
