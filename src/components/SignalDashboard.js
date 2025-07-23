"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import styles from "./SignalDashboard.module.css";

// Tooltip bileşeni
const InfoTooltip = ({ title, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={styles.tooltipContainer}>
      <button
        className={styles.infoButton}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={title}
      >
        ?
      </button>
      {showTooltip && (
        <div className={styles.tooltip}>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

const SignalDashboard = () => {
  const [signalData, setSignalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API'den veri çekme fonksiyonu
  const fetchSignalData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/signals");
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        // Veriyi grafik için formatlama
        const formattedData = data.data.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp).toLocaleString("tr-TR"),
          price: parseFloat(item.price),
          rsi: parseFloat(item.rsi),
          macd: parseFloat(item.macd),
          ml_confidence: parseFloat(item.ml_confidence) * 100,
          sma_short: parseFloat(item.sma_short),
          sma_long: parseFloat(item.sma_long),
          bollinger_upper: parseFloat(item.bollinger_upper),
          bollinger_lower: parseFloat(item.bollinger_lower),
          stochastic_k: parseFloat(item.stochastic_k),
          stochastic_d: parseFloat(item.stochastic_d),
          adx: parseFloat(item.adx),
          atr: parseFloat(item.atr),
          volume_multiplier: parseFloat(item.volume_multiplier),
          buy_sell_ratio: parseFloat(item.buy_sell_ratio),
          crypto_vix: parseFloat(item.crypto_vix),
          signal_strength:
            item.signal === 1 ? "AL" : item.signal === 0 ? "SAT" : "BEKLE",
          trend_color:
            item.trend_1h === 1
              ? "#22c55e"
              : item.trend_1h === -1
              ? "#ef4444"
              : "#f59e0b",
        }));
        setSignalData(formattedData);
      }
    } catch (err) {
      setError("Veri yüklenirken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignalData();
    const interval = setInterval(fetchSignalData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <span className={styles.loadingText}>Veriler yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <strong>Hata:</strong> {error}
      </div>
    );
  }

  const latestSignal = signalData[0];
  const signalStats = {
    totalSignals: signalData.length,
    buySignals: signalData.filter((s) => s.signal === 1).length,
    sellSignals: signalData.filter((s) => s.signal === 0).length,
    waitSignals: signalData.filter((s) => s.signal === 2).length,
    avgConfidence:
      signalData.reduce((sum, s) => sum + s.ml_confidence, 0) /
      signalData.length,
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <h1 className={styles.title}>Crypto Trading Signal Dashboard</h1>

        {/* Üst Bilgi Kartları */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Son Fiyat</h3>
            <p className={styles.statValue + " " + styles.priceValue}>
              ${latestSignal?.price?.toLocaleString()}
            </p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Son Sinyal</h3>
            <p
              className={`${styles.statValue} ${
                latestSignal?.signal === 1
                  ? styles.buySignal
                  : latestSignal?.signal === 0
                  ? styles.sellSignal
                  : styles.waitSignal
              }`}
            >
              {latestSignal?.message}
            </p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>ML Güven</h3>
            <p className={styles.statValue + " " + styles.confidenceValue}>
              {latestSignal?.ml_confidence?.toFixed(1)}%
            </p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>RSI</h3>
            <p
              className={`${styles.statValue} ${
                latestSignal?.rsi > 70
                  ? styles.overbought
                  : latestSignal?.rsi < 30
                  ? styles.oversold
                  : styles.neutral
              }`}
            >
              {latestSignal?.rsi?.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Ana Grafikler */}
        <div className={styles.chartsGrid}>
          {/* Fiyat ve Bollinger Bands */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Fiyat ve Bollinger Bands</h3>
              <InfoTooltip
                title="Fiyat ve Bollinger Bands"
                description="Fiyat hareketi ve Bollinger Bands göstergesi. Üst ve alt bantlar volatiliteyi gösterir. Fiyat bantların dışına çıktığında aşırı alım/satım sinyali verir."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={signalData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Fiyat"
                />
                <Line
                  type="monotone"
                  dataKey="bollinger_upper"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Üst Band"
                />
                <Line
                  type="monotone"
                  dataKey="bollinger_lower"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Alt Band"
                />
                <Line
                  type="monotone"
                  dataKey="sma_short"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  name="Kısa SMA"
                />
                <Line
                  type="monotone"
                  dataKey="sma_long"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  name="Uzun SMA"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RSI ve Stochastic */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>RSI ve Stochastic</h3>
              <InfoTooltip
                title="RSI ve Stochastic"
                description="RSI (Relative Strength Index) ve Stochastic göstergeleri. RSI 70 üzeri aşırı alım, 30 altı aşırı satım. Stochastic %K ve %D çizgileri momentum göstergesi."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={signalData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Area
                  type="monotone"
                  dataKey="rsi"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="RSI"
                />
                <Line
                  type="monotone"
                  dataKey="stochastic_k"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Stochastic %K"
                />
                <Line
                  type="monotone"
                  dataKey="stochastic_d"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Stochastic %D"
                />
                <Line
                  type="monotone"
                  dataKey="70"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Aşırı Alım"
                />
                <Line
                  type="monotone"
                  dataKey="30"
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  name="Aşırı Satım"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alt Grafikler */}
        <div className={styles.chartsGrid}>
          {/* MACD */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>MACD</h3>
              <InfoTooltip
                title="MACD"
                description="Moving Average Convergence Divergence. MACD çizgisi ve sinyal çizgisi arasındaki fark momentum göstergesi. Pozitif değerler yükseliş, negatif değerler düşüş sinyali."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={signalData.slice(0, 30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Bar
                  dataKey="macd"
                  fill={(entry) => (entry.macd > 0 ? "#22c55e" : "#ef4444")}
                  name="MACD"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ADX ve ATR */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>ADX ve ATR</h3>
              <InfoTooltip
                title="ADX ve ATR"
                description="ADX (Average Directional Index) trend gücünü gösterir. 25 üzeri güçlü trend. ATR (Average True Range) volatilite göstergesi. Yüksek ATR yüksek volatilite demektir."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={signalData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey="adx"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="ADX"
                />
                <Line
                  type="monotone"
                  dataKey="atr"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="ATR"
                />
                <Line
                  type="monotone"
                  dataKey="25"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  name="Trend Eşiği"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Üçüncü Satır Grafikler */}
        <div className={styles.chartsGrid}>
          {/* Market Metrikleri */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Market Metrikleri</h3>
              <InfoTooltip
                title="Market Metrikleri"
                description="Buy/Sell Ratio: 1 üzeri alım baskısı, altı satım baskısı. Crypto VIX: Kripto volatilite endeksi. Volume Multiplier: Hacim çarpanı."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={signalData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey="buy_sell_ratio"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Buy/Sell Ratio"
                />
                <Line
                  type="monotone"
                  dataKey="crypto_vix"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Crypto VIX"
                />
                <Line
                  type="monotone"
                  dataKey="volume_multiplier"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Volume Multiplier"
                />
                <Line
                  type="monotone"
                  dataKey="1"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  name="Nötr Seviye"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ML Güven ve Sinyal Başarı Oranı */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>ML Güven ve Başarı Oranı</h3>
              <InfoTooltip
                title="ML Güven ve Başarı Oranı"
                description="ML Confidence: Yapay zeka tahmin güvenilirliği (0-100%). Signal Success Rate: Geçmiş sinyallerin başarı oranı. Yüksek değerler daha güvenilir sinyaller."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={signalData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey="ml_confidence"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="ML Güven"
                />
                <Line
                  type="monotone"
                  dataKey={(entry) => entry.signal_success_rate * 100}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Başarı Oranı"
                />
                <Line
                  type="monotone"
                  dataKey="50"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  name="Ortalama"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* İstatistikler */}
        <div className={styles.statsCard}>
          <h3 className={styles.chartTitle}>Sinyal İstatistikleri</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <p className={styles.statNumber + " " + styles.totalSignals}>
                {signalStats.totalSignals}
              </p>
              <p className={styles.statLabel}>Toplam Sinyal</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statNumber + " " + styles.buySignals}>
                {signalStats.buySignals}
              </p>
              <p className={styles.statLabel}>Alım Sinyali</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statNumber + " " + styles.sellSignals}>
                {signalStats.sellSignals}
              </p>
              <p className={styles.statLabel}>Satım Sinyali</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statNumber + " " + styles.avgConfidence}>
                {signalStats.avgConfidence.toFixed(1)}%
              </p>
              <p className={styles.statLabel}>Ortalama Güven</p>
            </div>
          </div>
        </div>

        {/* Manuel Yenileme Butonu */}
        <div className={styles.buttonContainer}>
          <button onClick={fetchSignalData} className={styles.refreshButton}>
            Verileri Yenile
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalDashboard;
