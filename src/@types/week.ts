export type WeekDayProps =
  | { dayName: "monday"; dayNumber: 1 }
  | { dayName: "tuesday"; dayNumber: 2 }
  | { dayName: "wednesday"; dayNumber: 3 }
  | { dayName: "thursday"; dayNumber: 4 }
  | { dayName: "friday"; dayNumber: 5 }
  | { dayName: "saturday"; dayNumber: 6 }
  | { dayName: "sunday"; dayNumber: 7 };

export type WeekType<T extends "profile" = any> = {
  [day in WeekDayProps["dayName"] | string]: Array<
    T extends "profile"
      ? Omit<WeekDayType<Extract<WeekDayProps, { dayName: day }>>, "active">
      : WeekDayType<Extract<WeekDayProps, { dayName: day }>>
  >;
};

export type WeekDayType<T extends { dayNumber: number } = any> = {
  code: string;
  open: string;
  close: string;
  active: boolean;
  weekDay: T["dayNumber"];
};
