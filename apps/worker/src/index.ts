import { createClient } from "@supabase/supabase-js";

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "300000", 10); // 5 min default

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const CURRENT_PARAMS =
  "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Types ---
interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

// --- Fetch weather for one city ---
async function fetchWeather(
  city: City
): Promise<OpenMeteoResponse["current"] | null> {
  const url = `${OPEN_METEO_BASE}?latitude=${city.latitude}&longitude=${city.longitude}&current=${CURRENT_PARAMS}&temperature_unit=fahrenheit&wind_speed_unit=mph`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Open-Meteo error for ${city.name}: ${res.status}`);
      return null;
    }
    const data: OpenMeteoResponse = await res.json();
    return data.current;
  } catch (err) {
    console.error(`Failed to fetch weather for ${city.name}:`, err);
    return null;
  }
}

// --- Main polling cycle ---
async function poll() {
  console.log(`[${new Date().toISOString()}] Polling weather data...`);

  // 1. Get all cities
  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("*");

  if (citiesError || !cities) {
    console.error("Failed to fetch cities:", citiesError);
    return;
  }

  console.log(`Fetching weather for ${cities.length} cities...`);

  // 2. Fetch weather for each city and upsert (with delay to avoid rate limits)
  let successCount = 0;
  for (const city of cities as City[]) {
    await new Promise((r) => setTimeout(r, 5000));
    const weather = await fetchWeather(city);
    if (!weather) continue;

    const { error } = await supabase.from("weather_data").upsert(
      {
        city_id: city.id,
        temperature: weather.temperature_2m,
        feels_like: weather.apparent_temperature,
        humidity: weather.relative_humidity_2m,
        wind_speed: weather.wind_speed_10m,
        wind_direction: weather.wind_direction_10m,
        weather_code: weather.weather_code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "city_id" }
    );

    if (error) {
      console.error(`Failed to upsert weather for ${city.name}:`, error);
    } else {
      successCount++;
    }
  }

  console.log(
    `[${new Date().toISOString()}] Updated ${successCount}/${cities.length} cities`
  );
}

// --- Entry point ---
async function main() {
  console.log("Weather Worker starting...");
  console.log(`Poll interval: ${POLL_INTERVAL_MS / 1000}s`);

  // Run immediately on start
  await poll();

  // Then poll on interval
  setInterval(poll, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
