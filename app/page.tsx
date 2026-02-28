'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartDataPoint {
  timestamp: number;
  time: string;
  price: number;
}

export default function CryptoDashboard() {
  const [data, setData] = useState({ price: 0, change24h: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const coinId = 'bitcoin';

  useEffect(() => {
    async function trackAndFetchData() {
      try {
        // 1. Fetch live data from CoinGecko
        const priceRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
        );
        const priceJson = await priceRes.json();
        
        const currentPrice = priceJson[coinId].usd;
        const currentChange = priceJson[coinId].usd_24h_change;

        setData({ price: currentPrice, change24h: currentChange });

        // 2. Save this data point to your Supabase Cloud Database
        await supabase
          .from('price_history')
          .insert([
            { coin_id: coinId, price: currentPrice, change_24h: currentChange }
          ]);

        // 3. Read your historical data back from Supabase for the chart
        const { data: historyData, error } = await supabase
          .from('price_history')
          .select('price, created_at')
          .eq('coin_id', coinId)
          .order('created_at', { ascending: true })
          .limit(50); // Get the last 50 data points

        if (historyData) {
          const formattedChart = historyData.map((row) => ({
  timestamp: new Date(row.created_at).getTime(),
  time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  price: Number(row.price),
}));
setChartData(formattedChart);
        }

      } catch (error) {
        console.error("Error with database flow:", error);
      } finally {
        setLoading(false);
      }
    }

    trackAndFetchData();
    
    // Log new data to the cloud every 5 minutes (300,000 ms)
    const interval = setInterval(trackAndFetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-10 text-white">Syncing with Cloud Database...</div>;

  const isPositive = data.change24h >= 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">My Cloud Crypto Pulse</h1>
        <p className="text-gray-400 mb-8">Data securely stored in Supabase</p>

        {/* KPI Display */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-gray-400 text-sm uppercase">Current {coinId} Price</h2>
             <p className="text-4xl font-semibold mt-1">${data.price.toLocaleString()}</p>
           </div>
           <div className="text-right">
             <h2 className="text-gray-400 text-sm uppercase">24h Trend</h2>
             <p className={`text-2xl font-semibold mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
               {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
             </p>
           </div>
        </div>

        {/* Interactive Chart */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg h-96">
          <h2 className="text-xl font-semibold mb-6">Your Logged History</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', color: '#fff' }} />
              <Line type="stepAfter" dataKey="price" stroke="#a855f7" strokeWidth={3} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}