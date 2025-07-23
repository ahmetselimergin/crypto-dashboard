"use client";
import Image from "next/image";
import styles from "./page.module.css";
import TradingViewWidget from "../components/TradingViewWidget";
import SignalDashboard from "../components/SignalDashboard";
import { useState, useEffect } from "react";
import CustomChart from "../components/CustomChart";
export default function Home() {
  const [signalData, setSignalData] = useState([]);

  // Signal verilerini çek
  const fetchSignalData = async () => {
    try {
      const response = await fetch("/api/signals");
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setSignalData(data.data);
      }
    } catch (error) {
      console.error("Signal verisi alınamadı:", error);
    }
  };

  useEffect(() => {
    fetchSignalData();
    const interval = setInterval(fetchSignalData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Crypto Dashboard</h1>

        <div className={styles.info}>
          <CustomChart signalData={signalData} />
        </div>
        {/* Signal Dashboard */}
        <SignalDashboard />

        <div className={styles.chartContainer}>
          <h2>Bitcoin (BTC/USDT) Grafiği - Sinyallerle</h2>
          <div className={styles.chartWrapper}>
            <TradingViewWidget signalData={signalData} />
          </div>
        </div>
      </main>
    </div>
  );
}
