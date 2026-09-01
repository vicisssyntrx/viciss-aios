// Ahmedabad - Gandhinagar Metro Rail Services (w.e.f 18 May 2026)
// Stations in order APMC → Gift City

export const STATIONS = [
  "APMC",
  "Old High Court",
  "Motera Stadium",
  "Koteshwar Road",
  "GNLU",
  "Info City",
  "Sachivalaya",
  "Mahatma Mandir",
  "Gift City",
] as const;

export type Station = typeof STATIONS[number];

// null = train does not stop at this station
// Time format: "HH:MM"
export interface TrainRow {
  APMC: string | null;
  "Old High Court": string | null;
  "Motera Stadium": string | null;
  "Koteshwar Road": string | null;
  GNLU: string | null;
  "Info City": string | null;
  Sachivalaya: string | null;
  "Mahatma Mandir": string | null;
  "Gift City": string | null;
}

// APMC → Gift City (42 trains)
export const APMC_TO_GIFT: TrainRow[] = [
  { APMC: "06:20", "Old High Court": "06:34", "Motera Stadium": null,  "Koteshwar Road": "06:55", GNLU: "07:10", "Info City": "07:19", Sachivalaya: "07:27", "Mahatma Mandir": "07:38", "Gift City": null },
  { APMC: "06:45", "Old High Court": "07:00", "Motera Stadium": "07:18","Koteshwar Road": "07:21", GNLU: "07:36", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "07:42" },
  { APMC: null,    "Old High Court": null,    "Motera Stadium": "07:12","Koteshwar Road": "07:30", GNLU: "07:48", "Info City": "07:57", Sachivalaya: "08:05", "Mahatma Mandir": "08:16", "Gift City": null },
  { APMC: "07:23", "Old High Court": "07:37", "Motera Stadium": "07:55","Koteshwar Road": "07:58", GNLU: "08:13", "Info City": "08:22", Sachivalaya: "08:30", "Mahatma Mandir": "08:41", "Gift City": null },
  { APMC: "07:34", "Old High Court": "07:47", "Motera Stadium": "08:06","Koteshwar Road": "08:09", GNLU: "08:24", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "08:30" },
  { APMC: "07:47", "Old High Court": "08:01", "Motera Stadium": "08:19","Koteshwar Road": "08:22", GNLU: "08:37", "Info City": "08:46", Sachivalaya: "08:54", "Mahatma Mandir": "09:05", "Gift City": null },
  { APMC: "08:03", "Old High Court": "08:17", "Motera Stadium": "08:35","Koteshwar Road": "08:38", GNLU: "08:54", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "09:01" },
  { APMC: "08:17", "Old High Court": "08:31", "Motera Stadium": "08:49","Koteshwar Road": "08:52", GNLU: "09:07", "Info City": "09:16", Sachivalaya: "09:24", "Mahatma Mandir": "09:35", "Gift City": null },
  { APMC: "08:33", "Old High Court": "08:47", "Motera Stadium": "09:05","Koteshwar Road": "09:08", GNLU: "09:23", "Info City": "09:32", Sachivalaya: "09:40", "Mahatma Mandir": "09:51", "Gift City": null },
  { APMC: "08:59", "Old High Court": "09:13", "Motera Stadium": "09:31","Koteshwar Road": "09:34", GNLU: "09:49", "Info City": "09:58", Sachivalaya: "10:06", "Mahatma Mandir": "10:17", "Gift City": null },
  { APMC: "09:11", "Old High Court": "09:25", "Motera Stadium": "09:43","Koteshwar Road": "09:46", GNLU: "10:01", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "10:07" },
  { APMC: "09:19", "Old High Court": "09:33", "Motera Stadium": "09:51","Koteshwar Road": "09:54", GNLU: "10:09", "Info City": "10:18", Sachivalaya: "10:26", "Mahatma Mandir": "10:37", "Gift City": null },
  { APMC: "09:48", "Old High Court": "10:02", "Motera Stadium": "10:20","Koteshwar Road": "10:23", GNLU: "10:38", "Info City": "10:47", Sachivalaya: "10:55", "Mahatma Mandir": "11:06", "Gift City": null },
  { APMC: "10:12", "Old High Court": "10:26", "Motera Stadium": "10:44","Koteshwar Road": "10:47", GNLU: "11:02", "Info City": "11:11", Sachivalaya: "11:19", "Mahatma Mandir": "11:30", "Gift City": null },
  { APMC: "10:36", "Old High Court": "10:50", "Motera Stadium": "11:08","Koteshwar Road": "11:11", GNLU: "11:26", "Info City": "11:35", Sachivalaya: "11:43", "Mahatma Mandir": "11:54", "Gift City": null },
  { APMC: "10:59", "Old High Court": "11:13", "Motera Stadium": "11:32","Koteshwar Road": "11:35", GNLU: "11:50", "Info City": "11:59", Sachivalaya: "12:07", "Mahatma Mandir": "12:18", "Gift City": null },
  { APMC: "11:25", "Old High Court": "11:39", "Motera Stadium": "11:57","Koteshwar Road": "12:00", GNLU: "12:15", "Info City": "12:24", Sachivalaya: "12:32", "Mahatma Mandir": "12:43", "Gift City": null },
  { APMC: "11:49", "Old High Court": "12:03", "Motera Stadium": "12:21","Koteshwar Road": "12:24", GNLU: "12:39", "Info City": "12:48", Sachivalaya: "12:56", "Mahatma Mandir": "13:07", "Gift City": null },
  { APMC: "12:13", "Old High Court": "12:27", "Motera Stadium": "12:45","Koteshwar Road": "12:48", GNLU: "13:03", "Info City": "13:12", Sachivalaya: "13:20", "Mahatma Mandir": "13:31", "Gift City": null },
  { APMC: "12:37", "Old High Court": "12:51", "Motera Stadium": "13:09","Koteshwar Road": "13:12", GNLU: "13:27", "Info City": "13:36", Sachivalaya: "13:44", "Mahatma Mandir": "13:55", "Gift City": null },
  { APMC: "13:02", "Old High Court": "13:16", "Motera Stadium": "13:34","Koteshwar Road": "13:37", GNLU: "13:52", "Info City": "14:01", Sachivalaya: "14:09", "Mahatma Mandir": "14:20", "Gift City": null },
  { APMC: "13:27", "Old High Court": "13:41", "Motera Stadium": "13:59","Koteshwar Road": "14:02", GNLU: "14:17", "Info City": "14:26", Sachivalaya: "14:34", "Mahatma Mandir": "14:45", "Gift City": null },
  { APMC: "13:50", "Old High Court": "14:04", "Motera Stadium": "14:22","Koteshwar Road": "14:25", GNLU: "14:40", "Info City": "14:49", Sachivalaya: "14:57", "Mahatma Mandir": "15:08", "Gift City": null },
  { APMC: "14:15", "Old High Court": "14:29", "Motera Stadium": "14:47","Koteshwar Road": "14:50", GNLU: "15:05", "Info City": "15:14", Sachivalaya: "15:22", "Mahatma Mandir": "15:33", "Gift City": null },
  { APMC: "14:40", "Old High Court": "14:54", "Motera Stadium": "15:12","Koteshwar Road": "15:15", GNLU: "15:30", "Info City": "15:39", Sachivalaya: "15:47", "Mahatma Mandir": "15:58", "Gift City": null },
  { APMC: "15:04", "Old High Court": "15:18", "Motera Stadium": "15:36","Koteshwar Road": "15:39", GNLU: "15:54", "Info City": "16:03", Sachivalaya: "16:11", "Mahatma Mandir": "16:22", "Gift City": null },
  { APMC: "15:16", "Old High Court": "15:30", "Motera Stadium": "15:48","Koteshwar Road": "15:51", GNLU: "16:06", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "16:12" },
  { APMC: "15:28", "Old High Court": "15:42", "Motera Stadium": "16:00","Koteshwar Road": "16:03", GNLU: "16:18", "Info City": "16:27", Sachivalaya: "16:35", "Mahatma Mandir": "16:46", "Gift City": null },
  { APMC: "15:53", "Old High Court": "16:07", "Motera Stadium": "16:25","Koteshwar Road": "16:28", GNLU: "16:43", "Info City": "16:52", Sachivalaya: "17:00", "Mahatma Mandir": "17:11", "Gift City": null },
  { APMC: "16:03", "Old High Court": "16:17", "Motera Stadium": "16:35","Koteshwar Road": "16:38", GNLU: "16:53", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "16:59" },
  { APMC: "16:17", "Old High Court": "16:31", "Motera Stadium": "16:49","Koteshwar Road": "16:52", GNLU: "17:07", "Info City": "17:16", Sachivalaya: "17:24", "Mahatma Mandir": "17:35", "Gift City": null },
  { APMC: "16:40", "Old High Court": "16:54", "Motera Stadium": "17:13","Koteshwar Road": "17:16", GNLU: "17:31", "Info City": "17:40", Sachivalaya: "17:48", "Mahatma Mandir": "17:59", "Gift City": null },
  { APMC: "17:06", "Old High Court": "17:20", "Motera Stadium": "17:38","Koteshwar Road": "17:41", GNLU: "17:56", "Info City": "18:05", Sachivalaya: "18:13", "Mahatma Mandir": "18:24", "Gift City": null },
  { APMC: "17:16", "Old High Court": "17:30", "Motera Stadium": "17:48","Koteshwar Road": "17:51", GNLU: "18:06", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "18:12" },
  { APMC: "17:30", "Old High Court": "17:44", "Motera Stadium": "18:02","Koteshwar Road": "18:05", GNLU: "18:20", "Info City": "18:29", Sachivalaya: "18:37", "Mahatma Mandir": "18:48", "Gift City": null },
  { APMC: "17:54", "Old High Court": "18:08", "Motera Stadium": "18:26","Koteshwar Road": "18:29", GNLU: "18:44", "Info City": "18:53", Sachivalaya: "19:01", "Mahatma Mandir": "19:12", "Gift City": null },
  { APMC: "18:06", "Old High Court": "18:20", "Motera Stadium": "18:39","Koteshwar Road": "18:42", GNLU: "18:57", "Info City": null,    Sachivalaya: null,    "Mahatma Mandir": null,    "Gift City": "19:03" },
  { APMC: "18:18", "Old High Court": "18:32", "Motera Stadium": "18:50","Koteshwar Road": "18:53", GNLU: "19:08", "Info City": "19:17", Sachivalaya: "19:25", "Mahatma Mandir": "19:36", "Gift City": null },
  { APMC: "18:43", "Old High Court": "18:57", "Motera Stadium": "19:15","Koteshwar Road": "19:18", GNLU: "19:33", "Info City": "19:42", Sachivalaya: "19:50", "Mahatma Mandir": "20:01", "Gift City": null },
  { APMC: "19:08", "Old High Court": "19:22", "Motera Stadium": "19:40","Koteshwar Road": "19:43", GNLU: "19:58", "Info City": "20:07", Sachivalaya: "20:15", "Mahatma Mandir": "20:26", "Gift City": null },
  { APMC: "19:42", "Old High Court": "19:56", "Motera Stadium": "20:14","Koteshwar Road": "20:17", GNLU: "20:32", "Info City": "20:41", Sachivalaya: "20:49", "Mahatma Mandir": "21:00", "Gift City": null },
  { APMC: "20:45", "Old High Court": "20:59", "Motera Stadium": "21:17","Koteshwar Road": "21:20", GNLU: "21:35", "Info City": "21:44", Sachivalaya: "21:52", "Mahatma Mandir": "22:03", "Gift City": null },
];

// Gift City → APMC (return direction)
export const GIFT_TO_APMC: TrainRow[] = [
  { "Gift City": null,    "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: null,    "Koteshwar Road": null,    "Motera Stadium": null,    "Old High Court": null,    APMC: null },
  { "Gift City": null,    "Mahatma Mandir": "07:33", Sachivalaya: "07:45", "Info City": "07:53", GNLU: "08:05", "Koteshwar Road": "08:21", "Motera Stadium": "08:24", "Old High Court": "08:42", APMC: "08:56" },
  { "Gift City": "07:48", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "07:55", "Koteshwar Road": "08:09", "Motera Stadium": "08:12", "Old High Court": "08:30", APMC: "08:44" },
  { "Gift City": null,    "Mahatma Mandir": "08:00", Sachivalaya: "08:12", "Info City": "08:19", GNLU: "08:30", "Koteshwar Road": "08:46", "Motera Stadium": "08:49", "Old High Court": "09:07", APMC: "09:21" },
  { "Gift City": "08:37", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "08:44", "Koteshwar Road": "08:58", "Motera Stadium": "09:01", "Old High Court": "09:19", APMC: "09:33" },
  { "Gift City": null,    "Mahatma Mandir": "08:25", Sachivalaya: "08:36", "Info City": "08:44", GNLU: "08:54", "Koteshwar Road": "09:10", "Motera Stadium": "09:13", "Old High Court": "09:32", APMC: "09:45" },
  { "Gift City": "09:01", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "09:08", "Koteshwar Road": "09:23", "Motera Stadium": "09:26", "Old High Court": "09:44", APMC: "09:58" },
  { "Gift City": null,    "Mahatma Mandir": "08:49", Sachivalaya: "09:00", "Info City": "09:08", GNLU: "09:18", "Koteshwar Road": "09:34", "Motera Stadium": "09:37", "Old High Court": "09:55", APMC: "10:09" },
  { "Gift City": null,    "Mahatma Mandir": "09:13", Sachivalaya: "09:25", "Info City": "09:32", GNLU: "09:43", "Koteshwar Road": "09:58", "Motera Stadium": "10:01", "Old High Court": "10:19", APMC: "10:33" },
  { "Gift City": null,    "Mahatma Mandir": "09:37", Sachivalaya: "09:49", "Info City": "09:56", GNLU: "10:07", "Koteshwar Road": "10:23", "Motera Stadium": "10:26", "Old High Court": "10:44", APMC: "10:58" },
  { "Gift City": "10:18", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "10:25", "Koteshwar Road": "10:39", "Motera Stadium": "10:42", "Old High Court": "11:00", APMC: "11:14" },
  { "Gift City": null,    "Mahatma Mandir": "10:01", Sachivalaya: "10:13", "Info City": "10:20", GNLU: "10:31", "Koteshwar Road": "10:47", "Motera Stadium": "10:50", "Old High Court": "11:08", APMC: "11:22" },
  { "Gift City": null,    "Mahatma Mandir": "10:26", Sachivalaya: "10:38", "Info City": "10:45", GNLU: "10:56", "Koteshwar Road": "11:12", "Motera Stadium": "11:15", "Old High Court": "11:33", APMC: "11:47" },
  { "Gift City": null,    "Mahatma Mandir": "10:50", Sachivalaya: "11:02", "Info City": "11:09", GNLU: "11:20", "Koteshwar Road": "11:36", "Motera Stadium": "11:39", "Old High Court": "11:57", APMC: "12:11" },
  { "Gift City": null,    "Mahatma Mandir": "11:14", Sachivalaya: "11:26", "Info City": "11:33", GNLU: "11:44", "Koteshwar Road": "12:00", "Motera Stadium": "12:03", "Old High Court": "12:21", APMC: "12:35" },
  { "Gift City": null,    "Mahatma Mandir": "11:38", Sachivalaya: "11:50", "Info City": "11:57", GNLU: "12:08", "Koteshwar Road": "12:24", "Motera Stadium": "12:27", "Old High Court": "12:45", APMC: "12:59" },
  { "Gift City": null,    "Mahatma Mandir": "12:03", Sachivalaya: "12:15", "Info City": "12:22", GNLU: "12:33", "Koteshwar Road": "12:49", "Motera Stadium": "12:52", "Old High Court": "13:10", APMC: "13:24" },
  { "Gift City": null,    "Mahatma Mandir": "12:26", Sachivalaya: "12:38", "Info City": "12:45", GNLU: "12:56", "Koteshwar Road": "13:12", "Motera Stadium": "13:15", "Old High Court": "13:33", APMC: "13:47" },
  { "Gift City": null,    "Mahatma Mandir": "12:51", Sachivalaya: "13:03", "Info City": "13:10", GNLU: "13:21", "Koteshwar Road": "13:38", "Motera Stadium": "13:41", "Old High Court": "13:59", APMC: "14:13" },
  { "Gift City": null,    "Mahatma Mandir": "13:15", Sachivalaya: "13:27", "Info City": "13:34", GNLU: "13:45", "Koteshwar Road": "14:02", "Motera Stadium": "14:05", "Old High Court": "14:23", APMC: "14:37" },
  { "Gift City": null,    "Mahatma Mandir": "13:40", Sachivalaya: "13:52", "Info City": "13:59", GNLU: "14:10", "Koteshwar Road": "14:27", "Motera Stadium": "14:30", "Old High Court": "14:48", APMC: "15:02" },
  { "Gift City": null,    "Mahatma Mandir": "14:04", Sachivalaya: "14:16", "Info City": "14:23", GNLU: "14:34", "Koteshwar Road": "14:51", "Motera Stadium": "14:54", "Old High Court": "15:12", APMC: "15:26" },
  { "Gift City": null,    "Mahatma Mandir": "14:28", Sachivalaya: "14:40", "Info City": "14:47", GNLU: "14:58", "Koteshwar Road": "15:15", "Motera Stadium": "15:18", "Old High Court": "15:36", APMC: "15:50" },
  { "Gift City": null,    "Mahatma Mandir": "14:52", Sachivalaya: "15:04", "Info City": "15:11", GNLU: "15:22", "Koteshwar Road": "15:39", "Motera Stadium": "15:42", "Old High Court": "16:00", APMC: "16:14" },
  { "Gift City": null,    "Mahatma Mandir": "15:16", Sachivalaya: "15:28", "Info City": "15:35", GNLU: "15:46", "Koteshwar Road": "16:02", "Motera Stadium": "16:05", "Old High Court": "16:23", APMC: "16:37" },
  { "Gift City": null,    "Mahatma Mandir": "15:41", Sachivalaya: "15:53", "Info City": "16:00", GNLU: "16:11", "Koteshwar Road": "16:27", "Motera Stadium": "16:30", "Old High Court": "16:48", APMC: "17:02" },
  { "Gift City": "16:17", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "16:24", "Koteshwar Road": "16:39", "Motera Stadium": "16:42", "Old High Court": "17:00", APMC: "17:14" },
  { "Gift City": null,    "Mahatma Mandir": "16:06", Sachivalaya: "16:18", "Info City": "16:25", GNLU: "16:36", "Koteshwar Road": "16:52", "Motera Stadium": "16:55", "Old High Court": "17:13", APMC: "17:27" },
  { "Gift City": null,    "Mahatma Mandir": "16:30", Sachivalaya: "16:42", "Info City": "16:49", GNLU: "17:00", "Koteshwar Road": "17:17", "Motera Stadium": "17:20", "Old High Court": "17:38", APMC: "17:52" },
  { "Gift City": "17:08", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "17:15", "Koteshwar Road": "17:30", "Motera Stadium": "17:33", "Old High Court": "17:51", APMC: "18:05" },
  { "Gift City": null,    "Mahatma Mandir": "16:54", Sachivalaya: "17:06", "Info City": "17:13", GNLU: "17:24", "Koteshwar Road": "17:41", "Motera Stadium": "17:44", "Old High Court": "18:02", APMC: "18:16" },
  { "Gift City": null,    "Mahatma Mandir": "17:19", Sachivalaya: "17:31", "Info City": "17:38", GNLU: "17:49", "Koteshwar Road": "18:06", "Motera Stadium": "18:09", "Old High Court": "18:27", APMC: "18:41" },
  { "Gift City": null,    "Mahatma Mandir": "17:44", Sachivalaya: "17:56", "Info City": "18:03", GNLU: "18:14", "Koteshwar Road": "18:31", "Motera Stadium": "18:34", "Old High Court": "18:52", APMC: "19:06" },
  { "Gift City": "18:21", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "18:28", "Koteshwar Road": "18:42", "Motera Stadium": "18:45", "Old High Court": "19:03", APMC: "19:17" },
  { "Gift City": null,    "Mahatma Mandir": "18:08", Sachivalaya: "18:20", "Info City": "18:27", GNLU: "18:38", "Koteshwar Road": "18:54", "Motera Stadium": "18:57", "Old High Court": "19:15", APMC: "19:29" },
  { "Gift City": null,    "Mahatma Mandir": "18:32", Sachivalaya: "18:44", "Info City": "18:51", GNLU: "19:02", "Koteshwar Road": "19:19", "Motera Stadium": "19:22", "Old High Court": "19:40", APMC: "19:54" },
  { "Gift City": "19:13", "Mahatma Mandir": null,    Sachivalaya: null,    "Info City": null,    GNLU: "19:20", "Koteshwar Road": "19:35", "Motera Stadium": "19:38", "Old High Court": "19:56", APMC: "20:10" },
  { "Gift City": null,    "Mahatma Mandir": "18:56", Sachivalaya: "19:09", "Info City": "19:16", GNLU: "19:27", "Koteshwar Road": "19:43", "Motera Stadium": "19:46", "Old High Court": "20:04", APMC: "20:18" },
  { "Gift City": null,    "Mahatma Mandir": "19:20", Sachivalaya: "19:32", "Info City": "19:39", GNLU: "19:50", "Koteshwar Road": "20:07", "Motera Stadium": "20:10", "Old High Court": "20:28", APMC: "20:42" },
  { "Gift City": null,    "Mahatma Mandir": "19:44", Sachivalaya: "19:56", "Info City": "20:03", GNLU: "20:14", "Koteshwar Road": "20:31", "Motera Stadium": "20:34", "Old High Court": "20:52", APMC: "21:06" },
  { "Gift City": null,    "Mahatma Mandir": "20:09", Sachivalaya: "20:21", "Info City": "20:28", GNLU: "20:39", "Koteshwar Road": "20:56", "Motera Stadium": "20:59", "Old High Court": "21:17", APMC: "21:31" },
  { "Gift City": null,    "Mahatma Mandir": "21:00", Sachivalaya: "21:12", "Info City": "21:20", GNLU: "21:31", "Koteshwar Road": "21:47", "Motera Stadium": "21:50", "Old High Court": "22:09", APMC: "22:22" },
];

/** Convert "HH:MM" to total minutes since midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Get sorted stop times at a given station for a given direction */
export function getTrainsAtStation(
  schedule: TrainRow[],
  station: Station
): { time: string; minutes: number }[] {
  return schedule
    .map(row => row[station])
    .filter((t): t is string => t !== null)
    .map(time => ({ time, minutes: timeToMinutes(time) }))
    .sort((a, b) => a.minutes - b.minutes);
}

/** Get trains that stop at BOTH from and to station, filtered by direction */
export function getTrainsBetween(
  schedule: TrainRow[],
  from: Station,
  to: Station
): { fromTime: string; toTime: string; fromMinutes: number }[] {
  return schedule
    .filter(row => row[from] !== null && row[to] !== null)
    .map(row => ({
      fromTime: row[from] as string,
      toTime: row[to] as string,
      fromMinutes: timeToMinutes(row[from] as string),
    }))
    .sort((a, b) => a.fromMinutes - b.fromMinutes);
}

/** Get the correct schedule direction table based on station order */
export function getScheduleForDirection(from: Station, to: Station): TrainRow[] {
  const fromIdx = STATIONS.indexOf(from);
  const toIdx = STATIONS.indexOf(to);
  return fromIdx <= toIdx ? APMC_TO_GIFT : GIFT_TO_APMC;
}
