"use client";

import { useEffect, useRef } from "react";

const TradingViewWidget = () => {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT",
        "interval": "D",
        "timezone": "Europe/Istanbul",
        "theme": "dark",
        "style": "1",
        "locale": "tr",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "drawing_toolbar": true,
        "studies": [],
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "container_id": "tradingview_chart",
        "hide_side_toolbar": false,
        "hide_legend": false,
        "save_image": true,
        "backgroundColor": "rgba(19, 23, 34, 1)",
        "gridColor": "rgba(42, 46, 57, 1)",
        "width": "100%",
        "height": "100%"
      }`;

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      style={{ height: "100%", width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%" }}
        ref={container}
        id="tradingview_chart"
      ></div>
    </div>
  );
};

export default TradingViewWidget;
