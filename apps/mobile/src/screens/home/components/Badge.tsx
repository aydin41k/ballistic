import { Text, View } from "react-native";

import { styles } from "@/screens/home/styles";

type BadgeProps = {
  label: string;
  tone: "navy" | "blue" | "amber" | "emerald";
  /** Optional custom background colour (hex). Overrides the tone background. */
  customColor?: string | null;
};

export function Badge({ label, tone, customColor }: BadgeProps) {
  const backgroundStyle = customColor
    ? { backgroundColor: `${customColor}26` }
    : undefined;

  const textColorStyle = customColor ? { color: customColor } : undefined;

  return (
    <View
      style={[
        styles.badge,
        !customColor
          ? tone === "blue"
            ? styles.badgeBlue
            : tone === "amber"
              ? styles.badgeAmber
              : tone === "emerald"
                ? styles.badgeEmerald
                : styles.badgeNavy
          : null,
        backgroundStyle,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          !customColor
            ? tone === "blue"
              ? styles.badgeTextBlue
              : tone === "amber"
                ? styles.badgeTextAmber
                : tone === "emerald"
                  ? styles.badgeTextEmerald
                  : styles.badgeTextNavy
            : null,
          textColorStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
