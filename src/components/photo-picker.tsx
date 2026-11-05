import { LIMITS } from "@/constants/report-limits";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { preparePhoto, type LocalPhoto } from "@/lib/photos";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  photos: LocalPhoto[];
  onAdd: (photos: LocalPhoto[]) => void;
  onRemove: (index: number) => void;
  error?: string;
};

export function PhotoPicker({ photos, onAdd, onRemove, error }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [preparing, setPreparing] = useState(0);
  const remaining = LIMITS.maxPhotos - photos.length - preparing;

  const addAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const picked = assets.slice(0, remaining);
    setPreparing((n) => n + picked.length);
    try {
      const prepared: LocalPhoto[] = [];
      for (const a of picked) {
        try {
          prepared.push(await preparePhoto(a));
        } catch {
          Alert.alert(t("photos.notAddedTitle"), t("photos.notAddedMessage"));
        } finally {
          setPreparing((n) => n - 1);
        }
      }
      if (prepared.length) onAdd(prepared);
    } catch {
      setPreparing(0);
    }
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("photos.cameraPermissionTitle"),
        t("photos.cameraPermissionMessage"),
      );
      return;
    }
    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1, // preparePhoto compresses; don't do it twice
      });
      if (!res.canceled) await addAssets(res.assets);
    } catch {
      // The iOS Simulator has no camera
      Alert.alert(
        t("photos.cameraUnavailableTitle"),
        t("photos.cameraUnavailableMessage"),
      );
    }
  };

  const fromGallery = async () => {
    // The system picker doesn't need library permission
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 1,
    });
    if (!res.canceled) await addAssets(res.assets);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={p.uri} style={styles.thumb} contentFit="cover" />
            <Pressable
              onPress={() => onRemove(i)}
              accessibilityRole="button"
              accessibilityLabel={t("photos.remove", { index: i + 1 })}
              hitSlop={8}
              style={styles.remove}
            >
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                size={10}
                weight="bold"
                tintColor="#fff"
              />
            </Pressable>
          </View>
        ))}
        {Array.from({ length: preparing }).map((_, i) => (
          <View
            key={`preparing-${i}`}
            style={[
              styles.thumb,
              styles.center,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ActivityIndicator />
          </View>
        ))}
      </View>

      {remaining > 0 && (
        <View style={styles.buttons}>
          <SourceButton
            label={t("photos.camera")}
            icon={{
              ios: "camera",
              android: "photo_camera",
              web: "photo_camera",
            }}
            onPress={fromCamera}
          />
          <SourceButton
            label={t("photos.gallery")}
            icon={{
              ios: "photo.on.rectangle",
              android: "photo_library",
              web: "photo_library",
            }}
            onPress={fromGallery}
          />
        </View>
      )}

      <Text
        style={[
          styles.hint,
          { color: error ? "#EF4444" : theme.textSecondary },
        ]}
      >
        {error ??
          t("photos.count", { count: photos.length, max: LIMITS.maxPhotos })}
      </Text>
    </View>
  );
}

function SourceButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.source,
        {
          backgroundColor: theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <SymbolView name={icon} size={18} tintColor={theme.text} />
      <Text style={[styles.sourceText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 96;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  source: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 15,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
  },
});
