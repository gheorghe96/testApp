import { photoUrl, type Report } from "@/api/reports";
import { Spacing, type Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ReportCardProps = {
  report: Report;
  statusLabel: string;
  statusColor: string;
  meta: string;
  theme: (typeof Colors)["light" | "dark"];
};

// No hooks on purpose: labels arrive as plain strings from the list, so a
// hundred rows don't mean a hundred subscriptions, and memo() works.
function ReportCardBase({
  report,
  statusLabel,
  statusColor,
  meta,
  theme,
}: ReportCardProps) {
  const photo = report.photos[0];

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/reports/[id]", params: { id: report.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={report.title}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {photo && (
        <Image
          source={photoUrl(photo.url)}
          style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
          contentFit="cover"
          // The API has no thumbnails, so cache the full photos hard.
          // expo-image already decodes them at the card's size.
          cachePolicy="memory-disk"
          transition={150}
          // Recycled cell: don't flash the previous row's photo
          recyclingKey={report.id}
        />
      )}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {meta}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {report.title}
        </Text>
        <Text
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={3}
        >
          {report.description}
        </Text>
      </View>
    </Pressable>
  );
}

export const ReportCard = memo(ReportCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  photo: {
    width: "100%",
    aspectRatio: 16 / 9,
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
});
