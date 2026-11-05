import { photoUrl } from "@/api/reports";
import { PhotoViewer } from "@/components/photo-viewer";
import { RetryButton } from "@/components/retry-button";
import { STATUS_INFO } from "@/constants/status";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCategoryName } from "@/hooks/useCategories";
import { useReport } from "@/hooks/useReport";
import { useTranslation } from "@/i18n";
import { errorText } from "@/i18n/errors";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatDateTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Also the target of reports://reports/{id}
export default function ReportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isPending, error, refetch, isFetching } = useReport(id);
  const categoryName = useCategoryName();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!report) {
    const notFound = error?.status === 404;
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{ title: notFound ? t("details.notFound") : "" }}
        />
        <Text style={[styles.message, { color: theme.text }]}>
          {errorText(t, error)}
        </Text>
        {!notFound && (
          <RetryButton
            onPress={() => refetch()}
            label={isFetching ? t("common.loading") : t("common.tryAgain")}
          />
        )}
      </View>
    );
  }

  const info = STATUS_INFO[report.status];
  const status = info
    ? { label: t(info.labelKey), color: info.color }
    : { label: report.status, color: theme.textSecondary };
  const edited = report.updatedAt !== report.createdAt;

  return (
    <>
      <Stack.Screen options={{ title: categoryName(report.categoryId) }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.four }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {report.photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photos}
          >
            {report.photos.map((p, i) => (
              <Pressable
                key={`${p.url}-${i}`}
                onPress={() => setViewerIndex(i)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t("details.openPhoto", {
                  index: i + 1,
                  total: report.photos.length,
                })}
              >
                <Image
                  source={photoUrl(p.url)}
                  style={[
                    styles.photo,
                    report.photos.length === 1 && {
                      width: width - Spacing.three * 2,
                    },
                    { backgroundColor: theme.backgroundElement },
                  ]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: status.color }]}>
              <Text style={styles.badgeText}>{status.label}</Text>
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {categoryName(report.categoryId)}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {report.title}
          </Text>

          <Text style={[styles.description, { color: theme.text }]}>
            {report.description}
          </Text>

          <View
            style={[styles.dates, { borderTopColor: theme.backgroundSelected }]}
          >
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {t("details.created", {
                date: formatDateTime(report.createdAt, locale),
              })}
            </Text>
            {edited && (
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {t("details.updated", {
                  date: formatDateTime(report.updatedAt, locale),
                })}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <PhotoViewer
        photos={report.photos}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
  },
  photos: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  photo: {
    width: 280,
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
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
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  dates: {
    gap: Spacing.one,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
