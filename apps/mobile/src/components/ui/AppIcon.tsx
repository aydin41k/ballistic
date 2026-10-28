import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { colours } from '@/constants/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface AppIconProps {
  name: IconName;
  size?: number;
  colour?: string;
}

export function AppIcon({ name, size = 22, colour = colours.navy }: AppIconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={colour} />;
}
