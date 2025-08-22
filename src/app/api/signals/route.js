export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table") || "b7"; // Default to b7 if no table specified

    const response = await fetch(
      `http://162.55.100.111:8000/data?table=${table}&start=2025-07-01%2000:00:00&end=2025-07-16%2023:59:59`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
