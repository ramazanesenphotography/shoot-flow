import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  PieChart,
  BarChart3
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  title: string;
  amount: string;
}

interface Shoot {
  id: string;
  client_name: string;
  shoot_type: string;
  date: string;
  price: number;
  expense?: number;
  expense_items?: ExpenseItem[];
  status: 'planned' | 'completed' | 'cancelled';
}

interface ReportsPageProps {
  shoots: Shoot[];
}

export default function ReportsPage({ shoots }: ReportsPageProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'completed' | 'planned'>('all');

  const activeShoots = shoots.filter(s => {
    if (filterPeriod === 'completed') return s.status === 'completed';
    if (filterPeriod === 'planned') return s.status === 'planned';
    return s.status !== 'cancelled';
  });

  const totalShoots = shoots.length;
  const completedShoots = shoots.filter(s => s.status === 'completed').length;
  const plannedShoots = shoots.filter(s => s.status === 'planned').length;
  const cancelledShoots = shoots.filter(s => s.status === 'cancelled').length;

  const totalGross = activeShoots.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalExpense = activeShoots.reduce((acc, s) => acc + (Number(s.expense) || 0), 0);
  const totalNet = totalGross - totalExpense;

  const exportToCSV = () => {
    const headers = ["ID", "Musteri Adi", "Cekim Turu", "Tarih", "Durum", "Brut Tutar (₺)", "Masraf (₺)", "Net Kar (₺)"];
    const rows = shoots.map(s => {
      const p = Number(s.price) || 0;
      const ex = Number(s.expense) || 0;
      return [
        s.id,
        `"${s.client_name}"`,
        `"${s.shoot_type}"`,
        s.date,
        s.status,
        p,
        ex,
        p - ex
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shootflow_finansal_rapor_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Çekim türlerine göre dağılım
  const shootTypeStats: { [key: string]: { count: number; gross: number; net: number } } = {};
  activeShoots.forEach(s => {
    const type = s.shoot_type || 'Diğer';
    if (!shootTypeStats[type]) {
      shootTypeStats[type] = { count: 0, gross: 0, net: 0 };
    }
    const p = Number(s.price) || 0;
    const ex = Number(s.expense) || 0;
    shootTypeStats[type].count += 1;
    shootTypeStats[type].gross += p;
    shootTypeStats[type].net += (p - ex);
  });

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve CSV İndirme */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 border border-slate-700/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Finansal Raporlar & Detaylı Analiz</h2>
          <p className="text-xs text-slate-400">Brüt kazançlar, masraf kalemleri ve net kâr dökümleri.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">Aktif / Tüm Çekimler (İptaller Hariç)</option>
            <option value="completed">Sadece Tamamlananlar</option>
            <option value="planned">Sadece Planlananlar</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition shadow-sm whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV İndir</span>
          </button>
        </div>
      </div>

      {/* Finansal Özet Kartları (Brüt, Masraf, Net Kâr) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Brüt Gelir</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">₺{totalGross.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Masraflar</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">₺{totalExpense.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Net Kâr</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">₺{totalNet.toLocaleString()}</div>
        </div>
      </div>

      {/* Durum Sayaçları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Calendar className="w-3.5 h-3.5" /> Toplam Çekim</div>
          <div className="text-lg font-bold text-slate-100 mt-1">{totalShoots}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl text-center shadow-sm">
          <div className="text-xs text-blue-400 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Planlanan</div>
          <div className="text-lg font-bold text-blue-300 mt-1">{plannedShoots}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl text-center shadow-sm">
          <div className="text-xs text-green-400 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Tamamlanan</div>
          <div className="text-lg font-bold text-green-300 mt-1">{completedShoots}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl text-center shadow-sm">
          <div className="text-xs text-red-400 flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" /> İptal Edilen</div>
          <div className="text-lg font-bold text-red-300 mt-1">{cancelledShoots}</div>
        </div>
      </div>

      {/* Çekim Türlerine Göre Dağılım Tablosu */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" /> Çekim Türlerine Göre Performans
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="pb-2.5 font-medium">Çekim Türü</th>
                <th className="pb-2.5 font-medium text-center">Çekim Adedi</th>
                <th className="pb-2.5 font-medium text-right">Brüt Toplam</th>
                <th className="pb-2.5 font-medium text-right">Net Kâr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {Object.keys(shootTypeStats).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 italic">Veri bulunamadı.</td>
                </tr>
              ) : (
                Object.entries(shootTypeStats).map(([type, data]) => (
                  <tr key={type} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 font-medium text-slate-200">{type}</td>
                    <td className="py-3 text-center">{data.count}</td>
                    <td className="py-3 text-right">₺{data.gross.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-green-400">₺{data.net.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
