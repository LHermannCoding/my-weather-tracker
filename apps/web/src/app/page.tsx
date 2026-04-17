import { RealtimeWeather } from "@/components/RealtimeWeather";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Weather Dashboard</h1>
        <p className="text-gray-400">
          Live weather conditions for your favorite cities, updated every 5 minutes.
        </p>
      </div>
      <RealtimeWeather />
    </div>
  );
}
