import { AnimatePresence, motion } from "framer-motion";
import ApplicantCard from "./ApplicantCard";

function Column({ title, list, accent, onApplicantClick, selectedApplicantId }) {
  return (
    <section className="flex min-h-[360px] flex-1 flex-col rounded-xl2 border border-slate-700/70 bg-panel/80 p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200/90">
          {title}
        </h2>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${accent}`}>
          {list.length}
        </span>
      </div>

      <motion.div layout className="flex flex-1 flex-col gap-3">
        {list.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-700/80 text-xs text-slate-400">
            No applicants
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {list.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                onClick={onApplicantClick}
                isSelected={selectedApplicantId === applicant.id}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </section>
  );
}

export default Column;
