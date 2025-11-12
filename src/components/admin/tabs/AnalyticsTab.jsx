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
          supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', sinceIso),
          supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', sinceIso).eq('name', 'add_to_cart'),
          supabase.from('orders').select('total_amount, created_at').gte('created_at', sinceIso),
          supabase
            .from('analytics_sessions')
            .select('visitor_id', { count: 'exact' })
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
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
              .select('id, created_at')
              .in('id', chunk);
            if (data?.length) {
              visitorRecords.push(...data);
            }
          } catch (err) {
            console.warn('[analytics] visitor chunk load failed', err);
          }
        }

        const sinceTime = sinceDate.getTime();
        newVisitors = visitorRecords.filter((r) => new Date(r.created_at).getTime() >= sinceTime)
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
        <Card title="Events (7d)" value={cards.events7d} loading={loading} />
        <Card title="Add to cart (7d)" value={cards.addToCart7d} loading={loading} />
        <Card title="Comenzi (7d)" value={cards.orders7d} loading={loading} />
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
          <h3 className="text-lg font-semibold">Observații</h3>
          <p className="text-sm text-gray-600">
            Vizualizezi visitorii care au activat sesiuni în ultimele {DAYS_WINDOW} zile. Următorul pas este integrarea funnel-urilor, surselor UTM și segmentelor B2B/B2C pentru a evalua conversiile clienților noi versus cei vechi.
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <span className="font-semibold">{visitorBreakdown.totalVisitors7d || '0'}</span> vizitatori unici
            </li>
            <li>
              <span className="font-semibold">{visitorBreakdown.sessionCount7d || '0'}</span> sesiuni monitorizate
            </li>
            <li>
              {visitorBreakdown.newVisitors7d === 0 && visitorBreakdown.returningVisitors7d === 0
                ? 'Încă nu există date suficiente'
                : `${visitorBreakdown.newVisitors7d} + ${visitorBreakdown.returningVisitors7d} = ${
                    visitorBreakdown.totalVisitors7d
                  } vizitatori` }
            </li>
          </ul>
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
