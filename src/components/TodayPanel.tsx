import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";

interface Shoot {
  id: string;
  client_name: string;
  shoot_type: string;
  location: string;
  date: string;
  time: string;
  status: "planned" | "completed" | "cancelled";
}

interface Props {
  shoots: Shoot[];
  onOpenCalendar: () => void;
}

export default function TodayPanel({ shoots, onOpenCalendar }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const todayShoots = shoots
    .filter((s) => s.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">
            Today's Shoots
          </h2>
          <p className="text-slate-400 text-sm">
            {todayShoots.length} shoot
            {todayShoots.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white text-sm transition"
        >
          Calendar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {todayShoots.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="mx-auto w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">
            No shoots scheduled today.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayShoots.map((shoot) => (
            <div
              key={shoot.id}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">
                    {shoot.client_name}
                  </h3>

                  <p className="text-indigo-400 text-sm mt-1">
                    {shoot.shoot_type}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {shoot.time}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {shoot.location}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shoot.status === "completed"
                      ? "bg-green-900 text-green-300"
                      : shoot.status === "cancelled"
                      ? "bg-red-900 text-red-300"
                      : "bg-blue-900 text-blue-300"
                  }`}
                >
                  {shoot.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
