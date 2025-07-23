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

// Custom plugin for signal markers
const signalPlugin = {
  id: "signalMarkers",
  afterDraw: (chart) => {
    const { ctx, data, scales } = chart;
    const { x, y } = scales;

    data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.label.includes("Sinyali")) {
        dataset.data.forEach((value, index) => {
          if (value !== null) {
            const xPos = x.getPixelForValue(data.labels[index]);
            const yPos = y.getPixelForValue(value);

            ctx.save();
            ctx.fillStyle = dataset.pointBackgroundColor;
            ctx.strokeStyle = dataset.pointBorderColor;
            ctx.lineWidth = dataset.pointBorderWidth || 2;

            // Draw triangle
            ctx.beginPath();
            if (dataset.label === "Alım Sinyali") {
              // Upward triangle
              ctx.moveTo(xPos, yPos - 8);
              ctx.lineTo(xPos - 6, yPos + 4);
              ctx.lineTo(xPos + 6, yPos + 4);
            } else if (dataset.label === "Satım Sinyali") {
              // Downward triangle
              ctx.moveTo(xPos, yPos + 8);
              ctx.lineTo(xPos - 6, yPos - 4);
              ctx.lineTo(xPos + 6, yPos - 4);
            } else {
              // Circle for wait signals
              ctx.arc(xPos, yPos, 6, 0, 2 * Math.PI);
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        });
      }
    });
  },
};

const CustomChartWithPlugin = ({ signalData = [] }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (signalData.length > 0) {
      const labels = signalData
        .slice(0, 50)
        .map((signal) =>
          new Date(signal.timestamp).toLocaleTimeString("tr-TR")
        );

      const prices = signalData.slice(0, 50).map((signal) => signal.price);

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
        labels,
        datasets: [
          {
            label: "Fiyat",
            data: prices,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: false,
          },
          {
            label: "Alım Sinyali",
            data: buySignals,
            pointBackgroundColor: "#22c55e",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 3,
            pointRadius: 0, // Hide default points
            showLine: false,
          },
          {
            label: "Satım Sinyali",
            data: sellSignals,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 3,
            pointRadius: 0, // Hide default points
            showLine: false,
          },
          {
            label: "Bekle Sinyali",
            data: waitSignals,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 0, // Hide default points
            showLine: false,
          },
        ],
      });
    }
  }, [signalData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: "Bitcoin Fiyat ve Trading Sinyalleri",
        font: { size: 16, weight: "bold" },
        color: "#f3f4f6",
      },
      tooltip: {
        backgroundColor: "rgba(30, 34, 45, 0.95)",
        titleColor: "#f3f4f6",
        bodyColor: "#9ca3af",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
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
        grid: { color: "rgba(55, 65, 81, 0.3)" },
        ticks: { color: "#9ca3af", maxRotation: 45 },
      },
      y: {
        beginAtZero: false,
        grid: { color: "rgba(55, 65, 81, 0.3)" },
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
  };

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        backgroundColor: "#1f2937",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #374151",
      }}
    >
      <Line options={options} data={chartData} plugins={[signalPlugin]} />
    </div>
  );
};

export default CustomChartWithPlugin;
