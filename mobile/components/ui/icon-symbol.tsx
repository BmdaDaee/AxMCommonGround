import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "target": "track-changes",
  "sparkles": "auto-awesome",
  "lock.fill": "lock",
  "person.fill": "person",
  "gear": "settings",
  // Chat / messaging
  "paperplane.fill": "send",
  "bubble.left.fill": "chat-bubble",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  // General
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "plus": "add",
  "minus": "remove",
  "checkmark": "check",
  "star.fill": "star",
  "star": "star-border",
  "crown.fill": "emoji-events",
  "bolt.fill": "bolt",
  "diamond.fill": "diamond",
  "shield.fill": "shield",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "bell.fill": "notifications",
  "magnifyingglass": "search",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "photo.fill": "photo",
  "music.note": "music-note",
  "waveform": "graphic-eq",
  "calendar": "calendar-today",
  "clock.fill": "access-time",
  "flame.fill": "local-fire-department",
  "trophy.fill": "emoji-events",
  "figure.walk": "directions-walk",
  "moon.stars.fill": "nights-stay",
  "sun.max.fill": "wb-sunny",
  "slider.horizontal.3": "tune",
  "square.and.arrow.up": "share",
  "trash.fill": "delete",
  "pencil": "edit",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
