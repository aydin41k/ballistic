import { Pressable, Text } from "react-native";

import { styles } from "@/screens/home/styles";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function ToolbarButton({ active, label, onPress }: ToolbarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{
        color: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)",
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.toolbarButton,
        active ? styles.toolbarButtonActive : null,
        pressed && styles.pressedOpacity,
      ]}
    >
      <Text
        style={[
          styles.toolbarButtonText,
          active ? styles.toolbarButtonTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
