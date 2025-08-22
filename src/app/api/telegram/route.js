import TelegramBot from "node-telegram-bot-api";

export async function POST(request) {
  try {
    const {
      signal,
      price,
      table,
      message,
      strength,
      ml_confidence,
      botToken,
      chatId,
    } = await request.json();

    // Bot token ve chat ID kontrolü
    if (!botToken || !chatId) {
      return Response.json(
        { error: "Bot token veya Chat ID eksik" },
        { status: 400 }
      );
    }

    // Bot instance'ı oluştur
    const bot = new TelegramBot(botToken);

    // Sinyal tipine göre emoji ve mesaj oluştur
    let emoji, signalText;
    switch (signal) {
      case 1:
        emoji = "🟢";
        signalText = "AL SİNYALİ";
        break;
      case 0:
        emoji = "🔴";
        signalText = "SAT SİNYALİ";
        break;
      case 2:
        emoji = "🟡";
        signalText = "BEKLE SİNYALİ";
        break;
      default:
        emoji = "⚪";
        signalText = "BİLİNMEYEN";
    }

    // Telegram mesajı oluştur
    const telegramMessage = `
${emoji} *${signalText}*

📊 **Tablo:** ${table.toUpperCase()}
💰 **Fiyat:** $${price?.toLocaleString()}
💬 **Mesaj:** ${message}
💪 **Güç:** ${(strength * 100).toFixed(1)}%
🤖 **ML Güven:** ${(ml_confidence * 100).toFixed(1)}%
⏰ **Zaman:** ${new Date().toLocaleString("tr-TR")}

#CryptoSignal #${table.toUpperCase()} #${signalText.replace(" ", "")}
    `.trim();

    // Telegram'a mesaj gönder
    await bot.sendMessage(chatId, telegramMessage, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    return Response.json({
      success: true,
      message: "Telegram bildirimi gönderildi",
    });
  } catch (error) {
    console.error("Telegram API Error:", error);
    return Response.json(
      { error: "Telegram bildirimi gönderilemedi" },
      { status: 500 }
    );
  }
}
