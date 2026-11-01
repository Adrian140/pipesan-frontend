import React, { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';

const DAYS_WINDOW = 7;

const emptyVisitorBreakdown = {
  totalVisitors7d: 0,
  newVisitors7d: 0,
  returningVisitors7d: 0,
  returningPct: 0,
  sessionCount7d: 0,
  avgSessionsPerVisitor: 0
};

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({
    pageviews7d: 0,
    events7d: 0,
    addToCart7d: 0,
    orders7d: 0,
    revenue7d: 0
  });
  const [visitorBreakdown, setVisitorBreakdown] = useState(() => ({ ...emptyVisitorBreakdown }));
  const [recentVisits, setRecentVisits] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [consents, setConsents] = useState({ accepted: 0, rejected: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sinceDate = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000);
      const sinceIso = sinceDate.toISOString();
      try {
        const [
          pageviewsRes,
          eventsRes,
          addToCartRes,
          ordersRes,
          sessionsRes
        ] = await Promise.all([
          supabase.from('analytics_pageviews').select('id', { count: 'exact', head: true }).gte('ts', sinceIso),
          supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', sinceIso).neq('name', 'page_view'),
          supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', sinceIso).eq('name', 'add_to_cart'),
          supabase.from('orders').select('total_amount, created_at').gte('created_at', sinceIso).eq('payment_status', 'paid'),
          supabase
            .from('analytics_sessions')
            .select('visitor_id', { count: 'exact' })
            .gte('started_at', sinceIso)
            .order('started_at', { ascending: false })
            .limit(1000)
        ]);

        const revenue = (ordersRes?.data || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        setCards({
          pageviews7d: pageviewsRes?.count || 0,
          events7d: eventsRes?.count || 0,
          addToCart7d: addToCartRes?.count || 0,
          orders7d: (ordersRes?.data || []).length,
          revenue7d: revenue
        });

        await hydrateVisitorBreakdown(sinceDate, sessionsRes);

        const [recentRes, pagesRes, consentRes] = await Promise.all([
          supabase
            .from('analytics_pageviews')
            .select('id, ts, path, visitor_id, analytics_sessions(landing_utm_source, device)')
            .order('ts', { ascending: false })
            .limit(25),
          supabase.from('analytics_pageviews').select('path').gte('ts', sinceIso).limit(5000),
          supabase.from('pipesan_cookie_consents').select('analytics').gte('created_at', sinceIso).limit(5000),
        ]);
        setRecentVisits(recentRes?.data || []);
        const counts = {};
        for (const { path } of pagesRes?.data || []) {
          const clean = String(path || '').split('?')[0] || '/';
          counts[clean] = (counts[clean] || 0) + 1;
        }
        setTopPages(Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 8));
        const rows = consentRes?.data || [];
        setConsents({ accepted: rows.filter((r) => r.analytics).length, rejected: rows.filter((r) => !r.analytics).length });
      } catch (error) {
        console.error('[analytics] failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };

    const hydrateVisitorBreakdown = async (sinceDate, sessionsRes) => {
      if (!sessionsRes) {
        setVisitorBreakdown({ ...emptyVisitorBreakdown });
        return;
      }

      const sessionRows = sessionsRes.data || [];
      const sessionCount = sessionsRes.count || sessionRows.length;
      const uniqueVisitorIds = Array.from(
        new Set(sessionRows.map((row) => row.visitor_id).filter(Boolean))
      );

      let newVisitors = 0;
      if (uniqueVisitorIds.length > 0) {
        const chunkSize = 100;
        const visitorRecords = [];
        for (let i = 0; i < uniqueVisitorIds.length; i += chunkSize) {
          const chunk = uniqueVisitorIds.slice(i, i + chunkSize);
          try {
            const { data } = await supabase
              .from('analytics_visitors')
              .select('id, first_seen_at')
              .in('id', chunk);
            if (data?.length) {
              visitorRecords.push(...data);
            }
          } catch (err) {
            console.warn('[analytics] visitor chunk load failed', err);
          }
        }

        const sinceTime = sinceDate.getTime();
        newVisitors = visitorRecords.filter((r) => new Date(r.first_seen_at).getTime() >= sinceTime)
          .length;
      }

      const totalVisitors = uniqueVisitorIds.length;
      const returningVisitors = Math.max(totalVisitors - newVisitors, 0);
      const returningPct = totalVisitors ? Math.round((returningVisitors / totalVisitors) * 100) : 0;
      const avgSessions =
        totalVisitors > 0 ? Number((sessionCount / totalVisitors).toFixed(1)) : 0;

      setVisitorBreakdown({
        totalVisitors7d: totalVisitors,
        newVisitors7d: newVisitors,
        returningVisitors7d: returningVisitors,
        returningPct,
        sessionCount7d: sessionCount,
        avgSessionsPerVisitor: avgSessions
      });
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Pageviews (7d)" value={cards.pageviews7d} loading={loading} />
        <Card title="Evenimente (7d, fără pageviews)" value={cards.events7d} loading={loading} />
        <Card title="Add to cart (7d)" value={cards.addToCart7d} loading={loading} />
        <Card title="Comenzi plătite (7d)" value={cards.orders7d} loading={loading} />
        <Card title="Venit (7d)" value={`${cards.revenue7d.toFixed(2)} EUR`} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border rounded-xl p-6 space-y-3 shadow-sm">
          <div>
            <div className="text-sm text-gray-500">Vizitatori unici (ultimele {DAYS_WINDOW} zile)</div>
            <div className="text-4xl font-semibold mt-1">
              {loading ? '…' : visitorBreakdown.totalVisitors7d}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-gray-400">noi</div>
              <div className="text-lg font-semibold text-primary">
                {loading ? '…' : visitorBreakdown.newVisitors7d}
              </div>
              <div className="text-gray-400">
                <span>
                  {loading ? '…' : visitorBreakdown.sessionCount7d} sesiuni
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-gray-400">reveniți</div>
              <div className="text-lg font-semibold text-text-secondary">
                {loading ? '…' : visitorBreakdown.returningVisitors7d}
              </div>
              <div className="text-gray-400">
                {loading
                  ? '…'
                  : `${visitorBreakdown.returningPct}% din total`}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${visitorBreakdown.returningPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {loading
              ? '…'
              : `Media ${visitorBreakdown.avgSessionsPerVisitor} sesiuni per vizitator`}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 space-y-3 shadow-sm">
          <h3 className="text-lg font-semibold">Consimțământ cookie-uri ({DAYS_WINDOW} zile)</h3>
          <p className="text-sm text-gray-600">
            Vizitele se măsoară doar pentru cei care acceptă „Măsurarea audienței” în bannerul de cookie-uri.
            Cei care refuză nu apar în statistici.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">au acceptat</div>
              <div className="text-2xl font-semibold text-emerald-700">{loading ? '…' : consents.accepted}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">au refuzat</div>
              <div className="text-2xl font-semibold text-gray-500">{loading ? '…' : consents.rejected}</div>
            </div>
          </div>
          {consents.accepted + consents.rejected > 0 && (
            <div className="text-xs text-gray-500">
              Rată de acceptare: {Math.round((consents.accepted / (consents.accepted + consents.rejected)) * 100)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Ultimele vizite</h3>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-gray-500">{loading ? '…' : 'Nicio vizită înregistrată încă.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 text-xs">
                  <tr>
                    <th className="py-1 pr-4">Când</th>
                    <th className="py-1 pr-4">Pagina</th>
                    <th className="py-1 pr-4">Sursa</th>
                    <th className="py-1 pr-4">Dispozitiv</th>
                    <th className="py-1">Vizitator</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentVisits.map((v) => (
                    <tr key={v.id}>
                      <td className="py-1.5 pr-4 whitespace-nowrap">{new Date(v.ts).toLocaleString('ro-RO')}</td>
                      <td className="py-1.5 pr-4 font-mono text-xs break-all">{v.path}</td>
                      <td className="py-1.5 pr-4">{v.analytics_sessions?.landing_utm_source || 'direct'}</td>
                      <td className="py-1.5 pr-4">{v.analytics_sessions?.device || '—'}</td>
                      <td className="py-1.5 font-mono text-xs text-gray-400">{String(v.visitor_id || '').slice(0, 8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Pagini populare ({DAYS_WINDOW} zile)</h3>
          {topPages.length === 0 ? (
            <p className="text-sm text-gray-500">{loading ? '…' : 'Încă nu există date.'}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topPages.map(([path, count]) => (
                <li key={path} className="flex justify-between gap-3">
                  <span className="font-mono text-xs break-all">{path}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, loading }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{loading ? '…' : value}</div>
    </div>
  );
}
