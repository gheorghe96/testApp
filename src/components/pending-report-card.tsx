import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCategoryName } from "@/hooks/useCategories";
import { useTranslation } from "@/i18n";
import { errorText } from "@/i18n/errors";
import {
  removeFromOutbox,
  retryOutboxItem,
  type OutboxItem,
} from "@/state/outbox";
import { Image } from "expo-image";
import { useNetworkState } from "expo-network";
import { memo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Reads network state itself rather than taking it as a prop, so a network
// change re-renders these few cards and not every row in the list.
function PendingReportCardBase({ item }: { item: OutboxItem }) {
  const network = useNetworkState();
  const offline =
    network.isConnected === false || network.isInternetReachable === false;
  const theme = useTheme();
  const { t } = useTranslation();
  const categoryName = useCategoryName();
  const photo = item.photos[0];
  const failed = item.state === "failed";

  const status = failed
    ? { label: t("outbox.failed"), color: "#EF4444" }
    : item.state === "sending"
      ? { label: t("outbox.sending"), color: "#6B7280" }
      : offline || item.waitingForNetwork
        ? { label: t("outbox.waitingNetwork"), color: "#6B7280" }
        : { label: t("outbox.sendingSoon"), color: "#6B7280" };

  const cancel = () =>
    Alert.alert(t("outbox.cancelTitle"), t("outbox.cancelMessage"), [
      { text: t("outbox.keep"), style: "cancel" },
      {
        text: t("outbox.cancelConfirm"),
        style: "destructive",
        onPress: () => removeFromOutbox(item.id),
      },
    ]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: failed ? "#EF4444" : theme.backgroundSelected,
        },
      ]}
    >
      {photo && (
        <Image source={photo.uri} style={styles.photo} contentFit="cover" />
      )}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: status.color }]}>
            {item.state === "sending" && (
              <ActivityIndicator size="small" color="#fff" />
            )}
            <Text style={styles.badgeText}>{status.label}</Text>
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {categoryName(item.categoryId)}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.description && (
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {failed && (
          <Text style={styles.error}>
            {errorText(t, item.error ?? { code: "UNKNOWN" })}
          </Text>
        )}

        {/* No cancel mid-request: the server may already have it */}
        {item.state !== "sending" && (
          <View style={styles.actions}>
            {failed && (
              <ActionButton
                label={t("outbox.retry")}
                primary
                onPress={() => retryOutboxItem(item.id)}
              />
            )}
            <ActionButton label={t("outbox.cancel")} onPress={cancel} />
          </View>
        )}
      </View>
    </View>
  );
}

export const PendingReportCard = memo(PendingReportCardBase);

function ActionButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: primary ? theme.text : theme.backgroundSelected,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.actionText,
          { color: primary ? theme.background : theme.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  photo: {
    width: "100%",
    aspectRatio: 16 / 9,
    opacity: 0.85,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    flexShrink: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: "#EF4444",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  action: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
