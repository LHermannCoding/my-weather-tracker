"use client";

import { useState } from "react";

interface AddCityFormProps {
  onCityAdded: () => void;
}

export function AddCityForm({ onCityAdded }: AddCityFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        country,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }),
    });

    if (res.ok) {
      setName("");
      setCountry("");
      setLatitude("");
      setLongitude("");
      setOpen(false);
      onCityAdded();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add city");
    }

    setSubmitting(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors"
      >
        + Add City
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6"
    >
      <h3 className="text-white font-semibold mb-3">Add a City</h3>
      <p className="text-sm text-gray-500 mb-4">
        Find coordinates at{" "}
        <a
          href="https://www.latlong.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          latlong.net
        </a>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          placeholder="City name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          step="any"
          placeholder="Latitude (e.g. 41.88)"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude (e.g. -87.63)"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Adding..." : "Add City"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
