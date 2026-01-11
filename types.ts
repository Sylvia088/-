
export interface StockVolumeData {
  label: string; // e.g., "1月", "2月"
  volume: number;
}

export interface StockMetrics {
  ticker: string;
  name: string;
  currency: string;
  marketCap: string; // 市值描述，如 "3.2T USD"
  priceChangePercent: number; // 漲跌幅百分比
  rsi: number; // 相對強弱指數 RSI(14)
  ma20: number; // 20日移動平均線
  previousDay: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    average: number;
    bidHigh?: number;
    askLow?: number;
    buyAverage?: number;
    sellAverage?: number;
  };
  volumeHistory: StockVolumeData[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResponse {
  data: StockMetrics;
  sources: GroundingSource[];
}

export interface ComparisonData {
  stocks: AnalysisResponse[];
}
