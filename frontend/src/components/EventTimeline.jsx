import EventItem from "./EventItem";
import { AnimatePresence } from "framer-motion";

function EventTimeline({ events, loading }) {
  const recentEvents = [...events].slice(0, 20);

  return (
    <aside className="rounded-xl2 border border-slate-700/70 bg-panelSoft/75 p-4 shadow-soft backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Event Timeline</h2>
        <span className="text-xs text-slate-400">{loading ? "Syncing..." : `${recentEvents.length} events`}</span>
      </div>

      {recentEvents.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-700/80 px-4 py-10 text-center text-sm text-slate-400">
          No events available.
        </div>
      ) : (
        <div className="relative space-y-3 pl-4 before:absolute before:bottom-0 before:left-1 before:top-1 before:w-px before:bg-slate-700">
          <AnimatePresence mode="popLayout">
            {recentEvents.map((event, index) => (
              <div key={event.id ?? `${event.event_type}-${index}`} className="relative">
                <span className="absolute -left-[14px] top-4 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                <EventItem event={event} index={index} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </aside>
  );
}

export default EventTimeline;
