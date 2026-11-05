import { FilterChip } from "@/components/filter-chip";
import { RetryButton } from "@/components/retry-button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "@/i18n";
import { errorText } from "@/i18n/errors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  selected?: string;
  onChange: (categoryId: string | undefined) => void;
  /** false in the new-report form, where a category is required. */
  allowAll?: boolean;
};

export function CategoryFilter({ selected, onChange, allowAll = true }: Props) {
  const theme = useTheme();
  const { t, lang } = useTranslation();
  const { categories, isPending, isError, error, refetch } = useCategories();

  if (isPending) {
    return (
      <View style={styles.status}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.status}>
        <Text
          style={[styles.errorText, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {`${t("categories.loadFailed")} ${errorText(t, error)}`}
        </Text>
        <RetryButton onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {allowAll && (
        <FilterChip
          label={t("common.all")}
          active={selected === undefined}
          onPress={() => onChange(undefined)}
        />
      )}
      {categories.map((c) => (
        <FilterChip
          key={c.id}
          label={c.name[lang] ?? c.id}
          active={selected === c.id}
          onPress={() =>
            onChange(allowAll && selected === c.id ? undefined : c.id)
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  status: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
});
