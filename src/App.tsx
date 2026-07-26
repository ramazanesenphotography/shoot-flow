import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  DollarSign,
  Edit,
  ChevronDown,
  ChevronUp,
  Users,
  History,
  UserPlus,
  ExternalLink,
  FileText,
  Home,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
  avatar_url?: string;
  created_at?: string;
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: string;
}

interface Shoot {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  shoot_type: string;
  location: string;
  date: string;
  time: string;
  price: number;
  expense?: number;
  expense_items?: ExpenseItem[];
  status: 'planned' | 'completed' | 'cancelled';
  notes: string;
  drive_link?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'shoots' | 'clients' | 'reports'>('shoots');
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  const [expandedShootId, setExpandedShootId] = useState<string | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  const [isShootModalOpen, setIsShootModalOpen] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [clientFormData, setClientFormData] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    avatar_url: '',
    shoot_type: 'Portrait / Concept',
    location: '',
    date: '',
    time: '',
    price: '',
    notes: '',
    drive_link: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: shootsData } = await supabase.from('shoots').select('*').order('date', { ascending: true });
      const { data: clientsData } = await supabase.from('clients').select('*').order('name', { ascending: true });

      setShoots(shootsData || []);
      setClients(clientsData || []);
      if (clientsData && clientsData.length > 0 && !selectedClientForDetail) {
        setSelectedClientForDetail(clientsData[0]);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: string) => { setExpandedShootId(expandedShootId === id ? null : id); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setClientFormData({ ...clientFormData, [e.target.name]: e.target.value }); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setAvatarFile(e.target.files[0]); };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { id: Math.random().toString(36).substring(2, 9), title: '', amount: '' }]);
  };

  const updateExpenseItem = (id: string, field: 'title' | 'amount', value: string) => {
    setExpenseItems(expenseItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('client-avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('client-avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClientId(val);
    setAvatarFile(null);
    if (val === 'new') {
      setFormData(prev => ({ ...prev, client_name: '', client_phone: '', client_email: '', avatar_url: '' }));
    } else {
      const selected = clients.find(c => c.id === val);
      if (selected) {
        setFormData(prev => ({ ...prev, client_name: selected.name, client_phone: selected.phone || '', client_email: selected.email || '', avatar_url: selected.avatar_url || '' }));
      }
    }
  };

  const resetForm = () => {
    setSelectedClientId('new');
    setAvatarFile(null);
    setExpenseItems([]);
    setFormData({ client_name: '', client_phone: '', client_email: '', avatar_url: '', shoot_type: 'Portrait / Concept', location: '', date: '', time: '', price: '', notes: '', drive_link: '' });
    setEditingShootId(null);
  };

  const handleOpenAddShootModal = () => {
    resetForm();
    setIsShootModalOpen(true);
  };

  const handleOpenAddClientModal = () => {
    setAvatarFile(null);
    setClientFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setIsClientModalOpen(true);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let avatarUrl = '';
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }
      const { data: newClient, error } = await supabase.from('clients').insert([{ 
        user_id: 'local',
        name: clientFormData.name, 
        phone: clientFormData.phone, 
        email: clientFormData.email, 
        address: clientFormData.address, 
        notes: clientFormData.notes, 
        avatar_url: avatarUrl 
      }]).select();
      
      if (error) throw error;
      if (newClient && newClient[0]) {
        setClients(prev => [...prev, newClient[0]]);
        setSelectedClientForDetail(newClient[0]);
      }
      setIsClientModalOpen(false);
      loadData();
    } catch (error) { alert('Müşteri eklenemedi.'); }
  };

  const handleShootSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }
      let finalClientId = selectedClientId !== 'new' ? selectedClientId : undefined;
      if (selectedClientId === 'new' && formData.client_name) {
        const { data: newClient } = await supabase.from('clients').insert([{ user_id: 'local', name: formData.client_name, phone: formData.client_phone, email: formData.client_email, avatar_url: avatarUrl }]).select();
        if (newClient && newClient[0]) {
          finalClientId = newClient[0].id;
          setClients(prev => [...prev, newClient[0]]);
        }
      }

      const totalExpenseCalculated = expenseItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

      const shootPayload = { 
        user_id: 'local',
        client_id: finalClientId, 
        client_name: formData.client_name, 
        client_phone: formData.client_phone, 
        client_email: formData.client_email, 
        shoot_type: formData.shoot_type, 
        location: formData.location, 
        date: formData.date, 
        time: formData.time, 
        price: parseFloat(formData.price) || 0, 
        expense: totalExpenseCalculated,
        expense_items: expenseItems,
        notes: formData.notes, 
        drive_link: formData.drive_link 
      };

      if (editingShootId) {
        await supabase.from('shoots').update(shootPayload).eq('id', editingShootId);
      } else {
        await supabase.from('shoots').insert([{ ...shootPayload, status: 'planned' }]);
      }
      setIsShootModalOpen(false);
      resetForm();
      loadData();
    } catch (error) { alert('İşlem başarısız.'); }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('shoots').update({ status: newStatus }).eq('id', id);
    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    await supabase.from('shoots').delete().eq('id', id);
    loadData();
  };

  const handleOpenEditModal = (shoot: Shoot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShootId(shoot.id);
    setSelectedClientId(shoot.client_id || 'new');
    setAvatarFile(null);
    setExpenseItems(shoot.expense_items || []);
    const client = clients.find(c => c.id === shoot.client_id);
    setFormData({ 
      client_name: shoot.client_name || '', 
      client_phone: shoot.client_phone || '', 
      client_email: shoot.client_email || '', 
      avatar_url: client?.avatar_url || '', 
      shoot_type: shoot.shoot_type || 'Portrait / Concept', 
      location: shoot.location || '', 
      date: shoot.date || '', 
      time: shoot.time || '', 
      price: shoot.price ? shoot.price.toString() : '', 
      notes: shoot.notes || '', 
      drive_link: shoot.drive_link || '' 
    });
    setIsShootModalOpen(true);
  };

  const filteredShoots = shoots
    .filter(s => {
      const matchesSearch = (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase())) || (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.status === 'planned' && b.status !== 'planned') return -1;
      if (a.status !== 'planned' && b.status === 'planned') return 1;

      const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
      const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
      return dateA - dateB;
    });

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">Cancelled</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">Planned</span>;
    }
  };

  // Rapor & Finansal Matris Hesaplamaları
  const activeShoots = shoots.filter(s => s.status !== 'cancelled');
  const totalGross = activeShoots.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalExpense = activeShoots.reduce((acc, s) => acc + (Number(s.expense) || 0), 0);
  const totalNet = totalGross - totalExpense;
  const totalShootsCount = shoots.length;
  const completedCount = shoots.filter(s => s.status === 'completed').length;
  const plannedCount = shoots.filter(s => s.status === 'planned').length;
  const avgNet = completedCount > 0 ? Math.round(totalNet / completedCount) : 0;

  const filteredReportShoots = shoots.filter(s => {
    const matchesSearch = 
      (s.client_name && s.client_name.toLowerCase().includes(reportSearchTerm.toLowerCase())) ||
      (s.shoot_type && s.shoot_type.toLowerCase().includes(reportSearchTerm.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(reportSearchTerm.toLowerCase()));
    const matchesStatus = reportStatusFilter === 'all' || s.status === reportStatusFilter;
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Camera className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ShootFlow</h1>
              <p className="text-xs text-slate-400">Shoot & Client CRM</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button onClick={() => setActiveTab('shoots')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'shoots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Shoot Calendar</button>
            <button onClick={() => setActiveTab('clients')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Client Portfolio</button>
            <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Reports</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleOpenAddShootModal} className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow">
              <Plus className="w-4 h-4" /><span>New Shoot</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* SEKME 1: SHOOT CALENDAR */}
        {activeTab === 'shoots' && (
          <>
            <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search shoot or client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm outline-none" />
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 w-full md:w-auto outline-none">
                  <option value="all">All Statuses</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>
            ) : filteredShoots.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center"><Camera className="w-10 h-10 text-slate-500 mx-auto mb-3" /><h3 className="text-base font-medium text-slate-300">No Shoots Found</h3></div>
            ) : (
              <div className="space-y-2">
                {filteredShoots.map((shoot) => {
                  const isExpanded = expandedShootId === shoot.id;
                  const client = clients.find(c => c.id === shoot.client_id || c.name.toLowerCase() === shoot.client_name.toLowerCase());
                  const shootPrice = Number(shoot.price) || 0;
                  const shootExpense = Number(shoot.expense) || 0;
                  const shootNet = shootPrice - shootExpense;

                  return (
                    <div key={shoot.id} className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
                      <div onClick={() => toggleExpand(shoot.id)} className="p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-700/50 transition">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {client?.avatar_url ? <img src={client.avatar_url} alt={shoot.client_name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-600" /> : <div className="p-2 bg-slate-700/60 rounded-lg text-indigo-400 shrink-0"><User className="w-4 h-4" /></div>}
                          <div className="truncate"><h3 className="font-semibold text-slate-100 text-sm truncate">{shoot.client_name}</h3><p className="text-xs text-slate-400 truncate">{shoot.shoot_type}</p></div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0 text-xs">
                          <div className="hidden sm:flex items-center justify-center w-28 py-1 px-2 bg-slate-900/80 rounded-lg border border-slate-700/60 text-slate-200 font-medium"><Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1 shrink-0" /><span>{shoot.date || 'No Date'}</span></div>
                          <div>{getStatusBadge(shoot.status)}</div>
                          <div className="text-slate-400 p-1">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="p-4 bg-slate-900/90 border-t border-slate-700/60 space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                            {shoot.client_phone && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40"><Phone className="w-3.5 h-3.5 text-indigo-400" /><span>{shoot.client_phone}</span></div>}
                            {shoot.client_email && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40"><Mail className="w-3.5 h-3.5 text-indigo-400" /><span className="truncate">{shoot.client_email}</span></div>}
                            {shoot.location && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40 sm:col-span-3"><MapPin className="w-3.5 h-3.5 text-indigo-400" /><span>{shoot.location}</span></div>}
                            
                            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                              <span className="text-slate-400">Price (Brüt):</span>
                              <span className="font-bold text-slate-200">₺{shootPrice}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                              <span className="text-slate-400">Expense (Masraf):</span>
                              <span className="font-bold text-red-400">₺{shootExpense}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                              <span className="text-slate-400">Net Kâr:</span>
                              <span className="font-bold text-green-400">₺{shootNet}</span>
                            </div>
                          </div>

                          {shoot.expense_items && shoot.expense_items.length > 0 && (
                            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 space-y-1.5">
                              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Receipt className="w-3.5 h-3.5 text-red-400" /> Masraf Kalemleri
                              </div>
                              <div className="space-y-1">
                                {shoot.expense_items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                                    <span>{item.title || 'İsimsiz Masraf'}</span>
                                    <span className="font-semibold text-red-400">₺{item.amount || 0}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {shoot.drive_link && <div><a href={shoot.drive_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/50 text-blue-200 border border-blue-700 rounded-lg"><ExternalLink className="w-3.5 h-3.5 text-blue-400" /><span>Open Gallery Link</span></a></div>}
                          {shoot.notes && <div className="p-2.5 bg-slate-800/50 rounded-lg text-slate-300 italic">"{shoot.notes}"</div>}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                            <div className="flex space-x-2">
                              {shoot.status !== 'completed' && <button onClick={(e) => handleStatusChange(shoot.id, 'completed', e)} className="px-2.5 py-1 bg-green-950 text-green-300 border border-green-800 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</button>}
                              {shoot.status !== 'cancelled' && <button onClick={(e) => handleStatusChange(shoot.id, 'cancelled', e)} className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancel</button>}
                            </div>
                            <div className="flex space-x-1">
                              <button onClick={(e) => handleOpenEditModal(shoot, e)} className="p-1.5 text-slate-400 hover:text-indigo-400"><Edit className="w-4 h-4" /></button>
                              <button onClick={(e) => handleDelete(shoot.id, e)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* SEKME 2: CLIENT PORTFOLIO */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm outline-none" />
              </div>
              <button onClick={handleOpenAddClientModal} className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition text-xs shadow w-full sm:w-auto justify-center">
                <UserPlus className="w-4 h-4" /><span>Yeni Müşteri Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Müşteriler ({filteredClients.length})</h2>
                {filteredClients.map(client => (
                  <div key={client.id} onClick={() => setSelectedClientForDetail(client)} className={`p-3.5 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedClientForDetail?.id === client.id ? 'bg-indigo-950/60 border-indigo-500 shadow-md' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                    <div className="flex items-center space-x-3">
                      {client.avatar_url ? <img src={client.avatar_url} alt={client.name} className="w-10 h-10 rounded-lg object-cover border border-slate-700" /> : <div className="w-10 h-10 rounded-lg bg-slate-700/80 flex items-center justify-center text-indigo-400"><User className="w-5 h-5" /></div>}
                      <div><h3 className="font-semibold text-slate-100 text-sm">{client.name}</h3><p className="text-xs text-slate-400">{client.phone || 'Telefon yok'}</p></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2">
                {selectedClientForDetail ? (
                  <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center space-x-4 border-b border-slate-700 pb-4">
                      {selectedClientForDetail.avatar_url ? (
                        <img src={selectedClientForDetail.avatar_url} alt={selectedClientForDetail.name} className="w-16 h-16 rounded-xl object-cover border border-indigo-500/50" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-indigo-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-slate-100">{selectedClientForDetail.name}</h2>
                        <p className="text-xs text-indigo-400 font-medium">Müşteri Detay Kartı ve Geçmiş Arşivi</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-400" /> Telefon</span>
                        <p className="font-semibold text-slate-200">{selectedClientForDetail.phone || 'Belirtilmemiş'}</p>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> E-posta</span>
                        <p className="font-semibold text-slate-200 truncate">{selectedClientForDetail.email || 'Belirtilmemiş'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1 text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-indigo-400" /> Adres</span>
                      <p className="text-slate-200">{selectedClientForDetail.address || 'Kayıtlı adres bulunmuyor.'}</p>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1 text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Müşteri Özel Notları</span>
                      <p className="text-slate-300 italic">{selectedClientForDetail.notes || 'Özel not eklenmemiş.'}</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-4 h-4 text-indigo-400" /> Geçmiş Çekimler & Kâr Arşivi
                        </h3>
                        {(() => {
                          const clientShoots = shoots.filter(s => s.client_id === selectedClientForDetail.id || (s.client_name && s.client_name.toLowerCase() === selectedClientForDetail.name.toLowerCase()));
                          const totalGross = clientShoots.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
                          const totalExpense = clientShoots.reduce((acc, s) => acc + (Number(s.expense) || 0), 0);
                          const totalNet = totalGross - totalExpense;
                          return (
                            <div className="text-xs font-bold text-green-400 bg-green-950/60 border border-green-800/60 px-3 py-1 rounded-lg">
                              Net Kâr: ₺{totalNet.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">(Brüt: ₺{totalGross.toLocaleString()})</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {shoots.filter(s => s.client_id === selectedClientForDetail.id || (s.client_name && s.client_name.toLowerCase() === selectedClientForDetail.name.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-slate-500 italic bg-slate-900/40 p-4 rounded-xl text-center">Bu müşteriye ait geçmiş çekim kaydı bulunamadı.</p>
                        ) : (
                          shoots
                            .filter(s => s.client_id === selectedClientForDetail.id || (s.client_name && s.client_name.toLowerCase() === selectedClientForDetail.name.toLowerCase()))
                            .map(shoot => {
                              const p = Number(shoot.price) || 0;
                              const ex = Number(shoot.expense) || 0;
                              const net = p - ex;
                              return (
                                <div key={shoot.id} className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs gap-2">
                                  <div className="space-y-0.5">
                                    <div className="font-semibold text-slate-200">{shoot.shoot_type}</div>
                                    <div className="text-slate-400 flex items-center gap-2">
                                      <span><Calendar className="w-3 h-3 inline mr-1 text-indigo-400" />{shoot.date || 'Tarih yok'}</span>
                                      <span><MapPin className="w-3 h-3 inline mr-1 text-indigo-400" />{shoot.location || 'Konum yok'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-0.5 shrink-0">
                                    <div className="font-bold text-green-400">Net: ₺{net.toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-400">Brüt: ₺{p} | Masraf: <span className="text-red-400">₺{ex}</span></div>
                                    <div>{getStatusBadge(shoot.status)}</div>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center text-slate-400">Detaylarını görmek için sol taraftan bir müşteri seçin.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEKME 3: REPORTS & FINANCIAL MATRIX */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
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

            {/* 4'lü Gelişmiş Özet Kartı (Brüt ve Masraf Kırılımlı) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Toplam Çekim Adedi</span>
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100">{totalShootsCount} <span className="text-xs font-normal text-slate-400">({completedCount} Tamamlanan)</span></div>
              </div>

              <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Çekim Başına Ortalama Net</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100">₺{avgNet.toLocaleString()}</div>
              </div>

              <div className="bg-slate-800 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Planlanan İşler</span>
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100">{plannedCount}</div>
              </div>
            </div>

            {/* Arama ve Durum Filtreleme Çubukları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Müşteri adı, başlık veya kategori ara..."
                  value={reportSearchTerm}
                  onChange={(e) => setReportSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="planned">Planlanan</option>
                  <option value="completed">Tamamlanan</option>
                  <option value="cancelled">İptal Edilen</option>
                </select>
              </div>
            </div>

            {/* Tablo Matrisi */}
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
                    {filteredReportShoots.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                          Aranan kriterlere uygun kayıt bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredReportShoots.map(shoot => {
                        const p = Number(shoot.price) || 0;
                        const ex = Number(shoot.expense) || 0;
                        const net = p - ex;
                        return (
                          <tr key={shoot.id} className="hover:bg-slate-700/35 transition">
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
        )}
      </main>

      {/* Yeni Müşteri Modalı */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 mb-4">Yeni Müşteri Ekle</h2>
            <form onSubmit={handleClientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Müşteri Fotoğrafı / Avatarı</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900 border border-slate-700 rounded-lg p-1" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Ad Soyad / Firma Adı *</label>
                <input type="text" name="name" required placeholder="Ad Soyad veya Firma" value={clientFormData.name} onChange={handleClientInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Telefon</label>
                <input type="text" name="phone" placeholder="+90 (555) 000 00 00" value={clientFormData.phone} onChange={handleClientInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">E-posta</label>
                <input type="email" name="email" placeholder="ornek@domain.com" value={clientFormData.email} onChange={handleClientInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Adres</label>
                <input type="text" name="address" placeholder="Açık adres detayları" value={clientFormData.address} onChange={handleClientInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Özel Notlar</label>
                <textarea name="notes" placeholder="Müşteri hakkında özel notlar..." rows={3} value={clientFormData.notes} onChange={handleClientInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="w-1/2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition font-medium">İptal</button>
                <button type="submit" disabled={uploadingAvatar} className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition font-medium shadow-sm">{uploadingAvatar ? 'Yükleniyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Çekim Modalı */}
      {isShootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 mb-4">{editingShootId ? 'Çekimi Düzenle' : 'Yeni Çekim Ekle'}</h2>
            <form onSubmit={handleShootSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Müşteri Seç</label>
                <select value={selectedClientId} onChange={handleClientSelectChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500">
                  <option value="new">+ Yeni Müşteri</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Müşteri Adı *</label>
                <input type="text" name="client_name" required placeholder="Müşteri Adı" value={formData.client_name} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Çekim Türü / Başlığı</label>
                <input type="text" name="shoot_type" placeholder="Örn: Portre / Konsept / Voleybol Maçı" value={formData.shoot_type} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Tarih *</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Saat</label>
                  <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Konum</label>
                <input type="text" name="location" placeholder="Stüdyo veya Salon konumu" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Brüt Fiyat (₺)</label>
                <input type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>

              <div className="bg-slate-900/60 border border-slate-700/80 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-red-400" /> Masraf Kalemleri (İsteğe Bağlı)
                  </span>
                  <button
                    type="button"
                    onClick={addExpenseItem}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Kalem Ekle
                  </button>
                </div>

                {expenseItems.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-1">Yol, yemek, ekipman vb. masraflar ekleyebilirsiniz.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {expenseItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Açıklama (Örn: Yol, Yemek)"
                          value={item.title}
                          onChange={(e) => updateExpenseItem(item.id, 'title', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Tutar (₺)"
                          value={item.amount}
                          onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                          className="w-24 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeExpenseItem(item.id)}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg border border-red-800/40 transition"
                          title="Kalemi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="text-right text-[11px] font-bold text-red-400 pt-1 border-t border-slate-800">
                      Toplam Masraf: ₺{expenseItems.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Drive / Galeri Linki</label>
                <input type="url" name="drive_link" placeholder="https://..." value={formData.drive_link} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Çekim Notları</label>
                <textarea name="notes" placeholder="Bu çekim için özel notlar..." rows={2} value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setIsShootModalOpen(false)} className="w-1/2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition font-medium">İptal</button>
                <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition font-medium shadow-sm">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
