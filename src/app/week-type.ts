export interface WeekType {
  friday:    Day[];
  monday:    Day[];
  sunday:    Day[];
  tuesday:   Day[];
  saturday:  Day[];
  thursday:  Day[];
  wednesday: Day[];
}

export interface DayType {
  code:    string;
  open:    string;
  close:   string;
  active:  boolean;
  weekDay: number;
}
