"use client";

import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CustomChart = ({ signalData = [] }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [livePrice, setLivePrice] = useState(null);
  const [priceChange, setPriceChange] = useState({ change: 0, percent: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // WebSocket bağlantısı için
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Binance WebSocket bağlantısı
        const ws = new WebSocket(
          "wss://stream.binance.com:9443/ws/btcusdt@ticker"
        );

        ws.onopen = () => {
          console.log("WebSocket bağlandı");
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setLivePrice({
            price: parseFloat(data.c), // Current price
            high: parseFloat(data.h), // 24h high
            low: parseFloat(data.l), // 24h low
            volume: parseFloat(data.v), // 24h volume
            change: parseFloat(data.P), // 24h price change
            changePercent: parseFloat(data.P), // 24h price change percent
          });

          setPriceChange({
            change: parseFloat(data.P),
            percent: parseFloat(data.P),
          });
        };

        ws.onclose = () => {
          console.log("WebSocket bağlantısı kapandı");
          setIsConnected(false);
          // 3 saniye sonra yeniden bağlan
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket hatası:", error);
          setIsConnected(false);
        };

        wsRef.current = ws;

        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (error) {
        console.error("WebSocket bağlantı hatası:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Chart verilerini güncelle
  useEffect(() => {
    if (signalData.length > 0) {
      const labels = signalData
        .slice(0, 50)
        .map((signal) =>
          new Date(signal.timestamp).toLocaleTimeString("tr-TR")
        );

      const prices = signalData.slice(0, 50).map((signal) => signal.price);

      // Canlı fiyat verisi varsa sona ekle
      let finalPrices = [...prices];
      let finalLabels = [...labels];

      if (livePrice) {
        finalPrices.push(livePrice.price);
        finalLabels.push("Şimdi");
      }

      // Sinyal noktaları
      const buySignals = signalData
        .slice(0, 50)
        .map((signal, index) => (signal.signal === 1 ? signal.price : null));

      const sellSignals = signalData
        .slice(0, 50)
        .map((signal, index) => (signal.signal === 0 ? signal.price : null));

      const waitSignals = signalData
        .slice(0, 50)
        .map((signal, index) => (signal.signal === 2 ? signal.price : null));

      setChartData({
        labels: finalLabels,
        datasets: [
          {
            label: "Fiyat",
            data: finalPrices,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: false,
            order: 3,
          },
          {
            label: "Bekle Sinyali",
            data: waitSignals,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#f59e0b",
            pointBorderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 12,
            pointStyle: "circle",
            showLine: false,
            order: 2,
          },
          {
            label: "Alım Sinyali",
            data: buySignals,
            pointBackgroundColor: "#22c55e",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 3,
            pointRadius: 10,
            pointHoverRadius: 15,
            pointStyle: "triangle",
            showLine: false,
            order: 1,
          },
          {
            label: "Satım Sinyali",
            data: sellSignals,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 3,
            pointRadius: 10,
            pointHoverRadius: 15,
            pointStyle: "triangle",
            showLine: false,
            order: 1,
          },
        ],
      });
    }
  }, [signalData, livePrice]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "Bitcoin Fiyat ve Trading Sinyalleri",
        font: {
          size: 16,
          weight: "bold",
        },
        color: "#f3f4f6",
      },
      tooltip: {
        backgroundColor: "rgba(30, 34, 45, 0.95)",
        titleColor: "#f3f4f6",
        bodyColor: "#9ca3af",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (value !== null) {
              return `${label}: $${value.toLocaleString()}`;
            }
            return null;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(55, 65, 81, 0.3)",
        },
        ticks: {
          color: "#9ca3af",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(55, 65, 81, 0.3)",
        },
        ticks: {
          color: "#9ca3af",
          callback: function (value) {
            return "$" + value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      point: {
        hoverBorderWidth: 4,
      },
    },
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#1f2937",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #374151",
      }}
    >
      {/* Canlı Fiyat Göstergesi */}
      {livePrice && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "rgba(55, 65, 81, 0.3)",
            borderRadius: "8px",
            border: "1px solid #374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#22c55e" : "#ef4444",
                animation: isConnected ? "pulse 2s infinite" : "none",
              }}
            />
            <span style={{ color: "#9ca3af", fontSize: "14px" }}>
              {isConnected ? "Canlı Bağlantı" : "Bağlantı Yok"}
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#f3f4f6",
              }}
            >
              ${livePrice.price.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: priceChange.change >= 0 ? "#22c55e" : "#ef4444",
                fontWeight: "600",
              }}
            >
              {priceChange.change >= 0 ? "+" : ""}
              {priceChange.change.toFixed(2)} ({priceChange.percent.toFixed(2)}
              %)
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              24s Yüksek: ${livePrice.high.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              24s Düşük: ${livePrice.low.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Hacim: {livePrice.volume.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Ana Container - Yan yana layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "20px",
          height: "500px",
        }}
      >
        {/* Sol taraf - Grafik */}
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #374151",
          }}
        >
          <Line options={options} data={chartData} />
        </div>

        {/* Sağ taraf - Sinyal Listesi */}
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #374151",
            overflowY: "auto",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#f3f4f6",
              textAlign: "center",
            }}
          >
            Canlı Sinyaller
          </h3>

          {/* Sinyal İstatistikleri */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
              padding: "12px",
              backgroundColor: "rgba(55, 65, 81, 0.3)",
              borderRadius: "8px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#22c55e",
                }}
              >
                {signalData.filter((s) => s.signal === 1).length}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Alım
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#ef4444",
                }}
              >
                {signalData.filter((s) => s.signal === 0).length}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Satım
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {signalData.filter((s) => s.signal === 2).length}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Bekle
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#60a5fa",
                }}
              >
                {signalData.length}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Toplam
              </div>
            </div>
          </div>

          {/* Sinyal Listesi */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {signalData.slice(0, 20).map((signal, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(55, 65, 81, 0.3)",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    {new Date(signal.timestamp).toLocaleTimeString("tr-TR")}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#f3f4f6",
                    }}
                  >
                    ${signal.price?.toLocaleString()}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor:
                        signal.signal === 1
                          ? "#22c55e"
                          : signal.signal === 0
                          ? "#ef4444"
                          : "#f59e0b",
                      color: "white",
                    }}
                  >
                    {signal.message}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      RSI: {signal.rsi?.toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      ML: {(signal.ml_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Son Güncelleme */}
          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
              padding: "8px",
              backgroundColor: "rgba(55, 65, 81, 0.3)",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
              }}
            >
              Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomChart;
