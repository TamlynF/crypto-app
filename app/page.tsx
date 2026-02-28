'use client';

import { useEffect, useState } from 'react';

// Define the shape of our data so TypeScript knows what to expect
interface Coin {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
}

export default function Top20Screener() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop20() {
      try {
        // This single API call fetches the top 20 coins by market cap, 
        // including 24h and 7d percentage changes.
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h,7d'
        );
        const data = await response.json();
        setCoins(data);
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTop20();
    // Refresh every 2 minutes
    const interval = setInterval(fetchTop20, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-10 text-white text-xl">Scanning the Top 20 market...</div>;

  // Helper function to colorize positive/negative numbers
  const formatPercent = (percent: number) => {
    if (!percent) return <span className="text-gray-500">0.00%</span>;
    const isPositive = percent >= 0;
    return (
      <span className={isPositive ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
        {isPositive ? '+' : ''}{percent.toFixed(2)}%
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-4xl font-bold mb-2">Market Screener</h1>
        <p className="text-gray-400 mb-8">Compare trends across the Top 20 assets by Market Cap.</p>

        {/* The Comparison Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-gray-400 text-sm uppercase tracking-wider border-b border-gray-700">
                <th className="p-4 rounded-tl-xl">Rank</th>
                <th className="p-4">Asset</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">24h Trend</th>
                <th className="p-4 text-right">7d Trend</th>
                <th className="p-4 text-right rounded-tr-xl">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {coins.map((coin) => (
                <tr key={coin.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 text-gray-500 font-medium">#{coin.market_cap_rank}</td>
                  <td className="p-4 flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-bold">{coin.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </td>
                  <td className="p-4 text-right">
                    {formatPercent(coin.price_change_percentage_24h_in_currency)}
                  </td>
                  <td className="p-4 text-right">
                    {formatPercent(coin.price_change_percentage_7d_in_currency)}
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ${(coin.market_cap / 1_000_000_000).toFixed(2)}B
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}