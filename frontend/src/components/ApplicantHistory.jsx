import { motion } from "framer-motion";

function ApplicantHistory({ applicant, history, loading }) {
  return (
    <section className="rounded-xl2 border border-slate-700/70 bg-panelSoft/70 p-4 shadow-soft backdrop-blur-xl">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">Applicant History</h2>

      {!applicant ? (
        <p className="text-sm text-slate-400">
          Click an applicant card to inspect transition history.
        </p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-400">No history found for this applicant.</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm font-semibold text-slate-200">{applicant.applicant_name}:</p>
          <p className="rounded-xl border border-slate-700/70 bg-panel/80 px-3 py-2 text-sm text-cyan-100">
            {history.map((event) => event.event_type).join(" \u2192 ")}
          </p>
        </motion.div>
      )}
    </section>
  );
}

export default ApplicantHistory;
