export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const table = searchParams.get("table") || "b7"; // Default to b7 if no table specified

    const apiUrl = `http://162.55.100.111:8000/data?table=${table}&start=2025-07-01%2000:00:00&end=2025-07-16%2023:59:59`;

    console.log(`API isteği gönderiliyor: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      // Timeout ekle
      signal: AbortSignal.timeout(10000), // 10 saniye timeout
    });

    if (!response.ok) {
      console.error(`API Hatası: ${response.status} - ${response.statusText}`);
      throw new Error(
        `API Hatası: ${response.status} - ${response.statusText}`
      );
    }

    // Response body'sini kontrol et
    const responseText = await response.text();
    console.log(`API Response Text: ${responseText.substring(0, 200)}...`);

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

    console.log(`API'den veri alındı: ${data.data?.length || 0} kayıt`);

    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);

    // Hata tipine göre farklı mesajlar
    let errorMessage = "Veri alınamadı";
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "API yanıt vermedi (timeout)";
      statusCode = 408;
    } else if (error.message.includes("fetch")) {
      errorMessage = "API sunucusuna bağlanılamadı";
      statusCode = 503;
    } else if (error.message.includes("API Hatası")) {
      errorMessage = error.message;
      statusCode = 502;
    } else if (error.message.includes("JSON")) {
      errorMessage = error.message;
      statusCode = 422;
    } else if (error.message.includes("boş response")) {
      errorMessage = "API sunucusu veri döndürmedi";
      statusCode = 204;
    }

    return Response.json(
      {
        error: errorMessage,
        details: error.message,
        table: searchParams.get("table") || "b7",
      },
      { status: statusCode }
    );
  }
}
