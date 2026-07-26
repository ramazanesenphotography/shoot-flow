import React, { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clipboard,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Link2,
  MapPin,
  RotateCcw,
  Share2,
  TrendingUp,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

export interface ReportShoot {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  shoot_type: string;
  location?: string;
  date: string;
  time?: string;
  price: number;
  status: "planned" | "completed" | "cancelled";
  notes?: string;
  drive_link?: string;
}

export interface ReportClient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ReportsPageProps {
  shoots: ReportShoot[];
  clients: ReportClient[];
}

type Preset =
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "allTime"
  | "custom";

type StatusFilter = "all" | "completed" | "planned" | "cancelled";

interface ShareOptions {
  showDates: boolean;
  showLocations: boolean;
  showGalleryLinks: boolean;
  showIndividualPrices: boolean;
  showTotalAmount: boolean;
  showCancelled: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = parseLocalDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPresetRange(preset: Preset) {
  const today = new Date();

  switch (preset) {
    case "thisWeek":
      return { start: startOfWeek(today), end: endOfWeek(today) };
    case "thisMonth":
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case "lastMonth": {
      const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start: startOfMonth(previous), end: endOfMonth(previous) };
    }
    case "thisYear":
      return { start: startOfYear(today), end: endOfYear(today) };
    case "allTime":
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
}

function getPreviousRange(start: Date | null, end: Date | null) {
  if (!start || !end) return { start: null, end: null };

  const duration = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - duration + 1);
  previousStart.setHours(0, 0, 0, 0);

  return { start: previousStart, end: previousEnd };
}

function statusBadge(status: ReportShoot["status"]) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-900/30 px-2.5 py-1 text-xs text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-300">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-700/50 bg-blue-900/30 px-2.5 py-1 text-xs text-blue-300">
      <CalendarDays className="h-3.5 w-3.5" />
      Planned
    </span>
  );
}

export default function ReportsPage({ shoots, clients }: ReportsPageProps) {
  const [preset, setPreset] = useState<Preset>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("completed");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientReportOpen, setClientReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    showDates: true,
    showLocations: true,
    showGalleryLinks: true,
    showIndividualPrices: false,
    showTotalAmount: false,
    showCancelled: false,
  });

  const selectedRange = useMemo(() => {
    if (preset === "custom") {
      const start = parseLocalDate(customStart);
      const end = parseLocalDate(customEnd);
      if (end) end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  const matchesRange = (
    shoot: ReportShoot,
    start: Date | null,
    end: Date | null
  ) => {
    const date = parseLocalDate(shoot.date);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const filteredShoots = useMemo(() => {
    return shoots
      .filter((shoot) =>
        matchesRange(shoot, selectedRange.start, selectedRange.end)
      )
      .filter((shoot) => statusFilter === "all" || shoot.status === statusFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shoots, selectedRange, statusFilter]);

  const completedShoots = filteredShoots.filter(
    (shoot) => shoot.status === "completed"
  );

  const totalRevenue = completedShoots.reduce(
    (sum, shoot) => sum + Number(shoot.price || 0),
    0
  );

  const averageRevenue =
    completedShoots.length > 0 ? totalRevenue / completedShoots.length : 0;

  const highestShoot = completedShoots.reduce<ReportShoot | null>(
    (highest, shoot) =>
      !highest || Number(shoot.price || 0) > Number(highest.price || 0)
        ? shoot
        : highest,
    null
  );

  const previousRange = useMemo(
    () => getPreviousRange(selectedRange.start, selectedRange.end),
    [selectedRange]
  );

  const previousRevenue = shoots
    .filter((shoot) => shoot.status === "completed")
    .filter((shoot) =>
      matchesRange(shoot, previousRange.start, previousRange.end)
    )
    .reduce((sum, shoot) => sum + Number(shoot.price || 0), 0);

  const revenueChange =
    previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : null;

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();

    completedShoots.forEach((shoot) => {
      const date = parseLocalDate(shoot.date);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      map.set(key, (map.get(key) || 0) + Number(shoot.price || 0));
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => {
        const [year, month] = key.split("-").map(Number);
        return {
          key,
          label: new Intl.DateTimeFormat("tr-TR", {
            month: "short",
            year: "2-digit",
          }).format(new Date(year, month - 1, 1)),
          value,
        };
      });
  }, [completedShoots]);

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((item) => item.value),
    1
  );

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) || null;

  const selectedClientShoots = useMemo(() => {
    if (!selectedClient) return [];

    return shoots
      .filter(
        (shoot) =>
          shoot.client_id === selectedClient.id ||
          shoot.client_name.toLocaleLowerCase("tr-TR") ===
            selectedClient.name.toLocaleLowerCase("tr-TR")
      )
      .filter((shoot) =>
        matchesRange(shoot, selectedRange.start, selectedRange.end)
      )
      .filter((shoot) => shareOptions.showCancelled || shoot.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shoots, selectedClient, selectedRange, shareOptions.showCancelled]);

  const clientCompletedShoots = selectedClientShoots.filter(
    (shoot) => shoot.status === "completed"
  );

  const clientTotal = clientCompletedShoots.reduce(
    (sum, shoot) => sum + Number(shoot.price || 0),
    0
  );

  const clientFirstDate = selectedClientShoots[0]?.date || "";
  const clientLastDate =
    selectedClientShoots[selectedClientShoots.length - 1]?.date || "";

  const clientShootTypes = useMemo(() => {
    const map = new Map<string, number>();
    selectedClientShoots.forEach((shoot) => {
      map.set(shoot.shoot_type, (map.get(shoot.shoot_type) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedClientShoots]);

  const resetFilters = () => {
    setPreset("thisMonth");
    setCustomStart("");
    setCustomEnd("");
    setStatusFilter("completed");
  };

  const createShareText = () => {
    if (!selectedClient) return "";

    const lines = [
      "RAMAZAN ESEN PHOTOGRAPHY",
      "Client Collaboration Report",
      "",
      `Client: ${selectedClient.name}`,
      clientFirstDate && clientLastDate
        ? `Period: ${formatDate(clientFirstDate)} - ${formatDate(clientLastDate)}`
        : "",
      `Total Shoots: ${selectedClientShoots.length}`,
      `Completed Shoots: ${clientCompletedShoots.length}`,
      shareOptions.showTotalAmount
        ? `Total Collaboration Value: ${formatCurrency(clientTotal)}`
        : "",
      "",
      "Shoot History:",
      ...selectedClientShoots.map((shoot) => {
        const parts = [
          shareOptions.showDates ? formatDate(shoot.date) : "",
          shoot.shoot_type,
          shareOptions.showLocations && shoot.location ? shoot.location : "",
          shareOptions.showIndividualPrices
            ? formatCurrency(Number(shoot.price || 0))
            : "",
          shoot.status,
          shareOptions.showGalleryLinks && shoot.drive_link
            ? shoot.drive_link
            : "",
        ].filter(Boolean);

        return `• ${parts.join(" | ")}`;
      }),
    ];

    return lines.filter(Boolean).join("\n");
  };

  const copyClientReport = async () => {
    const text = createShareText();
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareClientReport = async () => {
    const text = createShareText();
    if (!text || !selectedClient) return;

    if (navigator.share) {
      await navigator.share({
        title: `${selectedClient.name} - Collaboration Report`,
        text,
      });
      return;
    }

    await copyClientReport();
  };

  const optionItems: Array<{
    key: keyof ShareOptions;
    label: string;
  }> = [
    { key: "showDates", label: "Show shoot dates" },
    { key: "showLocations", label: "Show locations" },
    { key: "showGalleryLinks", label: "Show gallery links" },
    { key: "showIndividualPrices", label: "Show individual prices" },
    { key: "showTotalAmount", label: "Show total amount" },
    { key: "showCancelled", label: "Show cancelled shoots" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <BarChart3 className="h-3.5 w-3.5" />
            Reports & Analytics
          </div>
          <h1 className="text-2xl font-bold text-white">Business Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track revenue and create client-facing collaboration reports.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 shadow-xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-indigo-400" />
          Report Filters
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value as Preset)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="allTime">All Time</option>
            <option value="custom">Custom Date Range</option>
          </select>

          <input
            type="date"
            value={customStart}
            disabled={preset !== "custom"}
            max={customEnd || undefined}
            onChange={(event) => setCustomStart(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />

          <input
            type="date"
            value={customEnd}
            disabled={preset !== "custom"}
            min={customStart || undefined}
            onChange={(event) => setCustomEnd(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="completed">Completed Only</option>
            <option value="all">All Statuses</option>
            <option value="planned">Planned Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Selected Revenue"
          value={formatCurrency(totalRevenue)}
          note={
            revenueChange === null
              ? "No previous period data"
              : `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(
                  1
                )}% vs previous period`
          }
        />
        <SummaryCard
          icon={<Camera className="h-5 w-5" />}
          label="Completed Shoots"
          value={String(completedShoots.length)}
          note={`${filteredShoots.length} total records`}
        />
        <SummaryCard
          icon={<WalletCards className="h-5 w-5" />}
          label="Average Shoot"
          value={formatCurrency(averageRevenue)}
          note="Completed shoots average"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Highest Shoot"
          value={highestShoot ? formatCurrency(highestShoot.price) : "₺0"}
          note={highestShoot?.client_name || "No completed shoot"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-xl">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Revenue Timeline</h2>
            <p className="text-xs text-slate-400">
              Monthly totals for the selected period
            </p>
          </div>

          {monthlyRevenue.length === 0 ? (
            <EmptyState text="No revenue data for this period." />
          ) : (
            <div className="flex h-64 items-end gap-2 overflow-x-auto pb-2">
              {monthlyRevenue.map((item) => (
                <div
                  key={item.key}
                  className="flex min-w-16 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatCurrency(item.value)}
                  </span>
                  <div className="flex h-44 w-full items-end rounded-lg bg-slate-900 p-1">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-indigo-700 to-indigo-400 transition-all"
                      style={{
                        height: `${Math.max(
                          6,
                          (item.value / maxMonthlyRevenue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-xl">
          <h2 className="font-semibold text-white">Period Summary</h2>
          <div className="mt-5 space-y-4">
            <MetricRow
              label="Planned"
              value={filteredShoots.filter((s) => s.status === "planned").length}
            />
            <MetricRow
              label="Completed"
              value={
                filteredShoots.filter((s) => s.status === "completed").length
              }
            />
            <MetricRow
              label="Cancelled"
              value={
                filteredShoots.filter((s) => s.status === "cancelled").length
              }
            />
            <MetricRow
              label="Unique Clients"
              value={
                new Set(filteredShoots.map((shoot) => shoot.client_name)).size
              }
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 shadow-xl">
        <div className="border-b border-slate-700 p-5">
          <h2 className="font-semibold text-white">Shoot Details</h2>
          <p className="text-xs text-slate-400">
            All records matching the current filters
          </p>
        </div>

        {filteredShoots.length === 0 ? (
          <EmptyState text="No shoots found for this period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Shoot Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/70">
                {filteredShoots.map((shoot) => (
                  <tr key={shoot.id} className="hover:bg-slate-700/20">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                      {formatDate(shoot.date)}
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {shoot.client_name}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {shoot.shoot_type}
                    </td>
                    <td className="px-5 py-4">{statusBadge(shoot.status)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-200">
                      {formatCurrency(Number(shoot.price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-800 to-indigo-950/40 p-5 shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              <Share2 className="h-3.5 w-3.5" />
              Client Report
            </div>
            <h2 className="text-xl font-bold text-white">
              Client Collaboration Summary
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Select a client, choose what is visible, and share a professional
              report without exposing private CRM notes.
            </p>
          </div>

          <select
            value={selectedClientId}
            onChange={(event) => {
              setSelectedClientId(event.target.value);
              setClientReportOpen(false);
            }}
            className="min-w-64 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="">Select Client</option>
            {clients
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
          </select>
        </div>

        {selectedClient ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ClientStat
                label="Total Shoots"
                value={String(selectedClientShoots.length)}
              />
              <ClientStat
                label="Completed"
                value={String(clientCompletedShoots.length)}
              />
              <ClientStat
                label="First Collaboration"
                value={clientFirstDate ? formatDate(clientFirstDate) : "—"}
              />
              <ClientStat
                label="Latest Collaboration"
                value={clientLastDate ? formatDate(clientLastDate) : "—"}
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Share Settings
                </h3>

                <div className="space-y-3">
                  {optionItems.map((option) => (
                    <label
                      key={option.key}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-300">
                        {option.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={shareOptions[option.key]}
                        onChange={(event) =>
                          setShareOptions((current) => ({
                            ...current,
                            [option.key]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-indigo-500"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => setClientReportOpen((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-700"
                  >
                    {clientReportOpen ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {clientReportOpen ? "Hide Preview" : "Preview"}
                  </button>

                  <button
                    onClick={shareClientReport}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>

                  <button
                    onClick={copyClientReport}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-700 sm:col-span-2"
                  >
                    <Clipboard className="h-4 w-4" />
                    {copied ? "Copied" : "Copy Report Text"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Shoot Type Distribution
                </h3>

                {clientShootTypes.length === 0 ? (
                  <EmptyState text="No client shoot data." compact />
                ) : (
                  <div className="space-y-3">
                    {clientShootTypes.map(([type, count]) => (
                      <div key={type}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-300">{type}</span>
                          <span className="text-slate-500">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${
                                (count /
                                  Math.max(
                                    ...clientShootTypes.map((item) => item[1]),
                                    1
                                  )) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {clientReportOpen && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl print:border-0 print:shadow-none">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                      Ramazan Esen Photography
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">
                      Client Collaboration Report
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      A summary of our work together
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold">{selectedClient.name}</p>
                    {clientFirstDate && clientLastDate && (
                      <p className="text-sm text-slate-500">
                        {formatDate(clientFirstDate)} –{" "}
                        {formatDate(clientLastDate)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 border-b border-slate-200 py-5 sm:grid-cols-2 lg:grid-cols-4">
                  <PreviewStat
                    label="Total Shoots"
                    value={String(selectedClientShoots.length)}
                  />
                  <PreviewStat
                    label="Completed"
                    value={String(clientCompletedShoots.length)}
                  />
                  <PreviewStat
                    label="Shoot Types"
                    value={String(clientShootTypes.length)}
                  />
                  {shareOptions.showTotalAmount && (
                    <PreviewStat
                      label="Total Value"
                      value={formatCurrency(clientTotal)}
                    />
                  )}
                </div>

                <div className="pt-5">
                  <h4 className="mb-3 font-bold">Collaboration History</h4>

                  <div className="space-y-3">
                    {selectedClientShoots.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No work records found for this period.
                      </p>
                    ) : (
                      selectedClientShoots.map((shoot) => (
                        <div
                          key={shoot.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{shoot.shoot_type}</p>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase text-slate-600">
                                  {shoot.status}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                {shareOptions.showDates && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {formatDate(shoot.date)}
                                  </span>
                                )}

                                {shareOptions.showLocations && shoot.location && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {shoot.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              {shareOptions.showIndividualPrices && (
                                <span className="font-bold">
                                  {formatCurrency(Number(shoot.price || 0))}
                                </span>
                              )}

                              {shareOptions.showGalleryLinks &&
                                shoot.drive_link && (
                                  <a
                                    href={shoot.drive_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                  >
                                    <Link2 className="h-3.5 w-3.5" />
                                    View Gallery
                                  </a>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-400">
                  This report contains only the information selected for sharing.
                  Private CRM notes and contact details are excluded.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-10 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              Select a client to create a collaboration report.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-xl">
      <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/70 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function ClientStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "py-8 text-center" : "p-12 text-center"}>
      <FileText className="mx-auto h-9 w-9 text-slate-600" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}
