export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start_time: "09:00", end_time: "10:00", available: true },
  { start_time: "10:00", end_time: "11:00", available: true },
  { start_time: "11:00", end_time: "12:00", available: true },
  { start_time: "12:00", end_time: "13:00", available: true },
  { start_time: "13:00", end_time: "14:00", available: true },
  { start_time: "14:00", end_time: "15:00", available: true },
  { start_time: "15:00", end_time: "16:00", available: true },
  { start_time: "16:00", end_time: "17:00", available: true },
];

export const DEFAULT_TIME_SLOTS_MESSAGE =
  "Go to settings to update your appointment timings";
