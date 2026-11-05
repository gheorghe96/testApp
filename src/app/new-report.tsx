import { CategoryFilter } from "@/components/category-filter";
import { PhotoPicker } from "@/components/photo-picker";
import { LIMITS } from "@/constants/report-limits";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { deletePhotos, type LocalPhoto } from "@/lib/photos";
import {
  hasErrors,
  validateReport,
  type DraftErrors,
  type FieldError,
} from "@/lib/validate-report";
import { addToOutbox } from "@/state/outbox";
import { router, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewReportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  // Don't shout at an empty form; validate from the first Send onwards
  const [showErrors, setShowErrors] = useState(false);

  const draft = { title, description, categoryId, photos };
  const errors: DraftErrors = showErrors ? validateReport(draft) : {};
  const msg = (e?: FieldError) => (e ? t(e.key, e.params) : undefined);
  const dirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    !!categoryId ||
    photos.length > 0;

  // Picked photos are already copied into the app's folder. Clean them up if
  // the form is abandoned; once sent, they belong to the outbox.
  const sent = useRef(false);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      if (!sent.current) deletePhotos(photosRef.current);
    },
    [],
  );

  const close = () => {
    if (!dirty) return router.back();
    Alert.alert(t("new.discardTitle"), t("new.discardMessage"), [
      { text: t("new.keepEditing"), style: "cancel" },
      {
        text: t("new.discard"),
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  const submit = () => {
    setShowErrors(true);
    if (hasErrors(validateReport(draft))) return;

    addToOutbox({
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId!,
      photos,
    });
    sent.current = true;
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* A swipe-down would skip the discard prompt */}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("new.title")}
        </Text>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          hitSlop={8}
          style={[styles.close, { backgroundColor: theme.backgroundElement }]}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            size={14}
            weight="bold"
            tintColor={theme.text}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Field
          label={t("new.fieldTitle")}
          error={msg(errors.title)}
          counter={`${title.trim().length}/${LIMITS.titleMax}`}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("new.fieldTitlePlaceholder")}
            placeholderTextColor={theme.textSecondary}
            maxLength={LIMITS.titleMax + 20}
            returnKeyType="next"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement },
              errors.title && styles.inputError,
            ]}
          />
        </Field>

        <Field
          label={t("new.fieldDescription")}
          optional
          error={msg(errors.description)}
          counter={`${description.trim().length}/${LIMITS.descriptionMax}`}
        >
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("new.fieldDescriptionPlaceholder")}
            placeholderTextColor={theme.textSecondary}
            multiline
            textAlignVertical="top"
            maxLength={LIMITS.descriptionMax + 100}
            style={[
              styles.input,
              styles.multiline,
              { color: theme.text, backgroundColor: theme.backgroundElement },
              errors.description && styles.inputError,
            ]}
          />
        </Field>

        <Field label={t("new.fieldCategory")} error={msg(errors.categoryId)}>
          <CategoryFilter
            selected={categoryId}
            onChange={setCategoryId}
            allowAll={false}
          />
        </Field>

        <Field label={t("new.fieldPhotos")}>
          <PhotoPicker
            photos={photos}
            error={msg(errors.photos)}
            onAdd={(added) =>
              setPhotos((p) => [...p, ...added].slice(0, LIMITS.maxPhotos))
            }
            onRemove={(i) =>
              setPhotos((p) => {
                deletePhotos([p[i]]);
                return p.filter((_, j) => j !== i);
              })
            }
          />
        </Field>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.three,
            borderTopColor: theme.backgroundSelected,
          },
        ]}
      >
        <Pressable
          onPress={submit}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submit,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.submitText, { color: theme.background }]}>
            {t("new.send")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  optional,
  error,
  counter,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
        {optional ? ` ${t("common.optional")}` : ""}
      </Text>
      {children}
      {(error || counter) && (
        <View style={styles.fieldFooter}>
          <Text style={styles.error}>{error ?? ""}</Text>
          {counter && (
            <Text style={[styles.counter, { color: theme.textSecondary }]}>
              {counter}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: "transparent",
  },
  multiline: {
    minHeight: 120,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  error: {
    flex: 1,
    fontSize: 13,
    color: "#EF4444",
  },
  counter: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submit: {
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
