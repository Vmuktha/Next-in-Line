import { useCallback, useEffect, useState } from "react";
import PipelineBoard from "../components/PipelineBoard";
import EventTimeline from "../components/EventTimeline";
import ApplicantHistory from "../components/ApplicantHistory";
import {
  fetchApplicationEvents,
  fetchApplicationHistory,
  fetchApplications,
} from "../api/api";

function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    if (!isManual) setLoading(true);

    try {
      const [applicationsData, eventsData] = await Promise.all([
        fetchApplications(),
        fetchApplicationEvents(),
      ]);

      setApplications(applicationsData);
      setEvents(
        [...eventsData].sort(
          (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
        )
      );
      setError("");
    } catch {
      setError("Unable to sync pipeline data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async (applicant) => {
    setSelectedApplicant(applicant);
    setHistoryLoading(true);
    setHistory([]);

    try {
      const historyData = await fetchApplicationHistory(applicant.id);
      setHistory(
        [...historyData].sort(
          (a, b) => new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0)
        )
      );
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl2 border border-slate-700/70 bg-panel/65 p-5 shadow-soft backdrop-blur-xl">
          <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/90">
                Next In Line
              </p>
              <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">
                Hiring Pipeline Control Surface
              </h1>
              <p className="max-w-2xl text-sm text-slate-400">
                Visualize pipeline state transitions, queue pressure, and candidate movement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh Pipeline"}
            </button>
          </header>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-400/45 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-5">
              <PipelineBoard
                applications={applications}
                loading={loading}
                onApplicantClick={loadHistory}
                selectedApplicantId={selectedApplicant?.id}
              />
              <ApplicantHistory
                applicant={selectedApplicant}
                history={history}
                loading={historyLoading}
              />
            </div>
            <EventTimeline events={events} loading={loading} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
