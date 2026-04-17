import { RealtimeWeather } from "@/components/RealtimeWeather";

export default function CitiesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Cities</h1>
        <p className="text-gray-400">
          Browse weather conditions worldwide. Star cities to add them to your dashboard.
        </p>
      </div>
      <RealtimeWeather />
    </div>
  );
}
