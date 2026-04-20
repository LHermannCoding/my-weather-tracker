"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { WeatherCard } from "./WeatherCard";
import { AddCityForm } from "./AddCityForm";

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
  const [search, setSearch] = useState("");

  const refreshCities = useCallback(async () => {
    const sb = getSupabase();
    const [citiesRes, weatherRes, favsRes] = await Promise.all([
      sb.from("cities").select("*").order("name"),
      sb.from("weather_data").select("*"),
      fetch("/api/favorites"),
    ]);

    if (citiesRes.data) setCities(citiesRes.data);
    if (weatherRes.data) {
      const map: Record<string, WeatherRow> = {};
      for (const w of weatherRes.data) {
        map[w.city_id] = w;
      }
      setWeatherMap(map);
    }
    if (favsRes.ok) {
      const ids: string[] = await favsRes.json();
      setFavorites(new Set(ids));
    }
    setLoading(false);
  }, []);

  // Load cities and weather data
  useEffect(() => {
    refreshCities();
  }, [refreshCities]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse"
          >
            <div className="h-5 bg-gray-800 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/3 mb-4" />
            <div className="h-10 bg-gray-800 rounded w-2/3 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-3 bg-gray-800 rounded" />
              <div className="h-3 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredByTab =
    filter === "favorites"
      ? cities.filter((c) => favorites.has(c.id))
      : cities;

  const displayedCities = search
    ? filteredByTab.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.country.toLowerCase().includes(search.toLowerCase())
      )
    : filteredByTab;

  return (
    <div>
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 sm:w-64"
        />
      </div>
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
        <AddCityForm onCityAdded={refreshCities} />
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
