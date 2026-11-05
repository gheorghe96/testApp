import { photoUrl, type Photo } from "@/api/reports";
import { Spacing } from "@/constants/theme";
import { useTranslation } from "@/i18n";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  photos: Photo[];
  /** null = closed */
  index: number | null;
  onClose: () => void;
};

export function PhotoViewer({ photos, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(index ?? 0);
  const [prevIndex, setPrevIndex] = useState(index);

  // Reset the counter when opened on a different photo
  if (index !== prevIndex) {
    setPrevIndex(index);
    if (index !== null) setCurrent(index);
  }

  return (
    <Modal
      visible={index !== null}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          keyExtractor={(p, i) => `${p.url}-${i}`}
          onMomentumScrollEnd={(e) =>
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            // ScrollView zoom is iOS-only; Android gets no pinch for now
            <ScrollView
              style={{ width, height }}
              contentContainerStyle={styles.page}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={photoUrl(item.url)}
                style={{ width, height }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
                accessibilityLabel={t("photo.label")}
              />
            </ScrollView>
          )}
        />

        <View
          style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}
          pointerEvents="box-none"
        >
          <Text style={styles.counter}>
            {photos.length > 1 ? `${current + 1} / ${photos.length}` : ""}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("photo.close")}
            hitSlop={12}
            style={styles.close}
          >
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={16}
              weight="bold"
              tintColor="#fff"
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000",
  },
  page: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  counter: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
