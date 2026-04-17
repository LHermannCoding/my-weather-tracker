"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { WeatherCard } from "./WeatherCard";

interface City {
  id: string;
  name: string;
  country: string;
}

interface WeatherRow {
  city_id: string;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  weather_code: number | null;
  updated_at: string | null;
}

export function RealtimeWeather() {
  const [cities, setCities] = useState<City[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherRow>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"favorites" | "all">("favorites");

  // Load cities and weather data
  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const [citiesRes, weatherRes] = await Promise.all([
        sb.from("cities").select("*").order("name"),
        sb.from("weather_data").select("*"),
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (weatherRes.data) {
        const map: Record<string, WeatherRow> = {};
        for (const w of weatherRes.data) {
          map[w.city_id] = w;
        }
        setWeatherMap(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Load favorites
  useEffect(() => {
    async function loadFavorites() {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const ids: string[] = await res.json();
        setFavorites(new Set(ids));
      }
    }
    loadFavorites();
  }, []);

  // Subscribe to Realtime weather updates
  useEffect(() => {
    const sb = getSupabase();
    const channel = sb
      .channel("weather-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weather_data" },
        (payload) => {
          const row = payload.new as WeatherRow;
          if (row?.city_id) {
            setWeatherMap((prev) => ({ ...prev, [row.city_id]: row }));
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const toggleFavorite = useCallback(
    async (cityId: string) => {
      const isFav = favorites.has(cityId);

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(cityId);
        else next.add(cityId);
        return next;
      });

      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_id: cityId }),
      });

      if (!res.ok) {
        // Revert on failure
        setFavorites((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(cityId);
          else next.delete(cityId);
          return next;
        });
      }
    },
    [favorites]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading weather data...</div>
      </div>
    );
  }

  const displayedCities =
    filter === "favorites"
      ? cities.filter((c) => favorites.has(c.id))
      : cities;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("favorites")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "favorites"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          My Cities ({favorites.size})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          All Cities ({cities.length})
        </button>
      </div>

      {/* Weather grid */}
      {displayedCities.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No favorite cities yet</p>
          <p className="text-sm">
            Switch to &quot;All Cities&quot; and star some cities to track their weather.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCities.map((city) => (
            <WeatherCard
              key={city.id}
              city={city}
              weather={weatherMap[city.id] ?? null}
              isFavorite={favorites.has(city.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Realtime indicator */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-600">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Live — updates automatically when new data arrives
      </div>
    </div>
  );
}
