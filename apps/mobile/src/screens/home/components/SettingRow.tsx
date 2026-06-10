import { Switch, Text, View } from "react-native";

import { colours } from "@/theme";
import { styles } from "@/screens/home/styles";

type SettingRowProps = {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingRow({
  description,
  disabled,
  label,
  onValueChange,
  value,
}: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.flexOne}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#CBD5E1", true: colours.blueStrong }}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}
