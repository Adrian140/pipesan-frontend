import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Warehouse, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "../../config/supabase";

// Stocul vine automat din depozitul Prep Center (la 15 minute, prin Edge Function-ul prepcenter-sync).
export default function PrepCenterSyncPanel({ onSynced }) {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const loadRuns = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("pipesan_prepcenter_sync_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);
    if (!e) setRuns(data || []);
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const syncNow = async () => {
    setRunning(true);
    setError("");
    try {
      const { data, error: e } = await supabase.functions.invoke("prepcenter-sync", { body: {} });
      if (e) {
        let msg = e.message;
        try { const b = await e.context.json(); msg = b.detail || b.error || msg; } catch { /* corp gol */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.detail || data.error);
      await loadRuns();
      onSynced?.();
    } catch (e) {
      setError(e.message || "Sincronizarea a eșuat");
      await loadRuns();
    } finally {
      setRunning(false);
    }
  };

  const last = runs[0];
  const lastOk = runs.find((r) => r.status === "success");
  const fmt = (d) => (d ? new Date(d).toLocaleString("ro-RO") : "—");

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-graphite-900 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-brass-light" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Stoc din depozitul Prep Center</h3>
            <p className="text-sm text-gray-500">
              Se actualizează automat la fiecare 15 minute. Produsele care nu sunt în depozit au stoc 0.
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Ultima sincronizare reușită: <strong>{fmt(lastOk?.finished_at)}</strong>
              {lastOk && (
                <span className="text-gray-500">
                  {" "}· {lastOk.pipesan_rows ?? 0} rânduri PipeSan în depozit, {lastOk.matched ?? 0} produse potrivite,{" "}
                  {lastOk.updated ?? 0} actualizate, {lastOk.created_drafts ?? 0} ciorne noi
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={syncNow}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-graphite-900 text-white hover:bg-primary disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Se sincronizează…" : "Sincronizează acum"}
        </button>
      </div>

      {(error || last?.status === "error") && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error || last.error}</span>
        </div>
      )}

      {runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left py-1 pr-4">Pornită</th>
                <th className="text-left py-1 pr-4">Sursă</th>
                <th className="text-left py-1 pr-4">Stare</th>
                <th className="text-left py-1 pr-4">Potrivite</th>
                <th className="text-left py-1 pr-4">Actualizate</th>
                <th className="text-left py-1">Ciorne noi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-1.5 pr-4">{fmt(r.started_at)}</td>
                  <td className="py-1.5 pr-4">{r.trigger === "admin" ? "Manual" : "Automat"}</td>
                  <td className="py-1.5 pr-4">
                    {r.status === "success" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="w-3.5 h-3.5" />OK</span>
                    ) : r.status === "error" ? (
                      <span className="text-red-600" title={r.error || ""}>Eroare</span>
                    ) : (
                      <span className="text-gray-500">În curs</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-4">{r.matched ?? "—"}</td>
                  <td className="py-1.5 pr-4">{r.updated ?? "—"}</td>
                  <td className="py-1.5">{r.created_drafts ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
