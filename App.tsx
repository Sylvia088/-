
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { analyzeStock } from './services/geminiService.ts';
import { AnalysisResponse } from './types.ts';
import VolumeChart from './components/VolumeChart.tsx';
import ComparisonChart from './components/ComparisonChart.tsx';

type SortKey = 'ticker' | 'close' | 'change' | 'rsi';

interface IndicatorItemProps {
  label: string;
  value: string;
  color?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const IndicatorItem: React.FC<IndicatorItemProps> = ({ label, value, color, icon, trend }) => (
  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-md h-full justify-center">
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1 justify-center w-full">
      {icon && <i className={`fas ${icon} text-[10px] opacity-70`}></i>}
      {label}
    </div>
    <div className={`text-sm font-black flex items-center gap-1 ${color || 'text-slate-900'}`}>
      {trend === 'up' && <i className="fas fa-caret-up text-[10px]"></i>}
      {trend === 'down' && <i className="fas fa-caret-down text-[10px]"></i>}
      {value}
    </div>
  </div>
);

interface SmallMetricItemProps {
  label: string;
  value: number;
  currency: string;
  color?: string;
  icon?: string;
  iconColor?: string;
}

const SmallMetricItem: React.FC<SmallMetricItemProps> = ({ label, value, currency, color, icon, iconColor }) => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:border-blue-100 group">
    {icon && (
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor || 'bg-slate-50 text-slate-500'} text-sm border border-slate-50 group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon}`}></i>
      </div>
    )}
    <div className="flex flex-col">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-black ${color || 'text-slate-800'}`}>
        <span className="text-[10px] font-normal text-slate-400 mr-1">{currency}</span>
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('ticker');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tickerInput.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const tickers = tickerInput
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (tickers.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const promises = tickers.map(ticker => analyzeStock(ticker));
      const responses = await Promise.all(promises);
      setResults(responses);
    } catch (err: any) {
      console.error(err);
      setError("獲取股票數據時發生錯誤。請確認代號是否正確。");
    } finally {
      setLoading(false);
    }
  }, [tickerInput]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let valA: any, valB: any;
      switch (sortBy) {
        case 'ticker':
          valA = a.data.ticker;
          valB = b.data.ticker;
          break;
        case 'close':
          valA = a.data.previousDay.close;
          valB = b.data.previousDay.close;
          break;
        case 'change':
          valA = a.data.priceChangePercent;
          valB = b.data.priceChangePercent;
          break;
        case 'rsi':
          valA = a.data.rsi;
          valB = b.data.rsi;
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortBy, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const isComparison = results.length > 1;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <i className="fas fa-chart-line"></i>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">StockScope</span>
          </div>
          <div className="hidden md:block text-sm text-slate-500 font-medium">
            AI 驅動的技術指標與多股分析
          </div>
        </div>
      </nav>

      <div className="bg-blue-600 py-12 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            專業技術指標對比
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            輸入代號獲取 RSI、MA20 及市場數據。支援多股同時分析與排序。
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <input
              type="text"
              className="w-full bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-blue-400 rounded-2xl px-6 py-4 text-slate-800 shadow-xl transition-all outline-none pr-36"
              placeholder="例如：AAPL, TSLA, 2330.TW"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-chart-simple"></i>}
              {loading ? '計算中...' : '開始分析'}
            </button>
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 mb-6">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-blue-100 rounded-full mb-4 flex items-center justify-center text-blue-600 text-2xl">
              <i className="fas fa-microchip fa-spin"></i>
            </div>
            <div className="h-4 w-48 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-slate-100 rounded text-slate-400 text-xs text-center">正在計算技術指標...</div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-8">
            {isComparison && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fas fa-sort-amount-down text-blue-600"></i>
                    數據對比與排序
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    排序依據：
                    <button onClick={() => toggleSort('ticker')} className={`px-3 py-1 rounded-full border ${sortBy === 'ticker' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}>
                      代號 {sortBy === 'ticker' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => toggleSort('change')} className={`px-3 py-1 rounded-full border ${sortBy === 'change' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}>
                      漲跌幅 {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => toggleSort('rsi')} className={`px-3 py-1 rounded-full border ${sortBy === 'rsi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}>
                      RSI {sortBy === 'rsi' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-6 py-4">股票</th>
                        <th className="px-6 py-4">收盤價</th>
                        <th className="px-6 py-4">漲跌幅</th>
                        <th className="px-6 py-4">RSI (14)</th>
                        <th className="px-6 py-4">MA20</th>
                        <th className="px-6 py-4">市值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedResults.map((res) => (
                        <tr key={res.data.ticker} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{res.data.ticker}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[120px]">{res.data.name}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">{res.data.previousDay.close.toLocaleString()}</td>
                          <td className={`px-6 py-4 font-bold ${res.data.priceChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {res.data.priceChangePercent > 0 ? '+' : ''}{res.data.priceChangePercent}%
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded font-bold text-xs ${res.data.rsi > 70 ? 'bg-rose-100 text-rose-700' : res.data.rsi < 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {res.data.rsi.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">{res.data.ma20.toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{res.data.marketCap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isComparison && <ComparisonChart stocks={results} />}

            <div className={`grid grid-cols-1 ${results.length === 1 ? '' : 'lg:grid-cols-2'} gap-8`}>
              {results.map((res) => {
                const buyAvg = res.data.previousDay.buyAverage || 0;
                const sellAvg = res.data.previousDay.sellAverage || 0;
                const spread = sellAvg - buyAvg;
                const spreadTrend = spread > 0 ? 'up' : spread < 0 ? 'down' : 'neutral';

                return (
                  <div key={res.data.ticker} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-sm">{res.data.ticker}</span>
                          <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">{res.data.name}</h2>
                            <p className="text-[10px] text-slate-400 font-medium">市值: {res.data.marketCap}</p>
                          </div>
                        </div>
                        <div className={`text-right ${res.data.priceChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <div className="text-lg font-black">{res.data.priceChangePercent > 0 ? '+' : ''}{res.data.priceChangePercent}%</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">24H 漲跌</div>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-slate-50 bg-slate-50/20">
                         <IndicatorItem label="RSI(14)" value={res.data.rsi.toFixed(1)} icon="fa-gauge-high" color={res.data.rsi > 70 ? 'text-rose-600' : res.data.rsi < 30 ? 'text-emerald-600' : 'text-blue-600'} />
                         <IndicatorItem label="MA20" value={res.data.ma20.toLocaleString()} icon="fa-chart-line" color="text-indigo-600" />
                         <IndicatorItem label="買入平均" value={buyAvg.toLocaleString()} icon="fa-cart-shopping" color="text-emerald-700" />
                         <IndicatorItem label="賣出平均" value={sellAvg.toLocaleString()} icon="fa-shop" color="text-rose-700" />
                         <IndicatorItem 
                            label="Spread (價差)" 
                            value={Math.abs(spread).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                            icon="fa-arrows-left-right" 
                            color={spread >= 0 ? 'text-blue-600' : 'text-orange-600'}
                            trend={spreadTrend}
                         />
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-4">
                        <SmallMetricItem 
                          label="開盤價" 
                          value={res.data.previousDay.open} 
                          currency={res.data.currency} 
                          icon="fa-door-open" 
                          iconColor="bg-blue-50 text-blue-600"
                        />
                        <SmallMetricItem 
                          label="收盤價" 
                          value={res.data.previousDay.close} 
                          currency={res.data.currency} 
                          icon="fa-flag-checkered" 
                          iconColor="bg-slate-100 text-slate-700"
                        />
                        <SmallMetricItem 
                          label="最高價" 
                          value={res.data.previousDay.high} 
                          currency={res.data.currency} 
                          color="text-emerald-600" 
                          icon="fa-arrow-trend-up" 
                          iconColor="bg-emerald-50 text-emerald-600"
                        />
                        <SmallMetricItem 
                          label="最低價" 
                          value={res.data.previousDay.low} 
                          currency={res.data.currency} 
                          color="text-rose-600" 
                          icon="fa-arrow-trend-down" 
                          iconColor="bg-rose-50 text-rose-600"
                        />
                      </div>

                      {res.sources.length > 0 && (
                        <div className="p-5 border-t border-slate-100 bg-white">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <i className="fas fa-search text-blue-500"></i> Google 搜尋來源
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {res.sources.slice(0, 4).map((source, si) => (
                              <a key={si} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 bg-slate-50 text-slate-500 rounded border border-slate-100 hover:text-blue-600 hover:border-blue-200 transition-colors truncate max-w-[150px]">
                                {source.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isComparison && results.length === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <VolumeChart data={results[0].data.volumeHistory} />
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie text-blue-600"></i>
                    指標說明
                  </h3>
                  <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                    <p>• <span className="font-bold text-blue-600">Spread (價差)</span>: 買入平均價與賣出平均價的差距。正值代表賣價高於買價，負值則暗示可能的套利空間或數據異常。</p>
                    <p>• <span className="font-bold text-blue-600">RSI (相對強弱指數)</span>: 衡量超買(>70)或超賣(&lt;30)的動量指標。</p>
                    <p>• <span className="font-bold text-indigo-600">MA20 (20日均線)</span>: 衡量中期趨勢，價格在均線之上通常代表強勢。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="relative mb-6">
               <i className="fas fa-magnifying-glass-chart text-7xl opacity-10"></i>
            </div>
            <p className="text-lg font-medium text-slate-600">請輸入股票代號開始深度分析</p>
            <p className="text-sm text-center mt-2 max-w-sm">我們將利用 Google 搜尋與技術分析，為您計算 RSI、均線、成交量與買賣價差指標。</p>
          </div>
        )}
      </main>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform z-50 hover:bg-blue-700 hover:scale-110 active:scale-95 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
        aria-label="Back to Top"
      >
        <i className="fas fa-chevron-up text-xl"></i>
      </button>

      <footer className="mt-12 py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} StockScope 股市分析工具。由 Gemini 3.0 提供即時搜尋與技術分析支持。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
