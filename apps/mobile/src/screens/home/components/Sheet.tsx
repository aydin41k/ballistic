import * as Haptics from "expo-haptics";
import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/screens/home/styles";

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ children, onClose, title, visible }: SheetProps) {
  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="pageSheet"
      visible={visible}
      accessibilityViewIsModal
    >
      <SafeAreaView style={styles.sheetSafeArea}>
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && styles.pressedOpacity,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.ghostButtonText}>Close</Text>
            </Pressable>
          </View>
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
