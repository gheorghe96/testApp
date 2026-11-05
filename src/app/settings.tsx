import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LANGUAGES, setLanguage, useTranslation } from "@/i18n";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const theme = useTheme();
  const { t, lang } = useTranslation();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.body}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.section, { color: theme.textSecondary }]}>
        {t("settings.language")}
      </Text>
      <View
        style={[styles.group, { backgroundColor: theme.backgroundElement }]}
        accessibilityRole="radiogroup"
      >
        {LANGUAGES.map((l, i) => {
          const selected = l.code === lang;
          return (
            <Pressable
              key={l.code}
              onPress={() => setLanguage(l.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.row,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.backgroundSelected,
                },
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.rowText, { color: theme.text }]}>
                {l.label}
              </Text>
              {selected && (
                <SymbolView
                  name={{ ios: "checkmark", android: "check", web: "check" }}
                  size={18}
                  weight="semibold"
                  tintColor="#3B82F6"
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: Spacing.three,
  },
  group: {
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 48,
  },
  rowText: {
    fontSize: 16,
  },
});
