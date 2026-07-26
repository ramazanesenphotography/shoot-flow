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
  Edit,
  ChevronDown,
  ChevronUp,
  Users,
  History,
  UserPlus,
  ExternalLink,
  FileText,
  Receipt
} from 'lucide-react';
import ReportsPage from './components/ReportsPage';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
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
  
  // ÖNCEKİ TÜM KAYITLARINI ASLA KAYBETMEDEN OKUYAN AKILLI YÜKLEYİCİ
  const [shoots, setShoots] = useState<Shoot[]>(() => {
    try {
      const s1 = localStorage.getItem('shootflow_shoots');
      const s2 = localStorage.getItem('shoots');
      const parsed = s1 ? JSON.parse(s1) : (s2 ? JSON.parse(s2) : []);
      return parsed;
    } catch (e) {
      return [];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const c1 = localStorage.getItem('shootflow_clients');
      const c2 = localStorage.getItem('clients');
      const parsed = c1 ? JSON.parse(c1) : (c2 ? JSON.parse(c2) : []);
      return parsed;
    } catch (e) {
      return [];
    }
  });

  // HER DEĞİŞİKLİKTE İKİ YERE BİRDEN OTOMATİK YEDEKLEME
  useEffect(() => {
    localStorage.setItem('shootflow_shoots', JSON.stringify(shoots));
    localStorage.setItem('shoots', JSON.stringify(shoots));
  }, [shoots]);

  useEffect(() => {
    localStorage.setItem('shootflow_clients', JSON.stringify(clients));
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedShootId, setExpandedShootId] = useState<string | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(clients[0] || null);

  const [isShootModalOpen, setIsShootModalOpen] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [clientFormData, setClientFormData] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    shoot_type: 'Portrait / Concept',
    location: '',
    date: '',
    time: '',
    price: '',
    expense: '',
    notes: '',
    drive_link: ''
  });

  const toggleExpand = (id: string) => { setExpandedShootId(expandedShootId === id ? null : id); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setClientFormData({ ...clientFormData, [e.target.name]: e.target.value }); };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { id: Math.random().toString(36).substring(2, 9), title: '', amount: '' }]);
  };

  const updateExpenseItem = (id: string, field: 'title' | 'amount', value: string) => {
    setExpenseItems(expenseItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClientId(val);
    if (val === 'new') {
      setFormData(prev => ({ ...prev, client_name: '', client_phone: '', client_email: '' }));
    } else {
      const selected = clients.find(c => c.id === val);
      if (selected) {
        setFormData(prev => ({ ...prev, client_name: selected.name, client_phone: selected.phone || '', client_email: selected.email || '' }));
      }
    }
  };

  const resetForm = () => {
    setSelectedClientId('new');
    setExpenseItems([]);
    setFormData({ client_name: '', client_phone: '', client_email: '', shoot_type: 'Portrait / Concept', location: '', date: '', time: '', price: '', expense: '', notes: '', drive_link: '' });
    setEditingShootId(null);
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: 'c_' + Date.now(),
      name: clientFormData.name,
      phone: clientFormData.phone,
      email: clientFormData.email,
      address: clientFormData.address,
      notes: clientFormData.notes
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    setSelectedClientForDetail(newClient);
    setIsClientModalOpen(false);
    setClientFormData({ name: '', phone: '', email: '', address: '', notes: '' });
  };

  const handleShootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientId = selectedClientId !== 'new' ? selectedClientId : undefined;
    
    let updatedClients = [...clients];
    if (selectedClientId === 'new' && formData.client_name) {
      const newClient: Client = {
        id: 'c_' + Date.now(),
        name: formData.client_name,
        phone: formData.client_phone,
        email: formData.client_email
      };
      updatedClients.push(newClient);
      setClients(updatedClients);
      finalClientId = newClient.id;
    }

    const totalExpenseCalculated = expenseItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const finalExpense = totalExpenseCalculated > 0 ? totalExpenseCalculated : (parseFloat(formData.expense) || 0);

    const shootPayload: Shoot = {
      id: editingShootId || 's_' + Date.now(),
      client_id: finalClientId,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      client_email: formData.client_email,
      shoot_type: formData.shoot_type,
      location: formData.location,
      date: formData.date,
      time: formData.time,
      price: parseFloat(formData.price) || 0,
      expense: finalExpense,
      expense_items: expenseItems,
      status: 'planned',
      notes: formData.notes,
      drive_link: formData.drive_link
    };

    let updatedShoots = [];
    if (editingShootId) {
      updatedShoots = shoots.map(s => s.id === editingShootId ? { ...s, ...shootPayload } : s);
    } else {
      updatedShoots = [shootPayload, ...shoots];
    }
    
    setShoots(updatedShoots);
    setIsShootModalOpen(false);
    resetForm();
  };

  const handleStatusChange = (id: string, newStatus: 'planned' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    setShoots(shoots.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu çekimi silmek istediğine emin misin?')) return;
    setShoots(shoots.filter(s => s.id !== id));
  };

  const handleOpenEditModal = (shoot: Shoot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShootId(shoot.id);
    setSelectedClientId(shoot.client_id || 'new');
    setExpenseItems(shoot.expense_items || []);
    setFormData({
      client_name: shoot.client_name || '',
      client_phone: shoot.client_phone || '',
      client_email: shoot.client_email || '',
      shoot_type: shoot.shoot_type || 'Portrait / Concept',
      location: shoot.location || '',
      date: shoot.date || '',
      time: shoot.time || '',
      price: shoot.price ? shoot.price.toString() : '',
      expense: shoot.expense ? shoot.expense.toString() : '',
      notes: shoot.notes || '',
      drive_link: shoot.drive_link || ''
    });
    setIsShootModalOpen(true);
  };

  const filteredShoots = shoots.filter(s => {
    const matchesSearch = (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase())) || (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">Cancelled</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">Planned</span>;
    }
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
            <button onClick={() => setActiveTab('shoots')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'shoots' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Shoot Calendar</button>
            <button onClick={() => setActiveTab('clients')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Client Portfolio</button>
            <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Reports</button>
          </div>

          <button onClick={() => { resetForm(); setIsShootModalOpen(true); }} className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow">
            <Plus className="w-4 h-4" /><span>New Shoot</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab !== 'reports' && (
          <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
            <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-80 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200" />
            {activeTab === 'shoots' ? (
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2">
                <option value="all">Tüm Durumlar</option>
                <option value="planned">Planlanan</option>
                <option value="completed">Tamamlanan</option>
                <option value="cancelled">İptal</option>
              </select>
            ) : (
              <button onClick={() => setIsClientModalOpen(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium">Yeni Müşteri Ekle</button>
            )}
          </div>
        )}

        {activeTab === 'shoots' && (
          filteredShoots.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center text-slate-400">Kayıt Bulunamadı</div>
          ) : (
            <div className="space-y-2">
              {filteredShoots.map((shoot) => {
                const isExpanded = expandedShootId === shoot.id;
                const p = Number(shoot.price) || 0;
                const ex = Number(shoot.expense) || 0;
                const net = p - ex;

                return (
                  <div key={shoot.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div onClick={() => toggleExpand(shoot.id)} className="p-3.5 cursor-pointer flex justify-between items-center hover:bg-slate-700/50">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-100">{shoot.client_name}</h3>
                        <p className="text-xs text-slate-400">{shoot.shoot_type}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span>{shoot.date}</span>
                        {getStatusBadge(shoot.status)}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 bg-slate-900/90 border-t border-slate-700 space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-2 text-slate-300">
                          <div className="bg-slate-800 p-2 rounded">Brüt: ₺{p}</div>
                          <div className="bg-slate-800 p-2 rounded text-red-400">Masraf: ₺{ex}</div>
                          <div className="bg-slate-800 p-2 rounded text-green-400 font-bold">Net: ₺{net}</div>
                        </div>

                        {shoot.expense_items && shoot.expense_items.length > 0 && (
                          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2 space-y-1">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Masraf Kalemleri</div>
                            {shoot.expense_items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                                <span>{item.title}</span>
                                <span className="text-red-400 font-semibold">₺{item.amount}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {shoot.notes && <div className="italic text-slate-400">"{shoot.notes}"</div>}
                        <div className="flex justify-between pt-2 border-t border-slate-800">
                          <div className="flex gap-2">
                            {shoot.status !== 'completed' && <button onClick={(e) => handleStatusChange(shoot.id, 'completed', e)} className="px-2 py-1 bg-green-950 text-green-300 rounded">Tamamla</button>}
                            {shoot.status !== 'cancelled' && <button onClick={(e) => handleStatusChange(shoot.id, 'cancelled', e)} className="px-2 py-1 bg-red-950 text-red-300 rounded">İptal Et</button>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => handleOpenEditModal(shoot, e)} className="text-indigo-400"><Edit className="w-4 h-4" /></button>
                            <button onClick={(e) => handleDelete(shoot.id, e)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              {filteredClients.map(client => (
                <div key={client.id} onClick={() => setSelectedClientForDetail(client)} className={`p-3 rounded-xl border cursor-pointer ${selectedClientForDetail?.id === client.id ? 'bg-indigo-950 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
                  <h3 className="font-semibold text-sm">{client.name}</h3>
                  <p className="text-xs text-slate-400">{client.phone}</p>
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              {selectedClientForDetail ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4 text-xs">
                  <h2 className="text-lg font-bold">{selectedClientForDetail.name}</h2>
                  <p>Telefon: {selectedClientForDetail.phone}</p>
                  <p>E-posta: {selectedClientForDetail.email}</p>
                </div>
              ) : (
                <div className="text-slate-400 text-center p-12">Müşteri seçin</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && <ReportsPage shoots={shoots} />}
      </main>

      {/* Yeni Çekim Modal */}
      {isShootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-3 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-sm">{editingShootId ? 'Çekimi Düzenle' : 'Yeni Çekim Ekle'}</h2>
            <form onSubmit={handleShootSubmit} className="space-y-3">
              <select value={selectedClientId} onChange={handleClientSelectChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100">
                <option value="new">+ Yeni Müşteri</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" name="client_name" required placeholder="Müşteri Adı" value={formData.client_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <input type="text" name="shoot_type" placeholder="Çekim Türü" value={formData.shoot_type} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              </div>
              <input type="text" name="location" placeholder="Lokasyon" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <input type="number" name="price" placeholder="Brüt Tutar (₺)" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />

              {/* Dinamik Masraf Kalemleri Ekleme Bölümü */}
              <div className="bg-slate-900/60 border border-slate-700 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-red-400" /> Masraf Kalemleri (Yol, Yemek vb.)
                  </span>
                  <button type="button" onClick={addExpenseItem} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium">
                    + Kalem Ekle
                  </button>
                </div>

                {expenseItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {expenseItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input type="text" placeholder="Açıklama (Yol, Yemek)" value={item.title} onChange={(e) => updateExpenseItem(item.id, 'title', e.target.value)} className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100" />
                        <input type="number" placeholder="Tutar (₺)" value={item.amount} onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)} className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100" />
                        <button type="button" onClick={() => removeExpenseItem(item.id)} className="p-1 text-red-400 bg-red-950 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="text-right text-[11px] font-bold text-red-400 pt-1 border-t border-slate-800">
                      Toplam Masraf: ₺{expenseItems.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)}
                    </div>
                  </div>
                )}
              </div>

              <textarea name="notes" placeholder="Notlar..." rows={2} value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 resize-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsShootModalOpen(false)} className="w-1/2 py-2 bg-slate-700 rounded text-slate-200">İptal</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 rounded text-white">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Müşteri Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 space-y-3 text-xs">
            <h2 className="font-bold text-sm">Yeni Müşteri Ekle</h2>
            <form onSubmit={handleClientSubmit} className="space-y-3">
              <input type="text" name="name" required placeholder="Adı / Şirket" value={clientFormData.name} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <input type="text" name="phone" placeholder="Telefon" value={clientFormData.phone} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <input type="email" name="email" placeholder="E-posta" value={clientFormData.email} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="w-1/2 py-2 bg-slate-700 rounded text-slate-200">İptal</button>
                <button type="submit" className="w-1/2 py-2 bg-emerald-600 rounded text-white">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
