import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Calendar, CheckCircle, TrendingUp, Users, 
  Search, Download, Filter, FileSpreadsheet, ArrowUpDown, Briefcase, Receipt
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  title: string;
  amount: string;
}

interface Shoot {
  id: string;
  client_name: string;
  title?: string;
  shoot_title?: string;
  name?: string;
  price: number;
  expense?: number;
  expense_items?: ExpenseItem[];
  status: 'planned' | 'completed' | 'cancelled';
  shoot_type?: string;
  category?: string;
  date?: string;
  created_at?: string;
  [key: string]: any;
}

interface ReportsPageProps {
  shoots: Shoot[];
}

export default function ReportsPage({ shoots }: ReportsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'client_name' | 'date' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getWeekNumber = (dateString: string) => {
    if (!dateString) return 'Bilinmiyor';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Bilinmiyor';
    const onejan = new Date(d.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    const week = Math.ceil((((d.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
    return `Hafta ${week}`;
  };

  const getMonthName = (dateString: string) => {
    if (!dateString) return 'Bilinmiyor';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Bilinmiyor';
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const filteredShoots = useMemo(() => {
    return shoots.filter(shoot => {
      const clientName = (shoot.client_name || '').toLowerCase();
      const shootTitle = (shoot.title || shoot.shoot_title || shoot.name || 'İsimsiz Çekim').toLowerCase();
      const category = (shoot.shoot_type || shoot.category || 'Genel').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = clientName.includes(term) || shootTitle.includes(term) || category.includes(term);
      const matchesStatus = statusFilter === 'all' || shoot.status === statusFilter;

      let matchesTime = true;
      const shootDate = shoot.date || shoot.created_at;
      if (timeFilter !== 'all' && shootDate) {
        const d = new Date(shootDate);
        const now = new Date();
        if (isNaN(d.getTime())) {
          matchesTime = true;
        } else if (timeFilter === 'this_month') {
          matchesTime = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesTime = d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
        } else if (timeFilter === 'this_year') {
          matchesTime = d.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [shoots, searchTerm, statusFilter, timeFilter]);

  const sortedShoots = useMemo(() => {
    return [...filteredShoots].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'price') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredShoots, sortField, sortOrder]);

  const completedShoots = filteredShoots.filter(s => s.status === 'completed');
  const totalGross = completedShoots.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalExpense = completedShoots.reduce((acc, s) => acc + (Number(s.expense) || 0), 0);
  const totalNet = totalGross - totalExpense;

  const plannedCount = filteredShoots.filter(s => s.status === 'planned').length;
  const completedCount = completedShoots.length;
  const averagePerShoot = completedCount > 0 ? Math.round(totalNet / completedCount) : 0;

  const exportToExcel = () => {
    const headers = ['Musteri Adi', 'Cekim Basligi', 'Kategori', 'Tarih', 'Durum', 'Brüt Tutar (TL)', 'Masraf (TL)', 'Net Kar (TL)'];
    const rows = sortedShoots.map(s => {
      const p = Number(s.price) || 0;
      const ex = Number(s.expense) || 0;
      const net = p - ex;
      return [
        `"${s.client_name || 'Bilinmiyor'}"`,
        `"${s.title || s.shoot_title || s.name || 'İsimsiz Çekim'}"`,
        `"${s.shoot_type || s.category || 'Genel'}"`,
        `"${s.date || s.created_at || 'Belirtilmemiş'}"`,
        `"${s.status}"`,
        p,
        ex,
        net
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'shootflow_finansal_rapor.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'client_name' | 'date' | 'price') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Üst Başlık ve Excel Dışa Aktar Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-bold">Gelişmiş Finansal Rapor ve Müşteri Matrisi</h2>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Excel Olarak İndir (.CSV)
        </button>
      </div>

      {/* Finansal Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Toplam Net Kâr</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">₺{totalNet.toLocaleString()}</p>
          <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-700/50">
            <span>Brüt: ₺{totalGross.toLocaleString()}</span>
            <span className="text-red-400">Masraf: ₺{totalExpense.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Toplam Çekim Adedi</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{filteredShoots.length} <span className="text-xs text-slate-400 font-normal">({completedCount} Tamamlanan)</span></p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Çekim Başına Ortalama Net</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">₺{averagePerShoot.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Planlanan İşler</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{plannedCount}</p>
        </div>
      </div>

      {/* Filtreleme ve Arama Çubuğu */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı, başlık veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="completed">Tamamlananlar</option>
            <option value="planned">Planlananlar</option>
            <option value="cancelled">İptal Edilenler</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="this_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
            <option value="this_year">Bu Yıl</option>
          </select>
        </div>
      </div>

      {/* Excel Tarzı Detaylı Tablo */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                <th onClick={() => toggleSort('client_name')} className="p-3.5 font-semibold cursor-pointer hover:text-indigo-300 transition">
                  <div className="flex items-center gap-1.5">
                    Müşteri Adı <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 font-semibold">Çekim Başlığı</th>
                <th className="p-3.5 font-semibold">Kategori / Tür</th>
                <th onClick={() => toggleSort('date')} className="p-3.5 font-semibold cursor-pointer hover:text-indigo-300 transition">
                  <div className="flex items-center gap-1.5">
                    Tarih & Zaman <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 font-semibold">Durum</th>
                <th className="p-3.5 font-semibold text-right">Brüt (₺)</th>
                <th className="p-3.5 font-semibold text-right">Masraf (₺)</th>
                <th onClick={() => toggleSort('price')} className="p-3.5 font-semibold text-right cursor-pointer hover:text-indigo-300 transition">
                  <div className="flex items-center justify-end gap-1.5">
                    Net Kâr (₺) <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {sortedShoots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    Aranan kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                sortedShoots.map((shoot, idx) => {
                  const shootDate = shoot.date || shoot.created_at || '';
                  const monthStr = getMonthName(shootDate);
                  const weekStr = getWeekNumber(shootDate);
                  const title = shoot.title || shoot.shoot_title || shoot.name || 'İsimsiz Çekim';
                  const category = shoot.shoot_type || shoot.category || 'Genel';
                  
                  const price = Number(shoot.price) || 0;
                  const expense = Number(shoot.expense) || 0;
                  const netProfit = price - expense;

                  return (
                    <tr key={shoot.id || idx} className="hover:bg-slate-750/50 transition">
                      <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>{shoot.client_name || 'Bilinmeyen Müşteri'}</span>
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">{title}</td>
                      <td className="p-3.5">
                        <span className="bg-slate-900 text-indigo-300 px-2 py-0.5 rounded text-[11px] border border-slate-700/50">
                          {category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <div>{shootDate ? new Date(shootDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}</div>
                        <div className="text-[10px] text-slate-500">{monthStr} / {weekStr}</div>
                      </td>
                      <td className="p-3.5">
                        {shoot.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle className="w-3 h-3" /> Tamamlandı
                          </span>
                        )}
                        {shoot.status === 'planned' && (
                          <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-full text-[11px]">
                            <Calendar className="w-3 h-3" /> Planlandı
                          </span>
                        )}
                        {shoot.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full text-[11px]">
                            İptal
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-300">₺{price.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-medium text-red-400">₺{expense.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-bold text-green-400">₺{netProfit.toLocaleString()}</td>
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
