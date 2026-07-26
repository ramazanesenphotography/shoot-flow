import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, BarChart3, Plus, Search, FileSpreadsheet, 
  MapPin, ExternalLink, Phone, Mail, FileText, Trash2, Edit2, CheckCircle2, XCircle, Clock, DollarSign, Briefcase 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SENIN_SUPABASE_URL_ADRESIN';
const supabaseKey = 'SENIN_SUPABASE_ANON_KEY_DEGERIN';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [shoots, setShoots] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: shootsData, error: shootsError } = await supabase
        .from('shoots')
        .select('*, clients(name, phone, email, avatar, address)')
        .order('shoot_date', { ascending: false });

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (shootsError) throw shootsError;
      if (clientsError) throw clientsError;

      setShoots(shootsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
            <Briefcase className="w-6 h-6"/>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">Business Plan</h1>
            <p className="text-xs text-slate-400">Shoot & Client CRM</p>
          </div>
        </div>

        <nav className="flex space-x-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
          <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar className="w-4 h-4"/>} label="Shoot Calendar" />
          <TabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users className="w-4 h-4"/>} label="Client Portfolio" />
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 className="w-4 h-4"/>} label="Reports & Matrix" />
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">Yükleniyor...</div>
        ) : (
          <>
            {activeTab === 'calendar' && <ShootCalendarTab clients={clients} refresh={fetchData} shoots={shoots}/>}
            {activeTab === 'clients' && <ClientPortfolioTab clients={clients} refresh={fetchData} shoots={shoots}/>}
            {activeTab === 'reports' && <ReportsMatrixTab shoots={shoots}/>}
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ShootCalendarTab({ shoots, clients, refresh }) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '', title: '', category: 'Spor', shoot_date: '', location: '', drive_link: '', status: 'Planned', gross_income: 0, expenses: []
  });
  const [newExpense, setNewExpense] = useState({ name: '', amount: '' });

  const filteredShoots = shoots.filter(shoot => {
    const matchesStatus = filterStatus === 'All' || shoot.status === filterStatus;
    const matchesSearch = shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          shoot.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shoot.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  async function handleCreateShoot(e) {
    e.preventDefault();
    const total_expense = formData.expenses.reduce((acc, item) => acc + Number(item.amount), 0);
    const net_profit = Number(formData.gross_income) - total_expense;

    const { error } = await supabase.from('shoots').insert([{ ...formData, total_expense, net_profit }]);
    if (!error) {
      setIsModalOpen(false);
      refresh();
      setFormData({ client_id: '', title: '', category: 'Spor', shoot_date: '', location: '', drive_link: '', status: 'Planned', gross_income: 0, expenses: [] });
    }
  }

  function addExpenseItem() {
    if (!newExpense.name || !newExpense.amount) return;
    setFormData({ ...formData, expenses: [...formData.expenses, { name: newExpense.name, amount: Number(newExpense.amount) }] });
    setNewExpense({ name: '', amount: '' });
  }

  function removeExpenseItem(index) {
    setFormData({ ...formData, expenses: formData.expenses.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
            <input 
              type="text" placeholder="Çekim veya müşteri ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="All">Tüm Durumlar</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4"/>
          <span>New Shoot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShoots.map(shoot => (
          <div 
            key={shoot.id} onClick={() => setSelectedShoot(shoot)}
            className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-500 transition cursor-pointer flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300">{shoot.category}</span>
                <StatusBadge status={shoot.status}/>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{shoot.title}</h3>
              <p className="text-sm text-slate-400 mb-3">{shoot.clients?.name || 'Müşteri Yok'}</p>
              <div className="text-xs text-slate-300 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-blue-400"/>
                <span>{new Date(shoot.shoot_date).toLocaleString('tr-TR')}</span>
              </div>
            </div>
            <div className="border-t border-slate-700/60 pt-3 mt-4 flex justify-between items-center text-sm">
              <span className="text-xs text-slate-400">Net Kâr</span>
              <span className="font-bold text-emerald-400">{shoot.net_profit} ₺</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white">Yeni Çekim Ekle</h2>
            <form onSubmit={handleCreateShoot} className="space-y-3">
              <select 
                required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"
              >
                <option value="">Müşteri Seçin</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input 
                type="text" required placeholder="Çekim Başlığı" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="Kategori" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                />
                <select 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="datetime-local" required value={formData.shoot_date} onChange={e => setFormData({...formData, shoot_date: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300"
                />
                <input 
                  type="number" required placeholder="Brüt Gelir (₺)" value={formData.gross_income} onChange={e => setFormData({...formData, gross_income: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <span className="text-xs font-semibold text-slate-300">Dinamik Masraf Kalemleri</span>
                <div className="flex gap-2">
                  <input type="text" placeholder="Masraf Adı" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs"/>
                  <input type="number" placeholder="Tutar" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs"/>
                  <button type="button" onClick={addExpenseItem} className="bg-slate-700 px-3 py-1 rounded-xl text-xs">Ekle</button>
                </div>
                {formData.expenses.map((exp, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex justify-between bg-slate-900 px-3 py-1 rounded-lg">
                    <span>{exp.name}: {exp.amount}₺</span>
                    <button type="button" onClick={() => removeExpenseItem(idx)} className="text-red-400">×</button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-700 px-4 py-2 rounded-xl text-sm">İptal</button>
                <button type="submit" className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-medium">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedShoot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold text-white">{selectedShoot.title}</h2>
              <button onClick={() => setSelectedShoot(null)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2 text-sm bg-slate-900 p-3 rounded-xl">
              <div className="flex justify-between"><span className="text-slate-400">Müşteri:</span><span>{selectedShoot.clients?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Net Kâr:</span><span className="text-emerald-400 font-bold">{selectedShoot.net_profit} ₺</span></div>
            </div>
            <button onClick={() => setSelectedShoot(null)} className="w-full bg-slate-700 py-2 rounded-xl text-sm">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Planned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  return <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${styles[status]}`}>{status}</span>;
}

function ClientPortfolioTab({ clients, shoots, refresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(clients[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const clientShoots = shoots.filter(s => s.client_id === selectedClient?.id);
  const totalClientNet = clientShoots.reduce((acc, s) => acc + (s.net_profit || 0), 0);

  async function handleCreateClient(e) {
    e.preventDefault();
    const { error } = await supabase.from('clients').insert([clientForm]);
    if (!error) {
      setIsModalOpen(false);
      refresh();
      setClientForm({ name: '', phone: '', email: '', address: '', notes: '' });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 gap-2">
          <input 
            type="text" placeholder="Müşteri ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white p-2 rounded-xl"><Plus className="w-4 h-4"/></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredClients.map(client => (
            <div 
              key={client.id} onClick={() => setSelectedClient(client)}
              className={`p-3 rounded-xl border cursor-pointer ${selectedClient?.id === client.id ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-900/40 border-slate-700/40 text-slate-300'}`}
            >
              <h4 className="text-sm font-semibold">{client.name}</h4>
              <p className="text-xs text-slate-400">{client.phone || client.email || 'İletişim yok'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-slate-800 border border-slate-700/60 rounded-2xl p-6 flex flex-col h-full overflow-y-auto">
        {selectedClient ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedClient.name}</h2>
                <p className="text-xs text-slate-400">{selectedClient.phone} | {selectedClient.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Toplam Net Kâr</span>
                <span className="text-sm font-bold text-emerald-400">{totalClientNet} ₺</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Geçmiş Çekimler</h3>
              <div className="space-y-2">
                {clientShoots.map(shoot => (
                  <div key={shoot.id} className="bg-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                    <span>{shoot.title}</span>
                    <span className="text-emerald-400 font-bold">{shoot.net_profit} ₺</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 text-sm">Müşteri seçin.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Yeni Müşteri Ekle</h2>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <input type="text" required placeholder="İsim" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"/>
              <input type="text" placeholder="Telefon" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"/>
              <input type="email" placeholder="E-posta" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm"/>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-700 px-4 py-2 rounded-xl text-sm">İptal</button>
                <button type="submit" className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-medium">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsMatrixTab({ shoots }) {
  const totalNetProfit = shoots.reduce((acc, s) => acc + (s.net_profit || 0), 0);
  const plannedCount = shoots.filter(s => s.status === 'Planned').length;
  const completedCount = shoots.filter(s => s.status === 'Completed').length;
  const cancelledCount = shoots.filter(s => s.status === 'Cancelled').length;

  function exportToCSV() {
    const headers = ['Müşteri Adı', 'Çekim Başlığı', 'Kategori', 'Tarih', 'Durum', 'Net Kâr (TL)'];
    const rows = shoots.map(s => [
      `"${s.clients?.name || ''}"`,
      `"${s.title}"`,
      `"${s.category}"`,
      `"${new Date(s.shoot_date).toLocaleString('tr-TR')}"`,
      `"${s.status}"`,
      s.net_profit
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'business_plan_finansal_matris.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
          <span className="text-xs text-slate-400">Total Net Earnings</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">₺{totalNetProfit}</h3>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
          <span className="text-xs text-slate-400">Planned Shoots</span>
          <h3 className="text-2xl font-bold text-blue-400 mt-1">{plannedCount}</h3>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
          <span className="text-xs text-slate-400">Completed Shoots</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h3>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
          <span className="text-xs text-slate-400">Cancelled Shoots</span>
          <h3 className="text-2xl font-bold text-red-400 mt-1">{cancelledCount}</h3>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={exportToCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20"
        >
          <FileSpreadsheet className="w-4 h-4"/>
          <span>Excel Olarak İndir (.CSV)</span>
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs">
              <th className="p-4">Müşteri</th>
              <th className="p-4">Başlık</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Durum</th>
              <th className="p-4 text-right">Net Kâr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-300">
            {shoots.map(s => (
              <tr key={s.id} className="hover:bg-slate-700/30">
                <td className="p-4">{s.clients?.name}</td>
                <td className="p-4">{s.title}</td>
                <td className="p-4 text-slate-400">{s.category}</td>
                <td className="p-4"><StatusBadge status={s.status}/></td>
                <td className="p-4 text-right font-bold text-emerald-400">{s.net_profit} ₺</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
