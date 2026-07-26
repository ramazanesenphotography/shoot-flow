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
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface Shoot {
  id: string;
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
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
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
    fetchShoots();
  }, []);

  async function fetchShoots() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setShoots(data || []);
    } catch (error) {
      console.error('Çekimler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newShoot = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        status: 'planned' as const
      };

      const { data, error } = await supabase
        .from('shoots')
        .insert([newShoot])
        .select();

      if (error) throw error;

      if (data) {
        setShoots([...shoots, data[0]]);
      }
      
      setIsModalOpen(false);
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
    } catch (error) {
      console.error('Kayıt eklenirken hata oluştu:', error);
      alert('Kayıt eklenirken bir hata oluştu. Lütfen Supabase veritabanı bağlantınızı kontrol edin.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('shoots')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setShoots(shoots.map(shoot => 
        shoot.id === id ? { ...shoot, status: newStatus } : shoot
      ));
    } catch (error) {
      console.error('Durum güncellenirken hata oluştu:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu çekim kaydını silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('shoots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShoots(shoots.filter(shoot => shoot.id !== id));
    } catch (error) {
      console.error('Silme işleminde hata oluştu:', error);
    }
  };

  const filteredShoots = shoots.filter(shoot => {
    const matchesSearch = 
      shoot.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoot.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoot.shoot_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || shoot.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Tamamlandı</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> İptal Edildi</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Planlandı</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ShootFlow
              </h1>
              <p className="text-xs text-slate-400">Çekim ve Müşteri Yönetim Paneli</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition duration-200 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Çekim Ekle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri, mekan veya çekim türü ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="planned">Planlananlar</option>
              <option value="completed">Tamamlananlar</option>
              <option value="cancelled">İptal Edilenler</option>
            </select>
          </div>
        </div>

        {/* Shoots Grid / List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredShoots.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <Camera className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">Henüz Çekim Kaydı Bulunmuyor</h3>
            <p className="text-sm text-slate-400 mt-1">Yeni bir çekim takvimi eklemek için yukarıdaki butonu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShoots.map((shoot) => (
              <div 
                key={shoot.id} 
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition duration-200 shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-slate-700/60 rounded-md text-xs font-semibold text-indigo-300 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {shoot.shoot_type}
                    </span>
                    {getStatusBadge(shoot.status)}
                  </div>

                  {/* Client Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      {shoot.client_name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                      {shoot.client_phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {shoot.client_phone}
                        </p>
                      )}
                      {shoot.client_email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {shoot.client_email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shoot Details */}
                  <div className="bg-slate-900/60 rounded-lg p-3 space-y-2 text-xs text-slate-300 mb-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Tarih:
                      </span>
                      <span className="font-semibold text-slate-200">{shoot.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Saat:
                      </span>
                      <span className="font-semibold text-slate-200">{shoot.time || 'Belirtilmedi'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Konum:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]">{shoot.location || 'Belirtilmedi'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign className="w-3.5 h-3.5 text-green-400" /> Ücret:
                      </span>
                      <span className="font-bold text-green-400">{shoot.price ? `₺${shoot.price}` : 'Ücretsiz / Belirtilmedi'}</span>
                    </div>
                  </div>

                  {shoot.notes && (
                    <p className="text-xs text-slate-400 italic mb-4 line-clamp-2">
                      "{shoot.notes}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-700/60 mt-auto">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleStatusChange(shoot.id, 'completed')}
                      title="Tamamlandı Olarak İşaretle"
                      className="p-1.5 hover:bg-green-500/20 text-slate-400 hover:text-green-400 rounded transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(shoot.id, 'cancelled')}
                      title="İptal Edildi Olarak İşaretle"
                      className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(shoot.id)}
                    title="Kayıdı Sil"
                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal - New Shoot Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                Yeni Çekim Ekle
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  name="client_name"
                  required
                  value={formData.client_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-posta</label>
                  <input
                    type="email"
                    name="client_email"
                    value={formData.client_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Çekim Türü</label>
                <select
                  name="shoot_type"
                  value={formData.shoot_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Portre / Konsept">Portre / Konsept</option>
                  <option value="Spor / Maç">Spor / Maç</option>
                  <option value="Butik / Moda">Butik / Moda</option>
                  <option value="Etkinlik / Organizasyon">Etkinlik / Organizasyon</option>
                  <option value="Ürün / Reklam">Ürün / Reklam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mekan / Konum</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Örn: Voleybol Salonu, Stüdyo vb."
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tarih *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Saat</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Anlaşılan Ücret (₺)</label>
                <input
                  type="number"
                  name="price"
                  placeholder="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Özel Notlar</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Ekipmanlar, özel istekler..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition shadow-md shadow-indigo-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
