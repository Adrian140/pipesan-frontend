import React, { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({
    pageviews7d: 0,
    events7d: 0,
    addToCart7d: 0,
    orders7d: 0,
    revenue7d: 0
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const since = new Date(Date.now() - 7*24*60*60*1000).toISOString();

        const [{ count: pv }, { count: ev }, { count: atc }, { data: orders }] =
          await Promise.all([
            supabase.from('analytics_pageviews').select('id', { count: 'exact', head: true }).gte('ts', since),
            supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', since),
            supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('ts', since).eq('name','add_to_cart'),
            supabase.from('orders').select('total_amount, created_at').gte('created_at', since)
          ]);

        const revenue = (orders || []).reduce((s, o)=> s + Number(o.total_amount||0), 0);

        setCards({
          pageviews7d: pv || 0,
          events7d: ev || 0,
          addToCart7d: atc || 0,
          orders7d: (orders || []).length,
          revenue7d: revenue
        });
      } finally {
        setLoading(false);
      }
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

      <div className="bg-white border rounded-xl p-6">
        <p className="text-gray-600">
          MVP gata. Următorul pas: funnels, surse UTM, top produse, cohorte.
        </p>
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
