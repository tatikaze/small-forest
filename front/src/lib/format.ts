import { format } from "date-fns";

export const getTokyoDate = (date: Date): Date => {
  return new Date(date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
};

export const getUTCDate = (date: Date) => {
  return new Date(date.toLocaleString("ja-JP", { timeZone: "UTC" }));
};

export const getRequestDateStr = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'HH:mm");
};
