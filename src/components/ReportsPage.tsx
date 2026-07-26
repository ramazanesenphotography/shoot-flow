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
  Search,
  Filter,
  Briefcase
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
  time?: string;
  price: number;
  expense?: number;
  expense_items?: ExpenseItem[];
  status: 'planned' | 'completed' | 'cancelled';
  location?: string;
}

interface ReportsPageProps {
  shoots: Shoot[];
}

export default function ReportsPage({ shoots }: ReportsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // İstatistik hesaplamaları
  const activeShoots = shoots.filter(s => s.status !== 'cancelled');
  const totalGross = activeShoots.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalExpense = activeShoots.reduce((acc, s) => acc + (Number(s.expense) || 0), 0);
  const totalNet = totalGross - totalExpense;

  const totalShootsCount = shoots.length;
  const completedCount = shoots.filter(s => s.status === 'completed').length;
  const plannedCount = shoots.filter(s => s.status === 'planned').length;
  
  const avgNet = completedCount > 0 ? Math.round(totalNet / completedCount) : 0;

  // Filtreleme mantığı
  const filteredShoots = shoots.filter(s => {
    const matchesSearch = 
      (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.shoot_type && s.shoot_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Musteri Adi", "Cekim Basligi", "Kategori / Tur", "Tarih", "Durum", "Brut (₺)", "Masraf (₺)", "Net Kar (₺)"];
    const rows = shoots.map(s => {
      const p = Number(s.price) || 0;
      const ex = Number(s.expense) || 0;
      return [
        `"${s.client_name || ''}"`,
        `"${s.shoot_type || ''}"`,
        `"${s.shoot_type || ''}"`,
        s.date || '',
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
    link.setAttribute("download", `shootflow_gelismis_rapor_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">Cancelled</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">Planned</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Excel İndir Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2 text-slate-100">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold">Gelişmiş Finansal Rapor ve Müşteri Matrisi</h2>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Olarak İndir (.CSV)</span>
        </button>
      </div>

      {/* 4'lü Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Net Kâr */}
        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Net Kâr</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">₺{totalNet.toLocaleString()}</div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
            <span>Brüt: ₺{totalGross.toLocaleString()}</span>
            <span className="text-red-400">Masraf: ₺{totalExpense.toLocaleString()}</span>
          </div>
        </div>

        {/* Toplam Çekim Adedi */}
        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Çekim Adedi</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalShootsCount} <span className="text-xs font-normal text-slate-400">({completedCount} Tamamlanan)</span></div>
        </div>

        {/* Çekim Başına Ortalama Net */}
        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Çekim Başına Ortalama Net</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">₺{avgNet.toLocaleString()}</div>
        </div>

        {/* Planlanan İşler */}
        <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Planlanan İşler</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{plannedCount}</div>
        </div>
      </div>

      {/* Filtreleme ve Arama Çubuğu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı, başlık veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="planned">Planlanan</option>
            <option value="completed">Tamamlanan</option>
            <option value="cancelled">İptal Edilen</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="this_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
          </select>
        </div>
      </div>

      {/* Tablo Alanı */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 bg-slate-800/80">
                <th className="py-3.5 px-4 font-medium">Müşteri Adı ↕</th>
                <th className="py-3.5 px-4 font-medium">Çekim Başlığı</th>
                <th className="py-3.5 px-4 font-medium">Kategori / Tür</th>
                <th className="py-3.5 px-4 font-medium">Tarih & Zaman ↕</th>
                <th className="py-3.5 px-4 font-medium">Durum</th>
                <th className="py-3.5 px-4 font-medium">Brüt (₺)</th>
                <th className="py-3.5 px-4 font-medium">Masraf (₺)</th>
                <th className="py-3.5 px-4 font-medium text-right">Net Kâr (₺) ↕</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {filteredShoots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                    Aranan kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredShoots.map(shoot => {
                  const p = Number(shoot.price) || 0;
                  const ex = Number(shoot.expense) || 0;
                  const net = p - ex;
                  return (
                    <tr key={shoot.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{shoot.client_name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{shoot.shoot_type}</td>
                      <td className="py-3.5 px-4 text-slate-400">{shoot.shoot_type}</td>
                      <td className="py-3.5 px-4 text-slate-300">{shoot.date} {shoot.time ? `• ${shoot.time}` : ''}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(shoot.status)}</td>
                      <td className="py-3.5 px-4 font-medium">₺{p}</td>
                      <td className="py-3.5 px-4 text-red-400 font-medium">₺{ex}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-green-400">₺{net}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
