import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  /** Adds an ×. Used for the applied filters on the main screen. */
  removable?: boolean;
  dotColor?: string;
};

export function FilterChip({
  label,
  onPress,
  active = false,
  removable = false,
  dotColor,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const filled = active || removable;
  const fg = filled ? theme.background : theme.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        removable ? t("list.removeFilter", { name: label }) : label
      }
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: filled ? theme.text : theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {removable && (
        <SymbolView
          name={{ ios: "xmark", android: "close", web: "close" }}
          size={12}
          weight="bold"
          tintColor={fg}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
