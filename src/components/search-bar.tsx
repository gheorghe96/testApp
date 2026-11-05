import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { SymbolView } from "expo-symbols";
import { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const DEBOUNCE_MS = 500;
// One letter matches nearly everything, not worth a request
const MIN_LENGTH = 2;

// Search is case-insensitive server-side, so normalizing lets "Apă" and
// "apă " share a cache entry
function normalizeQuery(text: string) {
  const q = text.trim().replace(/\s+/g, " ").toLowerCase();
  return q.length >= MIN_LENGTH ? q : "";
}

type Props = {
  /** Debounced; "" clears the search. Only called when the query changes. */
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
};

// Keeps its own text state on purpose: if the screen owned it, every
// keystroke would re-render the list
function SearchBarBase({ onSearch, loading = false, placeholder }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  placeholder ??= t("search.placeholder");
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSent = useRef("");

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (raw: string) => {
    clearTimeout(timer.current);
    setWaiting(false);
    const q = normalizeQuery(raw);
    if (q === lastSent.current) return;
    lastSent.current = q;
    onSearch(q);
  };

  const onChangeText = (next: string) => {
    setText(next);
    clearTimeout(timer.current);
    if (normalizeQuery(next) === lastSent.current) {
      setWaiting(false);
      return;
    }
    setWaiting(true);
    timer.current = setTimeout(() => send(next), DEBOUNCE_MS);
  };

  const clear = () => {
    setText("");
    send("");
  };

  const busy = waiting || loading;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundElement }]}
    >
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" }}
        size={16}
        tintColor={theme.textSecondary}
      />
      <TextInput
        value={text}
        onChangeText={onChangeText}
        onSubmitEditing={() => send(text)}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={t("search.placeholder")}
      />
      {busy && text.length > 0 ? (
        <ActivityIndicator size="small" />
      ) : text.length > 0 ? (
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel={t("search.clear")}
          hitSlop={10}
        >
          <SymbolView
            name={{
              ios: "xmark.circle.fill",
              android: "cancel",
              web: "cancel",
            }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export const SearchBar = memo(SearchBarBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
});
