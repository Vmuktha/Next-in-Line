import { useMemo } from "react";
import Column from "./Column";

function PipelineBoard({ applications, loading, onApplicantClick, selectedApplicantId }) {
  const grouped = useMemo(() => {
    const groupedLists = applications.reduce(
      (acc, app) => {
        if (acc[app.status]) acc[app.status].push(app);
        return acc;
      },
      { ACTIVE: [], WAITLIST: [], PENDING_ACK: [] }
    );

    Object.keys(groupedLists).forEach((statusKey) => {
      groupedLists[statusKey].sort((a, b) => {
        const priorityDiff = (a.priority_score ?? 0) - (b.priority_score ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.applied_at ?? 0) - new Date(b.applied_at ?? 0);
      });
    });

    return groupedLists;
  }, [applications]);

  return (
    <div className="rounded-xl2 border border-slate-700/70 bg-panelSoft/70 p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-100">Pipeline Board</h1>
        <span className="text-xs text-slate-400">
          {loading ? "Syncing..." : `${applications.length} applicants`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Column
          title="Active"
          list={grouped.ACTIVE}
          accent="bg-emerald-500/20 text-emerald-200"
          onApplicantClick={onApplicantClick}
          selectedApplicantId={selectedApplicantId}
        />
        <Column
          title="Pending Ack"
          list={grouped.PENDING_ACK}
          accent="bg-amber-500/20 text-amber-200"
          onApplicantClick={onApplicantClick}
          selectedApplicantId={selectedApplicantId}
        />
        <Column
          title="Waitlist"
          list={grouped.WAITLIST}
          accent="bg-slate-500/20 text-slate-200"
          onApplicantClick={onApplicantClick}
          selectedApplicantId={selectedApplicantId}
        />
      </div>
    </div>
  );
}

export default PipelineBoard;
