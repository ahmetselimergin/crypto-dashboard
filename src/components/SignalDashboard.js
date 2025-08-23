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
  const [selectedTable, setSelectedTable] = useState("b7"); // Default to b7
  const [lastSignalId, setLastSignalId] = useState(null); // Son sinyal ID'sini takip et
  const [telegramEnabled, setTelegramEnabled] = useState(false); // Telegram bildirimleri aktif/pasif
  const [telegramSettings, setTelegramSettings] = useState({
    botToken: "8123835785:AAHvgbAZy4E_PbF7rAW78DhxwERhJXbiV8I",
    chatId: "",
  });
  const [showHelpModal, setShowHelpModal] = useState(false); // Yardım modal'ı için state

  // Telegram bildirimi gönder
  const sendTelegramNotification = async (signal) => {
    if (
      !telegramEnabled ||
      !telegramSettings.botToken ||
      !telegramSettings.chatId
    )
      return;

    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signal: signal.signal,
          price: signal.price,
          table: selectedTable,
          message: signal.message,
          strength: signal.strength,
          ml_confidence: signal.ml_confidence,
          botToken: telegramSettings.botToken,
          chatId: telegramSettings.chatId,
        }),
      });
    } catch (err) {
      console.error("Telegram bildirimi gönderilemedi:", err);
    }
  };

  // Yeni sinyal kontrolü ve bildirim
  const checkNewSignals = (newData) => {
    if (newData.length > 0 && lastSignalId !== null) {
      // Yeni sinyalleri kontrol et
      const newSignals = newData.filter((item) => {
        // Timestamp'e göre yeni olanları bul
        const itemTime = new Date(item.timestamp).getTime();
        const lastTime = new Date(signalData[0]?.timestamp || 0).getTime();
        return itemTime > lastTime;
      });

      // Yeni sinyalleri Telegram'a gönder
      newSignals.forEach((signal) => {
        sendTelegramNotification(signal);
      });
    }
  };

  // API'den veri çekme fonksiyonu
  const fetchSignalData = async (table = selectedTable) => {
    try {
      setLoading(true);
      setError(null); // Önceki hataları temizle

      const response = await fetch(`/api/signals?table=${table}`);

      // Response text'ini önce al
      const responseText = await response.text();

      if (!responseText || responseText.trim() === "") {
        throw new Error("API'den boş response alındı");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Hatası:", parseError);
        console.error("Response Text:", responseText);
        throw new Error("API'den geçersiz JSON formatı alındı");
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `HTTP ${response.status}: ${data.details || "Bilinmeyen hata"}`
        );
      }

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
        setLastSignalId(formattedData[0]?.id || null); // Son sinyal ID'sini güncelle
        checkNewSignals(formattedData); // Yeni sinyalleri kontrol et
      } else {
        // API'den veri gelmezse mock data kullan
        console.warn("API'den veri gelmedi, mock data kullanılıyor");
        const mockData = generateMockData(table);
        setSignalData(mockData);
        setLastSignalId(null);
      }
    } catch (err) {
      const errorMessage = err.message || "Veri yüklenirken hata oluştu";
      setError(errorMessage);
      console.error("Veri çekme hatası:", err);

      // Hata durumunda da mock data göster
      const mockData = generateMockData(table);
      setSignalData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Mock data oluştur
  const generateMockData = (table) => {
    const now = new Date();
    const mockData = [];

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - i * 60000); // Her dakika
      mockData.push({
        id: i,
        timestamp: timestamp.toLocaleString("tr-TR"),
        signal: Math.floor(Math.random() * 3), // 0, 1, 2
        message: ["SAT", "AL", "BEKLE"][Math.floor(Math.random() * 3)],
        strength: Math.random(),
        price: 110000 + Math.random() * 20000,
        rsi: 30 + Math.random() * 40,
        macd: -100 + Math.random() * 200,
        ml_confidence: Math.random() * 100,
        sma_short: 110000 + Math.random() * 20000,
        sma_long: 110000 + Math.random() * 20000,
        bollinger_upper: 115000 + Math.random() * 10000,
        bollinger_lower: 105000 + Math.random() * 10000,
        stochastic_k: Math.random() * 100,
        stochastic_d: Math.random() * 100,
        adx: Math.random() * 50,
        atr: 1000 + Math.random() * 1000,
        volume_multiplier: Math.random() * 3,
        buy_sell_ratio: 0.5 + Math.random(),
        crypto_vix: Math.random() * 100,
        trend_1h: Math.floor(Math.random() * 3) - 1, // -1, 0, 1
        signal_strength: ["AL", "SAT", "BEKLE"][Math.floor(Math.random() * 3)],
        trend_color: ["#22c55e", "#ef4444", "#f59e0b"][
          Math.floor(Math.random() * 3)
        ],
      });
    }

    return mockData;
  };

  // Table değiştiğinde veriyi yeniden çek
  const handleTableChange = (table) => {
    setSelectedTable(table);
    fetchSignalData(table);
  };

  useEffect(() => {
    fetchSignalData();
    const interval = setInterval(() => fetchSignalData(), 30000);

    // Telegram ayarlarını localStorage'dan yükle
    const savedSettings = localStorage.getItem("telegramSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setTelegramSettings(parsed);
        setTelegramEnabled(true);
      } catch (err) {
        console.error("Telegram ayarları yüklenemedi:", err);
      }
    }

    return () => clearInterval(interval);
  }, [selectedTable]);

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
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>⚠️ API Bağlantı Hatası</h2>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.errorActions}>
              <button
                onClick={() => fetchSignalData(selectedTable)}
                className={styles.retryButton}
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => setError(null)}
                className={styles.clearErrorButton}
              >
                Hatayı Temizle
              </button>
            </div>
            <div className={styles.errorInfo}>
              <h4>Olası Nedenler:</h4>
              <ul>
                <li>API sunucusu çalışmıyor olabilir</li>
                <li>IP adresi değişmiş olabilir</li>
                <li>Ağ bağlantısında sorun olabilir</li>
                <li>Firewall engellemiş olabilir</li>
              </ul>
            </div>
          </div>
        </div>
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
        {/* Table Toggle */}
        <div className={styles.tableToggle}>
          <div className={styles.toggleHeader}>
            <h3 className={styles.toggleTitle}>Veri Tablosu Seçimi:</h3>
            <div className={styles.currentTableInfo}>
              <span className={styles.currentTableLabel}>Şu an aktif:</span>
              <span className={styles.currentTableValue}>
                {selectedTable.toUpperCase()}
              </span>
            </div>
          </div>
          <div className={styles.toggleButtons}>
            <button
              className={`${styles.toggleButton} ${
                selectedTable === "b2" ? styles.activeToggle : ""
              }`}
              onClick={() => handleTableChange("b2")}
            >
              B2
            </button>
            <button
              className={`${styles.toggleButton} ${
                selectedTable === "b7" ? styles.activeToggle : ""
              }`}
              onClick={() => handleTableChange("b7")}
            >
              B7
            </button>
          </div>
        </div>

        {/* Telegram Bildirim Ayarları */}
        <div className={styles.telegramSettings}>
          <div className={styles.telegramHeader}>
            <h3 className={styles.telegramTitle}>Telegram Bildirimleri</h3>
            <label className={styles.telegramToggle}>
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          {telegramEnabled && (
            <div className={styles.telegramForm}>
              <div className={styles.inputGroup}>
                <label>Bot Token:</label>
                <input
                  type="text"
                  value={telegramSettings.botToken}
                  readOnly
                  className={styles.readonlyInput}
                />
                <small className={styles.helpText}>
                  Bot token otomatik ayarlandı
                </small>
              </div>
              <div className={styles.inputGroup}>
                <label>Chat ID:</label>
                <div className={styles.inputWithHelp}>
                  <input
                    type="text"
                    placeholder="Chat ID'nizi girin"
                    value={telegramSettings.chatId}
                    onChange={(e) =>
                      setTelegramSettings((prev) => ({
                        ...prev,
                        chatId: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className={styles.helpButton}
                    onClick={() => setShowHelpModal(true)}
                    title="Chat ID nasıl bulunur?"
                  >
                    ?
                  </button>
                </div>
                <small className={styles.helpText}>
                  Telegram grubunuzun veya DM'inizin Chat ID'si
                </small>
              </div>
              <button
                className={styles.saveButton}
                onClick={() => {
                  localStorage.setItem(
                    "telegramSettings",
                    JSON.stringify(telegramSettings)
                  );
                  alert("Telegram ayarları kaydedildi!");
                }}
              >
                Ayarları Kaydet
              </button>
            </div>
          )}
        </div>

        <h1 className={styles.title}>
          Crypto Trading Signal Dashboard - {selectedTable.toUpperCase()}{" "}
          Tablosu
        </h1>

        {/* Üst Bilgi Kartları */}
        <div className={styles.statsGrid}>
          {/* Aktif Tablo Bilgisi */}
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Aktif Tablo</h3>
            <p className={styles.statValue + " " + styles.activeTableValue}>
              {selectedTable.toUpperCase()}
            </p>
          </div>

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
          <button
            onClick={() => fetchSignalData(selectedTable)}
            className={styles.refreshButton}
          >
            Verileri Yenile
          </button>
        </div>
      </div>

      {/* Chat ID Yardım Modal'ı */}
      {showHelpModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Chat ID Nasıl Bulunur?</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowHelpModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <ol className={styles.helpSteps}>
                <li>
                  <strong>Bot'u gruba ekleyin veya DM gönderin:</strong>
                  <p>
                    Telegram'da bot'u (@bot_username) grubunuza ekleyin veya
                    bot'a özel mesaj gönderin
                  </p>
                </li>
                <li>
                  <strong>Tarayıcıda şu adrese gidin:</strong>
                  <div className={styles.apiUrl}>
                    <code>
                      https://api.telegram.org/bot8123835785:AAHvgbAZy4E_PbF7rAW78DhxwERhJXbiV8I/getUpdates
                    </code>
                    <button
                      className={styles.copyButton}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "https://api.telegram.org/bot8123835785:AAHvgbAZy4E_PbF7rAW78DhxwERhJXbiV8I/getUpdates"
                        );
                        alert("URL kopyalandı!");
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Chat ID'yi bulun:</strong>
                  <p>
                    Sayfada <code>chat id formatında ID'yi bulun</code>
                  </p>
                  <p className={styles.note}>
                    Not: Eğer hiç mesaj yoksa, önce bot'a bir mesaj gönderin
                  </p>
                </li>
              </ol>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalButton}
                onClick={() => setShowHelpModal(false)}
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalDashboard;
