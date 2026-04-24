import { motion } from "framer-motion";

const statusStyles = {
  ACTIVE:
    "border-emerald-300/90 bg-emerald-500/12 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.25)]",
  WAITLIST: "border-slate-400/80 bg-slate-500/10 text-slate-100",
  PENDING_ACK: "border-amber-400/90 bg-amber-500/10 text-amber-100",
  EXITED: "border-red-400/90 bg-red-500/10 text-red-100",
};

function ApplicantCard({ applicant, onClick, isSelected }) {
  return (
    <motion.button
      layout
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.012 }}
      transition={{ duration: 0.22 }}
      onClick={() => onClick?.(applicant)}
      className={`w-full rounded-xl2 border px-3 py-3 text-left shadow-soft backdrop-blur-sm transition-all duration-200 hover:shadow-[0_16px_35px_rgba(0,0,0,0.45)] ${
        isSelected ? "ring-1 ring-cyan-300/70" : ""
      } ${statusStyles[applicant.status] || "border-slate-500/70 bg-slate-600/10 text-slate-100"}`}
    >
      <p className="truncate text-sm font-semibold">{applicant.applicant_name}</p>
      <p className="mt-1 text-xs tracking-wide text-slate-200/80">{applicant.status}</p>
    </motion.button>
  );
}

export default ApplicantCard;
