import { Pressable, Text } from "react-native";

import { styles } from "@/screens/home/styles";

type ChoiceChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function ChoiceChip({ label, onPress, selected }: ChoiceChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: selected ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)" }}
      style={({ pressed }) => [
        styles.choiceChip,
        selected ? styles.choiceChipActive : null,
        pressed && styles.pressedOpacity,
      ]}
    >
      <Text
        style={[
          styles.choiceChipText,
          selected ? styles.choiceChipTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
