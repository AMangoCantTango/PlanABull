import { useState } from "react";
import { CalendarDays, List, Monitor, Star } from "lucide-react";
import { weekdays, time, meeting, type Section } from "./planner";

export const colors = [
  "#81e9aa",
  "#bcadfa",
  "#ffbe91",
  "#87c6f4",
  "#f0aaca",
  "#d6dc84",
];
export function WeeklySchedule({
  sections,
  open,
  color,
}: {
  sections: Section[];
  open: (code: string) => void;
  color: (code: string) => string;
}) {
  const [list, setList] = useState(false);
  const timed = sections.filter((s) => s.days.length);
  const first = Math.min(
    480,
    ...timed.map((s) => Math.floor(s.start / 60) * 60),
  );
  const last = Math.max(1110, ...timed.map((s) => s.end));
  const duration = last - first;
  return (
    <section className="panel week">
      <div className="panel-head">
        <div>
          <div className="kicker">TIMETABLE</div>
          <h2>Weekly schedule</h2>
        </div>
        <div className="seg">
          <button
            aria-pressed={!list}
            onClick={() => setList(false)}
            title="Week view"
          >
            <CalendarDays size={16} /> Week
          </button>
          <button
            aria-pressed={list}
            onClick={() => setList(true)}
            title="List view"
          >
            <List size={16} /> List
          </button>
        </div>
      </div>
      {!sections.length && (
        <p className="notice">
          No sections scheduled. Review your degree plan, filters, and pins.
        </p>
      )}
      {list ? (
        <div>
          {sections.map((s) => (
            <button
              className="list-row"
              key={s.crn}
              onClick={() => open(s.course)}
            >
              <i style={{ background: color(s.course) }} />
              <strong>{s.course}</strong>
              <span>{meeting(s)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid-scroll">
          <div className="grid-inner">
            <div className="day-head">
              <small>ET</small>
              {weekdays.map((d) => (
                <b key={d}>{d}</b>
              ))}
            </div>
            <div
              className="time-grid"
              style={{ height: (duration * 620) / 630 }}
            >
              {Array.from({ length: Math.ceil(duration / 60) }, (_, i) => (
                <div
                  className="guide"
                  key={i}
                  style={{ top: ((i * 60) / duration) * 100 + "%" }}
                >
                  <small>{time(first + i * 60).replace(":00", "")}</small>
                </div>
              ))}
              {weekdays.map((day, i) => (
                <div className="day" key={day}>
                  {sections
                    .filter((s) => s.days.includes(i))
                    .map((s) => (
                      <button
                        key={s.crn}
                        onClick={() => open(s.course)}
                        className="event"
                        style={{
                          top: ((s.start - first) / duration) * 100 + "%",
                          height: ((s.end - s.start) / duration) * 100 + "%",
                          background: color(s.course),
                        }}
                        title={
                          s.course + " · " + meeting(s) + " · " + s.professor
                        }
                      >
                        <b>{s.course}</b>
                        <span>
                          {time(s.start)} · {s.number}
                        </span>
                        <span>{s.professor}</span>
                        <small>
                          #{s.crn} <Star size={9} />
                          {s.rmp?.toFixed(1) ?? "Unrated"}
                        </small>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {sections.some((s) => !s.days.length) && (
        <div className="async">
          <Monitor size={16} /> Online / async{" "}
          {sections
            .filter((s) => !s.days.length)
            .map((s) => (
              <button key={s.crn} onClick={() => open(s.course)}>
                {s.course} · {s.number}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
