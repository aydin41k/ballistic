import type { Item } from "@/types";

export type PanelName =
  | "filters"
  | "notes"
  | "profile"
  | "settings"
  | "activity"
  | "notifications";

export type BoardSection = {
  key: "assigned" | "mine" | "delegated";
  title: string;
  tone: "emerald" | "navy" | "amber";
  data: Item[];
};
