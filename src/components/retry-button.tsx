import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
};

export function RetryButton({ onPress, label }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  label ??= t("common.tryAgain");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.backgroundSelected,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  label: {
    fontWeight: "600",
  },
});
