import { motion } from "framer-motion";

const formatRelative = (value) => {
  if (!value) return "just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

function EventItem({ event, index }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="relative rounded-xl2 border border-slate-700/80 bg-panel/85 p-3 shadow-soft"
    >
      <div className="mb-1 text-xs text-slate-400">
        {formatRelative(event.created_at || event.timestamp)}
      </div>
      <div className="text-sm font-medium text-slate-100">
        {event.applicant_name || event.name || "Unknown"}{" "}
        <span className="text-slate-500">→</span> {event.event_type || event.type}
      </div>
    </motion.div>
  );
}

export default EventItem;
