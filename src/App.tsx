import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Calendar, 
  Clock, 
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
  Briefcase,
  Edit,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Users,
  History
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at?: string;
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
  status: 'planned' | 'completed' | 'cancelled';
  notes: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'shoots' | 'clients'>('shoots');
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Arama & Filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Akordiyon & Detay Durumları
  const [expandedShootId, setExpandedShootId] = useState<string | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    shoot_type: 'Portre / Konsept',
    location: '',
    date: '',
    time: '',
    price: '',
    notes: ''
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
    } catch (error) {
      console.error('Veriler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedShootId(expandedShootId === id ? null : id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClientId(val);

    if (val === 'new') {
      setFormData(prev => ({ ...prev, client_name: '', client_phone: '', client_email: '' }));
    } else {
      const selected = clients.find(c => c.id === val);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          client_name: selected.name,
          client_phone: selected.phone || '',
          client_email: selected.email || ''
        }));
      }
    }
  };

  const resetForm = () => {
    setSelectedClientId('new');
    setFormData({
      client_name: '',
      client_phone: '',
      client_email: '',
      shoot_type: 'Portre / Konsept',
      location: '',
      date: '',
      time: '',
      price: '',
      notes: ''
    });
    setEditingShootId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shoot: Shoot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShootId(shoot.id);
    setSelectedClientId(shoot.client_id || 'new');
    setFormData({
      client_name: shoot.client_name || '',
      client_phone: shoot.client_phone || '',
      client_email: shoot.client_email || '',
      shoot_type: shoot.shoot_type || 'Portre / Konsept',
      location: shoot.location || '',
      date: shoot.date || '',
      time: shoot.time || '',
      price: shoot.price ? shoot.price.toString() : '',
      notes: shoot.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalClientId = selectedClientId !== 'new' ? selectedClientId : undefined;

      if (selectedClientId === 'new' && formData.client_name) {
        const { data: newClient } = await supabase
          .from('clients')
          .insert([{ name: formData.client_name, phone: formData.client_phone, email: formData.client_email }])
          .select();

        if (newClient && newClient[0]) {
          finalClientId = newClient[0].id;
          setClients(prev => [...prev, newClient[0]]);
        }
      }

      const shootPayload = {
        ...formData,
        client_id: finalClientId,
        price: parseFloat(formData.price) || 0
      };

      if (editingShootId) {
        const { error } = await supabase.from('shoots').update(shootPayload).eq('id', editingShootId);
        if (error) throw error;
        setShoots(shoots.map(s => s.id === editingShootId ? { ...s, ...shootPayload } : s));
      } else {
        const { data, error } = await supabase.from('shoots').insert([{ ...shootPayload, status: 'planned' }]).select();
        if (error) throw error;
        if (data) setShoots([...shoots, data[0]]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('İşlem gerçekleştirilemedi.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('shoots').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setShoots(shoots.map(shoot => shoot.id === id ? { ...shoot, status: newStatus } : shoot));
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu çekim kaydını silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('shoots').delete().eq('id', id);
      if (error) throw error;
      setShoots(shoots.filter(shoot => shoot.id !== id));
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const filteredShoots = shoots
    .filter(shoot => {
      const matchesSearch = 
        (shoot.client_name && shoot.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shoot.location && shoot.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shoot.shoot_type && shoot.shoot_type.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || shoot.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
      const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
      return dateA - dateB;
    });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center justify-center w-24 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50"><CheckCircle className="w-3 h-3 mr-1" /> Tamam</span>;
      case 'cancelled':
        return <span className="inline-flex items-center justify-center w-24 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50"><XCircle className="w-3 h-3 mr-1" /> İptal</span>;
      default:
        return <span className="inline-flex items-center justify-center w-24 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50"><Clock className="w-3 h-3 mr-1" /> Planlandı</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ShootFlow
              </h1>
              <p className="text-xs text-slate-400">Çekim & Müşteri CRM</p>
            </div>
          </div>

          {/* PANEL SEKMELERİ */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('shoots')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'shoots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Çekim Takvimi</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Müşteri Portföyü</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-medium transition text-xs shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Çekim</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Arama Barı */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'shoots' ? "Çekim veya müşteri ara..." : "Müşteri adı veya telefon ara..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {activeTab === 'shoots' && (
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 w-full md:w-auto"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="planned">Planlananlar</option>
                <option value="completed">Tamamlananlar</option>
                <option value="cancelled">İptal Edilenler</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: ÇEKİM TAKVİMİ PANELİ */}
        {activeTab === 'shoots' && (
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredShoots.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <Camera className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-300">Kayıtlı Çekim Bulunmuyor</h3>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShoots.map((shoot) => {
                const isExpanded = expandedShootId === shoot.id;

                return (
                  <div key={shoot.id} className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden transition duration-150 shadow-sm hover:border-slate-600">
                    <div onClick={() => toggleExpand(shoot.id)} className="p-3.5 cursor-pointer flex items-center justify-between gap-3 bg-slate-800 hover:bg-slate-700/50 transition">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-2 bg-slate-700/60 rounded-lg text-indigo-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-semibold text-slate-100 text-sm truncate">{shoot.client_name}</h3>
                          <p className="text-xs text-slate-400 truncate">{shoot.shoot_type}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 text-xs">
                        <div className="hidden sm:flex items-center justify-center w-28 py-1 px-2 bg-slate-900/80 rounded-lg border border-slate-700/60 text-slate-200 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1 shrink-0" />
                          <span>{shoot.date || 'Tarihsiz'}</span>
                        </div>

                        <div className={`hidden sm:flex items-center justify-center w-16 py-1 px-2 bg-slate-900/80 rounded-lg border border-slate-700/60 font-medium ${shoot.time ? 'text-slate-200' : 'text-slate-500'}`}>
                          <Clock className={`w-3.5 h-3.5 mr-1 shrink-0 ${shoot.time ? 'text-indigo-400' : 'text-slate-600'}`} />
                          <span>{shoot.time || '--:--'}</span>
                        </div>

                        <div>{getStatusBadge(shoot.status)}</div>

                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-slate-900/90 border-t border-slate-700/60 space-y-3 text-xs">
                        <div className="flex sm:hidden items-center gap-3 text-slate-300 pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{shoot.date || 'Tarih Belirtilmedi'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{shoot.time || 'Saat Belirtilmedi'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          {shoot.client_phone && (
                            <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                              <Phone className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{shoot.client_phone}</span>
                            </div>
                          )}
                          {shoot.client_email && (
                            <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                              <Mail className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate">{shoot.client_email}</span>
                            </div>
                          )}
                          {shoot.location && (
                            <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{shoot.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40">
                            <DollarSign className="w-3.5 h-3.5 text-green-400" />
                            <span className="font-bold text-green-400">{shoot.price ? `₺${shoot.price}` : 'Ücretsiz / Belirtilmedi'}</span>
                          </div>
                        </div>

                        {shoot.notes && (
                          <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/30 text-slate-300 italic">
                            "{shoot.notes}"
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                          <div className="flex space-x-2">
                            {shoot.status !== 'completed' && (
                              <button onClick={(e) => handleStatusChange(shoot.id, 'completed', e)} className="px-2.5 py-1 bg-green-950/80 hover:bg-green-900 text-green-300 border border-green-800 rounded-md transition flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Tamamlandı
                              </button>
                            )}
                            {shoot.status !== 'cancelled' && (
                              <button onClick={(e) => handleStatusChange(shoot.id, 'cancelled', e)} className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-md transition flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> İptal
                              </button>
                            )}
                            {(shoot.status === 'completed' || shoot.status === 'cancelled') && (
                              <button onClick={(e) => handleStatusChange(shoot.id, 'planned', e)} className="px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-md transition flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Geri Al
                              </button>
                            )}
                          </div>

                          <div className="flex space-x-1">
                            <button onClick={(e) => handleOpenEditModal(shoot, e)} className="p-1.5 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded transition" title="Düzenle">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => handleDelete(shoot.id, e)} className="p-1.5 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded transition" title="Sil">
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* TAB 2: MÜŞTERİ PORTFÖYÜ PANELİ */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Müşteri Listesi */}
            <div className="md:col-span-1 space-y-2">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Müşteriler ({filteredClients.length})</h2>
              {filteredClients.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-800/40 rounded-lg">Müşteri bulunamadı.</p>
              ) : (
                filteredClients.map(client => {
                  const clientShoots = shoots.filter(s => s.client_id === client.id || s.client_name.toLowerCase() === client.name.toLowerCase());
                  const isSelected = selectedClientForDetail?.id === client.id;

                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientForDetail(client)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${isSelected ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md' : 'bg-slate-800 border-slate-700/70 hover:border-slate-500'}`}
                    >
                      <div>
                        <h3 className="font-semibold text-slate-100 text-sm">{client.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{client.phone || 'Telefon yok'}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 bg-slate-900 rounded-full text-indigo-300 border border-indigo-900">
                        {clientShoots.length} Çekim
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Müşteri Detay & Geçmiş Çekim Kartı */}
            <div className="md:col-span-2">
              {selectedClientForDetail ? (() => {
                const clientShoots = shoots.filter(s => 
                  s.client_id === selectedClientForDetail.id || 
                  s.client_name.toLowerCase() === selectedClientForDetail.name.toLowerCase()
                );
                const totalSpent = clientShoots
                  .filter(s => s.status === 'completed')
                  .reduce((acc, s) => acc + (s.price || 0), 0);

                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
                    {/* Müşteri Başlık */}
                    <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                      <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-400" />
                          {selectedClientForDetail.name}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                          {selectedClientForDetail.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedClientForDetail.phone}</span>}
                          {selectedClientForDetail.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedClientForDetail.email}</span>}
                        </div>
                      </div>

                      {/* Toplam Hacim */}
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tamamlanan Hacim</span>
                        <span className="text-base font-bold text-green-400">₺{totalSpent}</span>
                      </div>
                    </div>

                    {/* Çekim Geçmişi */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-3">
                        <History className="w-4 h-4 text-indigo-400" />
                        GEÇMİŞ İŞLER VE GELECEK PLANLAR ({clientShoots.length})
                      </h3>

                      {clientShoots.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-lg">Bu müşteriye ait kayıtlı çekim bulunmuyor.</p>
                      ) : (
                        <div className="space-y-2">
                          {clientShoots.map(s => (
                            <div key={s.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-200 block">{s.shoot_type}</span>
                                <span className="text-slate-400">{s.date || 'Tarihsiz'} {s.time ? `• ${s.time}` : ''} {s.location ? `• ${s.location}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-green-400">₺{s.price || 0}</span>
                                {getStatusBadge(s.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                  <p className="text-sm">Detaylarını ve tüm geçmiş işlerini görmek istediğiniz müşterinin üzerine tıklayın.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal - Ekle / Düzenle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                {editingShootId ? 'Çekim Düzenle' : 'Yeni Çekim Ekle'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Müşteri Profili Seçin</label>
                <select
                  value={selectedClientId}
                  onChange={handleClientSelectChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="new">+ Yeni Müşteri Oluştur</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>👤 {c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  name="client_name"
                  required
                  value={formData.client_name}
                  onChange={handleInputChange}
                  placeholder="Örn: Zehra Güneş"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">E-posta</label>
                  <input
                    type="email"
                    name="client_email"
                    value={formData.client_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Çekim Türü</label>
                <select
                  name="shoot_type"
                  value={formData.shoot_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Portre / Konsept">Portre / Konsept</option>
                  <option value="Spor / Maç">Spor / Maç</option>
                  <option value="Butik / Moda">Butik / Moda</option>
                  <option value="Etkinlik / Organizasyon">Etkinlik / Organizasyon</option>
                  <option value="Ürün / Reklam">Ürün / Reklam</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Mekan / Konum</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Örn: Voleybol Salonu, Stüdyo vb."
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tarih *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Saat</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Anlaşılan Ücret (₺)</label>
                <input
                  type="number"
                  name="price"
                  placeholder="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Özel Notlar</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ekipmanlar, detaylar..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">İptal</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition">{editingShootId ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
