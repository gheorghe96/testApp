import type { Report } from "@/api/reports";
import { ActiveFilters } from "@/components/active-filters";
import { PendingReportCard } from "@/components/pending-report-card";
import { ReportCard } from "@/components/report-card";
import { RetryButton } from "@/components/retry-button";
import { SearchBar } from "@/components/search-bar";
import { STATUS_INFO } from "@/constants/status";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCategories, useCategoryName } from "@/hooks/useCategories";
import { useReports } from "@/hooks/useReports";
import { useTranslation } from "@/i18n";
import { errorText } from "@/i18n/errors";
import { matchesFilters } from "@/lib/report-filters";
import { countActiveFilters, setFilters, useFilters } from "@/state/filters";
import { useOutbox, type OutboxItem } from "@/state/outbox";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Row =
  { kind: "pending"; item: OutboxItem } | { kind: "report"; report: Report };

const keyExtractor = (row: Row) =>
  row.kind === "pending" ? `pending-${row.item.id}` : row.report.id;
const getItemType = (row: Row) => row.kind;

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const categoryName = useCategoryName();
  const filters = useFilters();
  const activeCount = countActiveFilters(filters);

  // A remembered category can disappear from the server; don't keep
  // filtering by it and showing an empty list
  const { categories, isSuccess: categoriesLoaded } = useCategories();
  useEffect(() => {
    if (
      categoriesLoaded &&
      filters.categoryId &&
      !categories.some((c) => c.id === filters.categoryId)
    ) {
      setFilters({ ...filters, categoryId: undefined });
    }
  }, [categoriesLoaded, categories, filters]);

  // Only the debounced query lives here; keystrokes stay inside SearchBar
  const [q, setQ] = useState("");
  const queryFilters = useMemo(
    () => (q ? { ...filters, q } : filters),
    [filters, q],
  );

  const {
    reports,
    total,
    error,
    isPending,
    isError,
    isFetchNextPageError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refresh,
    isRefreshing,
    isFetching,
    isPlaceholderData,
  } = useReports(queryFilters);

  const outbox = useOutbox();

  const rows = useMemo<Row[]>(
    () => [
      ...outbox
        .filter((item) => matchesFilters(item, queryFilters))
        .map((item) => ({ kind: "pending" as const, item })),
      ...reports.map((report) => ({ kind: "report" as const, report })),
    ],
    [outbox, reports, queryFilters],
  );

  // Intl formatters are expensive to create; one for the whole list
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  // Labels are resolved here and passed down as strings, so cards don't each
  // subscribe to i18n and categories, and memo() can skip unchanged rows
  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.kind === "pending")
        return <PendingReportCard item={item.item} />;
      const r = item.report;
      const info = STATUS_INFO[r.status];
      return (
        <ReportCard
          report={r}
          statusLabel={info ? t(info.labelKey) : r.status}
          statusColor={info?.color ?? theme.textSecondary}
          meta={`${categoryName(r.categoryId)} · ${dateFormat.format(new Date(r.createdAt))}`}
          theme={theme}
        />
      );
    },
    [t, categoryName, dateFormat, theme],
  );

  // Scroll instead of remounting with a new `key`: remounting throws away
  // FlashList's recycled cells
  const listRef = useRef<FlashListRef<Row>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [queryFilters]);

  const loadMore = useCallback(() => {
    // Don't append a page of the *previous* query while the new one loads
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      !isPlaceholderData
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPlaceholderData,
    fetchNextPage,
  ]);

  // Loading/error live in the footer rather than replacing the list, so
  // unsent reports stay visible when the server is down
  const firstLoadFailed = isError && reports.length === 0;
  let footer: React.ReactNode = null;
  if (isPending) {
    footer = <ActivityIndicator size="large" style={styles.status} />;
  } else if (firstLoadFailed) {
    footer = (
      <View style={styles.status}>
        <Text style={[styles.message, { color: theme.text }]}>
          {errorText(t, error)}
        </Text>
        <RetryButton onPress={refresh} />
      </View>
    );
  } else if (isFetchingNextPage) {
    footer = <ActivityIndicator style={styles.footer} />;
  } else if (isFetchNextPageError) {
    footer = (
      <View style={styles.footer}>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {`${t("list.loadMoreFailed")}. ${errorText(t, error)}`}
        </Text>
        <RetryButton onPress={() => fetchNextPage()} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        // Inset the container, not the content, or the iOS refresh spinner
        // hides under the status bar
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>
          {t("list.title")}{" "}
          {!isPending && !firstLoadFailed && (
            <Text style={{ color: theme.textSecondary }}>({total})</Text>
          )}
        </Text>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel={t("list.settings")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor: theme.backgroundElement,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <SymbolView
              name={{ ios: "gearshape", android: "settings", web: "settings" }}
              size={20}
              weight="semibold"
              tintColor={theme.text}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/filters")}
            accessibilityRole="button"
            accessibilityLabel={
              activeCount
                ? t("list.filtersActive", { count: activeCount })
                : t("list.filters")
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor: theme.backgroundElement,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <SymbolView
              name={{
                ios: "line.3.horizontal.decrease",
                android: "filter_list",
                web: "filter_list",
              }}
              size={20}
              weight="semibold"
              tintColor={theme.text}
            />
            {activeCount > 0 && (
              <View style={[styles.badge, { borderColor: theme.background }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
      <SearchBar onSearch={setQ} loading={isFetching && isPlaceholderData} />
      <ActiveFilters />

      <FlashList
        ref={listRef}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.text}
            colors={[theme.text]}
          />
        }
        contentContainerStyle={{
          paddingTop: Spacing.three,
          paddingBottom: insets.bottom + 96,
        }}
        ListEmptyComponent={
          isPending || firstLoadFailed ? null : (
            <Text
              style={[
                styles.message,
                styles.status,
                { color: theme.textSecondary },
              ]}
            >
              {q ? t("list.emptySearch", { query: q }) : t("list.empty")}
            </Text>
          )
        }
        ListFooterComponent={footer}
      />

      <Pressable
        onPress={() => router.push("/new-report")}
        accessibilityRole="button"
        accessibilityLabel={t("list.newReport")}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + Spacing.three,
            backgroundColor: theme.text,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <SymbolView
          name={{ ios: "plus", android: "add", web: "add" }}
          size={26}
          weight="semibold"
          tintColor={theme.background}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  status: {
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  header: {
    flexShrink: 1,
    fontSize: 28,
    fontWeight: "700",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
  },
  footer: {
    paddingVertical: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },
  fab: {
    position: "absolute",
    right: Spacing.three + 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
