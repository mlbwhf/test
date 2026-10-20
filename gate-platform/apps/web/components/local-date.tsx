"use client";

import { useEffect, useState } from "react";

/** Today's date in the viewer's own time zone (the server doesn't know it). */
export function LocalDate() {
  const [text, setText] = useState("");
  useEffect(() => setText(new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())), []);
  return <span className="today-date">{text}</span>;
}
