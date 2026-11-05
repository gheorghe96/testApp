import { FilterChip } from "@/components/filter-chip";
import { STATUS_INFO } from "@/constants/status";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCategoryName } from "@/hooks/useCategories";
import { useTranslation } from "@/i18n";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  setFilters,
  useFilters,
} from "@/state/filters";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export function ActiveFilters() {
  const theme = useTheme();
  const { t } = useTranslation();
  const filters = useFilters();
  const categoryName = useCategoryName();

  if (countActiveFilters(filters) === 0) return null;

  const { categoryId, status } = filters;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Horizontal ScrollViews stretch to fill the column without flexGrow: 0
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {categoryId && (
        <FilterChip
          removable
          label={categoryName(categoryId)}
          onPress={() => setFilters({ ...filters, categoryId: undefined })}
        />
      )}
      {status && (
        <FilterChip
          removable
          label={t(STATUS_INFO[status].labelKey)}
          dotColor={STATUS_INFO[status].color}
          onPress={() => setFilters({ ...filters, status: undefined })}
        />
      )}
      {countActiveFilters(filters) > 1 && (
        <Pressable
          onPress={() => setFilters(EMPTY_FILTERS)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.clear, { color: theme.textSecondary }]}>
            {t("list.clearAll")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    alignItems: "center",
  },
  clear: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: Spacing.two,
  },
});
