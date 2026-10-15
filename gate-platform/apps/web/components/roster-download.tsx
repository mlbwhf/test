"use client";

// "Download CSV" link with a format picker. The chosen format is carried in
// the link's `?format=` query, which the roster route handler forwards to the
// API. Labels are passed in from the server so this module stays free of the
// server-only API client.

import { useState } from "react";

export type RosterFormatOption = { value: string; label: string };

type Props = {
  /** Path of the roster route handler, e.g. "/events/evt_1/roster.csv". */
  href: string;
  formats: RosterFormatOption[];
  defaultFormat: string;
};

export function RosterDownload({ href, formats, defaultFormat }: Props) {
  const [format, setFormat] = useState(defaultFormat);
  const downloadHref = `${href}?format=${encodeURIComponent(format)}`;

  return (
    <>
      <label className="label-inline">
        Format
        <select name="format" value={format} onChange={(e) => setFormat(e.target.value)}>
          {formats.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <a href={downloadHref} download>
        Download CSV
      </a>
    </>
  );
}
