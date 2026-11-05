import { CategoryFilter } from "@/components/category-filter";
import { FilterChip } from "@/components/filter-chip";
import { STATUSES, STATUS_INFO } from "@/constants/status";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  setFilters,
  useFilters,
  type Filters,
} from "@/state/filters";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Works on a draft so the list reloads once, on Apply, not on every tap
export default function FiltersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const saved = useFilters();
  const [draft, setDraft] = useState<Filters>(saved);

  const selectStatus = (s: Filters["status"]) =>
    setDraft((d) => ({ ...d, status: d.status === s ? undefined : s }));

  const apply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("filters.title")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          hitSlop={8}
          style={[styles.close, { backgroundColor: theme.backgroundElement }]}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            size={14}
            weight="bold"
            tintColor={theme.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.section, { color: theme.textSecondary }]}>
          {t("filters.category")}
        </Text>
        <CategoryFilter
          selected={draft.categoryId}
          onChange={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
        />

        <Text style={[styles.section, { color: theme.textSecondary }]}>
          {t("filters.status")}
        </Text>
        <View style={styles.wrap}>
          <FilterChip
            label={t("common.all")}
            active={draft.status === undefined}
            onPress={() => setDraft((d) => ({ ...d, status: undefined }))}
          />
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={t(STATUS_INFO[s].labelKey)}
              dotColor={STATUS_INFO[s].color}
              active={draft.status === s}
              onPress={() => selectStatus(s)}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.three,
            borderTopColor: theme.backgroundSelected,
          },
        ]}
      >
        <Pressable
          onPress={() => setDraft(EMPTY_FILTERS)}
          disabled={countActiveFilters(draft) === 0}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.backgroundElement,
              opacity:
                countActiveFilters(draft) === 0 ? 0.4 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {t("filters.reset")}
          </Text>
        </Pressable>
        <Pressable
          onPress={apply}
          style={({ pressed }) => [
            styles.button,
            styles.primary,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.background }]}>
            {t("filters.apply")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.two,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  primary: {
    flex: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
