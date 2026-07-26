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
  Edit,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Users,
  History,
  UserPlus,
  Image as ImageIcon,
  ExternalLink,
  Link as LinkIcon,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar_url?: string;
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
  drive_link?: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'shoots' | 'clients'>('shoots');
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [expandedShootId, setExpandedShootId] = useState<string | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  const [isShootModalOpen, setIsShootModalOpen] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [clientFormData, setClientFormData] = useState({ name: '', phone: '', email: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: shootsData } = await supabase.from('shoots').select('*').order('date', { ascending: true });
      const { data: clientsData } = await supabase.from('clients').select('*').order('name', { ascending: true });

      setShoots(shootsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Registration successful! You can now log in.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleExpand = (id: string) => {
    setExpandedShootId(expandedShootId === id ? null : id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientFormData({ ...clientFormData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('client-avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('client-avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
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
        setFormData(prev => ({
          ...prev,
          client_name: selected.name,
          client_phone: selected.phone || '',
          client_email: selected.email || '',
          avatar_url: selected.avatar_url || ''
        }));
      }
    }
  };

  const resetForm = () => {
    setSelectedClientId('new');
    setAvatarFile(null);
    setFormData({
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
    setEditingShootId(null);
  };

  const handleOpenAddShootModal = () => {
    resetForm();
    setIsShootModalOpen(true);
  };

  const handleOpenAddClientModal = () => {
    setAvatarFile(null);
    setClientFormData({ name: '', phone: '', email: '' });
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

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          user_id: session.user.id,
          name: clientFormData.name,
          phone: clientFormData.phone,
          email: clientFormData.email,
          avatar_url: avatarUrl
        }])
        .select();

      if (error) throw error;

      if (newClient && newClient[0]) {
        setClients(prev => [...prev, newClient[0]]);
        setSelectedClientForDetail(newClient[0]);
      }

      setIsClientModalOpen(false);
    } catch (error) {
      console.error('Client creation error:', error);
      alert('Failed to add client.');
    }
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
        const { data: newClient } = await supabase
          .from('clients')
          .insert([{ 
            user_id: session.user.id,
            name: formData.client_name, 
            phone: formData.client_phone, 
            email: formData.client_email,
            avatar_url: avatarUrl 
          }])
          .select();

        if (newClient && newClient[0]) {
          finalClientId = newClient[0].id;
          setClients(prev => [...prev, newClient[0]]);
        }
      } else if (finalClientId && avatarFile) {
        await supabase.from('clients').update({ avatar_url: avatarUrl }).eq('id', finalClientId);
        setClients(clients.map(c => c.id === finalClientId ? { ...c, avatar_url: avatarUrl } : c));
      }

      const shootPayload = {
        user_id: session.user.id,
        client_id: finalClientId,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        shoot_type: formData.shoot_type,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        price: parseFloat(formData.price) || 0,
        notes: formData.notes,
        drive_link: formData.drive_link
      };

      if (editingShootId) {
        const { error } = await supabase.from('shoots').update(shootPayload).eq('id', editingShootId);
        if (error) throw error;
        setShoots(shoots.map(s => s.id === editingShootId ? { ...s, ...shootPayload, id: editingShootId, status: s.status } : s));
      } else {
        const { data, error } = await supabase.from('shoots').insert([{ ...shootPayload, status: 'planned' }]).select();
        if (error) throw error;
        if (data) setShoots([...shoots, data[0]]);
      }

      setIsShootModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      alert('Operation failed.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('shoots').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setShoots(shoots.map(shoot => shoot.id === id ? { ...shoot, status: newStatus } : shoot));
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this shoot?')) return;
    try {
      const { error } = await supabase.from('shoots').delete().eq('id', id);
      if (error) throw error;
      setShoots(shoots.filter(shoot => shoot.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleOpenEditModal = (shoot: Shoot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShootId(shoot.id);
    setSelectedClientId(shoot.client_id || 'new');
    setAvatarFile(null);

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
        return <span className="inline-flex items-center justify-center w-28 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50"><CheckCircle className="w-3 h-3 mr-1" /> Tamamlandı</span>;
      case 'cancelled':
        return <span className="inline-flex items-center justify-center w-28 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50"><XCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center justify-center w-28 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50"><Clock className="w-3 h-3 mr-1" /> Planned</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Camera className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">ShootFlow</h1>
            <p className="text-xs text-slate-400">Shoot & Client CRM Management</p>
          </div>

          {authError && <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{authError}</span></div>}
          {authMessage && <div className="p-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-200 text-xs">{authMessage}</div>}

          <form onSubmit={handleAuth} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition shadow-lg shadow-indigo-600/30 text-xs"
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-700/60">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
                setAuthMessage('');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
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
              <p className="text-xs text-slate-400">Shoot & Client CRM</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('shoots')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'shoots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Shoot Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client Portfolio</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddShootModal}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-medium transition text-xs shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>New Shoot</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 rounded-lg border border-slate-600 transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'shoots' ? "Search shoot or client..." : "Search client name or phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {activeTab === 'shoots' ? (
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 w-full md:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <button
              onClick={handleOpenAddClientModal}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg font-medium transition text-xs shadow-md shadow-emerald-600/30 w-full md:w-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Client</span>
            </button>
          )}
        </div>

        {activeTab === 'shoots' && (
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredShoots.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <Camera className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-300">No Shoots Found</h3>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShoots.map((shoot) => {
                const isExpanded = expandedShootId === shoot.id;
                const client = clients.find(c => c.id === shoot.client_id || c.name.toLowerCase() === shoot.client_name.toLowerCase());

                return (
                  <div key={shoot.id} className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden transition duration-150 shadow-sm hover:border-slate-600">
                    <div onClick={() => toggleExpand(shoot.id)} className="p-3.5 cursor-pointer flex items-center justify-between gap-3 bg-slate-800 hover:bg-slate-700/50 transition">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {client?.avatar_url ? (
                          <img src={client.avatar_url} alt={shoot.client_name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-600" />
                        ) : (
                          <div className="p-2 bg-slate-700/60 rounded-lg text-indigo-400 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="truncate">
                          <h3 className="font-semibold text-slate-100 text-sm truncate">{shoot.client_name}</h3>
                          <p className="text-xs text-slate-400 truncate">{shoot.shoot_type}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 text-xs">
                        <div className="hidden sm:flex items-center justify-center w-28 py-1 px-2 bg-slate-900/80 rounded-lg border border-slate-700/60 text-slate-200 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1 shrink-0" />
                          <span>{shoot.date || 'No Date'}</span>
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
                            <span>{shoot.date || 'No Date'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{shoot.time || 'No Time'}</span>
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
                            <span className="font-bold text-green-400">{shoot.price ? `₺${shoot.price}` : 'Free / Unspecified'}</span>
                          </div>
                        </div>

                        {shoot.drive_link && (
                          <div className="pt-1">
                            <a
                              href={shoot.drive_link.startsWith('http') ? shoot.drive_link : `https://${shoot.drive_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/80 text-blue-200 border border-blue-700/60 rounded-lg font-medium transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                              <span>Open Drive / Gallery Link</span>
                            </a>
                          </div>
                        )}

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
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>
                            )}
                            {(shoot.status === 'completed' || shoot.status === 'cancelled') && (
                              <button onClick={(e) => handleStatusChange(shoot.id, 'planned', e)} className="px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-md transition flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Revert
                              </button>
                            )}
                          </div>

                          <div className="flex space-x-1">
                            <button onClick={(e) => handleOpenEditModal(shoot, e)} className="p-1.5 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded transition" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => handleDelete(shoot.id, e)} className="p-1.5 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded transition" title="Delete">
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

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clients ({filteredClients.length})</h2>
              </div>

              {filteredClients.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-800/40 rounded-lg">No clients found.</p>
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
                      <div className="flex items-center space-x-3">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt={client.name} className="w-10 h-10 rounded-lg object-cover border border-slate-600 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700/80 flex items-center justify-center text-indigo-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-100 text-sm">{client.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{client.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 bg-slate-900 rounded-full text-indigo-300 border border-indigo-900 shrink-0">
                        {clientShoots.length} Shoots
                      </span>
                    </div>
                  );
                })
              )}
            </div>

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
                    <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                      <div className="flex items-center space-x-4">
                        {selectedClientForDetail.avatar_url ? (
                          <img src={selectedClientForDetail.avatar_url} alt={selectedClientForDetail.name} className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500/50 shadow-md" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-indigo-400 border border-slate-600">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-bold text-slate-100">{selectedClientForDetail.name}</h2>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                            {selectedClientForDetail.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {selectedClientForDetail.phone}</span>}
                            {selectedClientForDetail.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {selectedClientForDetail.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Completed Volume</span>
                        <span className="text-base font-bold text-green-400">₺{totalSpent}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-3">
                        <History className="w-4 h-4 text-indigo-400" />
                        PAST & FUTURE SHOOTS ({clientShoots.length})
                      </h3>

                      {clientShoots.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-lg">No shoots recorded for this client.</p>
                      ) : (
                        <div className="space-y-2">
                          {clientShoots.map(s => (
                            <div key={s.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-slate-200 block">{s.shoot_type}</span>
                                <span className="text-slate-400">{s.date || 'No date'} {s.time ? `• ${s.time}` : ''} {s.location ? `• ${s.location}` : ''}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                {s.drive_link && (
                                  <a
                                    href={s.drive_link.startsWith('http') ? s.drive_link : `https://${s.drive_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded transition font-medium text-[11px]"
                                  >
                                    <LinkIcon className="w-3 h-3 text-blue-400" />
                                    <span>Gallery Link</span>
                                  </a>
                                )}
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
                  <p className="text-sm">Click on a client to view their details and entire history.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Create New Client Profile
              </h2>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Client Avatar</label>
                <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={clientFormData.name}
                  onChange={handleClientInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={clientFormData.phone}
                  onChange={handleClientInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={clientFormData.email}
                  onChange={handleClientInputChange}
                  placeholder="example@mail.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">Cancel</button>
                <button type="submit" disabled={uploadingAvatar} className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition">
                  {uploadingAvatar ? 'Uploading...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isShootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                {editingShootId ? 'Edit Shoot' : 'Add New Shoot'}
              </h2>
              <button onClick={() => { setIsShootModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleShootSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Client Profile</label>
                <select
                  value={selectedClientId}
                  onChange={handleClientSelectChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="new">+ Create New Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>👤 {c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Client Avatar</label>
                <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Client" className="w-10 h-10 rounded-lg object-cover border border-slate-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  name="client_name"
                  required
                  value={formData.client_name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email</label>
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
                <label className="block font-medium text-slate-300 mb-1">Shoot Type</label>
                <select
                  name="shoot_type"
                  value={formData.shoot_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Portrait / Concept">Portrait / Concept</option>
                  <option value="Sports / Match">Sports / Match</option>
                  <option value="Boutique / Fashion">Boutique / Fashion</option>
                  <option value="Event / Organization">Event / Organization</option>
                  <option value="Product / Commercial">Product / Commercial</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Volleyball Arena, Studio, etc."
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date *</label>
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
                  <label className="block font-medium text-slate-300 mb-1">Time</label>
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
                <label className="block font-medium text-slate-300 mb-1">Agreed Price (₺)</label>
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
                <label className="block font-medium text-slate-300 mb-1">Drive / Gallery Link</label>
                <input
                  type="url"
                  name="drive_link"
                  placeholder="https://drive.google.com/..."
                  value={formData.drive_link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Special Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Equipment, details..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsShootModalOpen(false); resetForm(); }} className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">Cancel</button>
                <button type="submit" disabled={uploadingAvatar} className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition">
                  {uploadingAvatar ? 'Uploading...' : editingShootId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
