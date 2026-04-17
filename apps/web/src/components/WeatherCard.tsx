"use client";

import { getWeatherInfo, getWeatherEmoji, windDirectionLabel } from "@/lib/weather";

interface WeatherCardProps {
  city: {
    id: string;
    name: string;
    country: string;
  };
  weather: {
    temperature: number | null;
    feels_like: number | null;
    humidity: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    weather_code: number | null;
    updated_at: string | null;
  } | null;
  isFavorite: boolean;
  onToggleFavorite: (cityId: string) => void;
  compact?: boolean;
}

export function WeatherCard({
  city,
  weather,
  isFavorite,
  onToggleFavorite,
  compact = false,
}: WeatherCardProps) {
  const info = weather?.weather_code != null
    ? getWeatherInfo(weather.weather_code)
    : null;
  const emoji = info ? getWeatherEmoji(info.icon) : "";

  const updatedAgo = weather?.updated_at
    ? formatTimeAgo(new Date(weather.updated_at))
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{city.name}</h3>
          <p className="text-sm text-gray-500">{city.country}</p>
        </div>
        <button
          onClick={() => onToggleFavorite(city.id)}
          className={`text-xl transition-transform hover:scale-110 ${
            isFavorite ? "grayscale-0" : "grayscale opacity-30 hover:opacity-60"
          }`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "\u2B50" : "\u2606"}
        </button>
      </div>

      {weather && weather.temperature != null ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className="text-3xl font-bold text-white">
                {Math.round(weather.temperature)}&deg;F
              </p>
              {info && (
                <p className="text-sm text-gray-400">{info.description}</p>
              )}
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>
                Feels like{" "}
                <span className="text-gray-300">
                  {Math.round(weather.feels_like ?? 0)}&deg;F
                </span>
              </div>
              <div>
                Humidity{" "}
                <span className="text-gray-300">{weather.humidity}%</span>
              </div>
              <div>
                Wind{" "}
                <span className="text-gray-300">
                  {Math.round(weather.wind_speed ?? 0)} mph{" "}
                  {weather.wind_direction != null &&
                    windDirectionLabel(weather.wind_direction)}
                </span>
              </div>
              {updatedAgo && (
                <div>
                  Updated <span className="text-gray-300">{updatedAgo}</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-600 text-sm">Waiting for data...</p>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
