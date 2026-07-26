import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Download,
  FileText,
  Home
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
  const CURRENT_VERSION = "1.0.0";
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  
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

  // Client archive filters
  const [showClientFilters, setShowClientFilters] = useState(false);
  const [clientSort, setClientSort] = useState<'az' | 'za' | 'recent' | 'oldest' | 'mostJobs' | 'leastJobs' | 'highestRevenue'>('az');
  const [clientWorkStatus, setClientWorkStatus] = useState<'all' | 'withJobs' | 'withoutJobs'>('all');
  const [clientShootStatus, setClientShootStatus] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');
  const [clientShootType, setClientShootType] = useState('all');
  const [clientDateFrom, setClientDateFrom] = useState('');
  const [clientDateTo, setClientDateTo] = useState('');
  const [clientShootSearch, setClientShootSearch] = useState('');

  const [expandedShootId, setExpandedShootId] = useState<string | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  const [isShootModalOpen, setIsShootModalOpen] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [clientFormData, setClientFormData] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
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

  // Version and Update Check
  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
        if (data.version && data.version !== CURRENT_VERSION) {
          setUpdateAvailable(true);
          setUpdateMsg(data.updateMessage || "New update available!");
        }
      })
      .catch(err => console.log('Version check skipped', err));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkApproval(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        checkApproval(currentSession.user.id);
      } else {
        setIsApproved(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkApproval(userId: string) {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (data) {
        setIsApproved(data.is_approved);
      } else {
        await supabase.from('user_profiles').insert([{ id: userId, email: session?.user?.email, is_approved: false }]);
        setIsApproved(false);
      }
    } catch (err) {
      console.error('Approval error:', err);
      setIsApproved(false);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (session && isApproved) {
      loadData();
    }
  }, [session, isApproved]);

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
        setAuthMessage('Registration successful! Please check your email to verify your account, then log in.');
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
    setSession(null);
    setIsApproved(null);
  };

  const checkStatusAgain = () => {
    if (session) {
      checkApproval(session.user.id);
    }
  };

  const toggleExpand = (id: string) => { setExpandedShootId(expandedShootId === id ? null : id); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setClientFormData({ ...clientFormData, [e.target.name]: e.target.value }); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setAvatarFile(e.target.files[0]); };

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
        user_id: session.user.id, 
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
    } catch (error) { alert('Failed to add client.'); }
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
        const { data: newClient } = await supabase.from('clients').insert([{ user_id: session.user.id, name: formData.client_name, phone: formData.client_phone, email: formData.client_email, avatar_url: avatarUrl }]).select();
        if (newClient && newClient[0]) {
          finalClientId = newClient[0].id;
          setClients(prev => [...prev, newClient[0]]);
        }
      } else if (finalClientId && avatarFile) {
        await supabase.from('clients').update({ avatar_url: avatarUrl }).eq('id', finalClientId);
        setClients(clients.map(c => c.id === finalClientId ? { ...c, avatar_url: avatarUrl } : c));
      }
      const shootPayload = { user_id: session.user.id, client_id: finalClientId, client_name: formData.client_name, client_phone: formData.client_phone, client_email: formData.client_email, shoot_type: formData.shoot_type, location: formData.location, date: formData.date, time: formData.time, price: parseFloat(formData.price) || 0, notes: formData.notes, drive_link: formData.drive_link };
      if (editingShootId) {
        await supabase.from('shoots').update(shootPayload).eq('id', editingShootId);
        setShoots(shoots.map(s => s.id === editingShootId ? { ...s, ...shootPayload, id: editingShootId, status: s.status } : s));
      } else {
        const { data } = await supabase.from('shoots').insert([{ ...shootPayload, status: 'planned' }]).select();
        if (data) setShoots([...shoots, data[0]]);
      }
      setIsShootModalOpen(false);
      resetForm();
    } catch (error) { alert('Operation failed.'); }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('shoots').update({ status: newStatus }).eq('id', id);
    setShoots(shoots.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure?')) return;
    await supabase.from('shoots').delete().eq('id', id);
    setShoots(shoots.filter(s => s.id !== id));
  };

  const handleOpenEditModal = (shoot: Shoot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShootId(shoot.id);
    setSelectedClientId(shoot.client_id || 'new');
    setAvatarFile(null);
    const client = clients.find(c => c.id === shoot.client_id);
    setFormData({ client_name: shoot.client_name || '', client_phone: shoot.client_phone || '', client_email: shoot.client_email || '', avatar_url: client?.avatar_url || '', shoot_type: shoot.shoot_type || 'Portrait / Concept', location: shoot.location || '', date: shoot.date || '', time: shoot.time || '', price: shoot.price ? shoot.price.toString() : '', notes: shoot.notes || '', drive_link: shoot.drive_link || '' });
    setIsShootModalOpen(true);
  };

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('tr-TR');

  const clientById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach(client => map.set(client.id, client));
    return map;
  }, [clients]);

  const clientStats = useMemo(() => {
    const stats = new Map<string, {
      shoots: Shoot[];
      totalRevenue: number;
      firstDate: string;
      lastDate: string;
    }>();

    clients.forEach(client => {
      stats.set(client.id, { shoots: [], totalRevenue: 0, firstDate: '', lastDate: '' });
    });

    shoots.forEach(shoot => {
      let clientId = shoot.client_id;

      if (!clientId && shoot.client_name) {
        const normalizedName = shoot.client_name.trim().toLocaleLowerCase('tr-TR');
        const matchedClient = clients.find(
          client => client.name.trim().toLocaleLowerCase('tr-TR') === normalizedName
        );
        clientId = matchedClient?.id;
      }

      if (!clientId) return;

      const current = stats.get(clientId) || { shoots: [], totalRevenue: 0, firstDate: '', lastDate: '' };
      current.shoots.push(shoot);
      current.totalRevenue += Number(shoot.price) || 0;

      if (shoot.date) {
        if (!current.firstDate || shoot.date < current.firstDate) current.firstDate = shoot.date;
        if (!current.lastDate || shoot.date > current.lastDate) current.lastDate = shoot.date;
      }

      stats.set(clientId, current);
    });

    stats.forEach(stat => {
      stat.shoots.sort((a, b) => {
        const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
        const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
        return dateB - dateA;
      });
    });

    return stats;
  }, [clients, shoots]);

  const shootTypes = useMemo(() => {
    return Array.from(new Set(shoots.map(shoot => shoot.shoot_type).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'tr'));
  }, [shoots]);

  const filteredShoots = useMemo(() => {
    return shoots
      .filter(s => {
        const clientName = (s.client_name || '').toLocaleLowerCase('tr-TR');
        const location = (s.location || '').toLocaleLowerCase('tr-TR');
        const shootType = (s.shoot_type || '').toLocaleLowerCase('tr-TR');
        const matchesSearch =
          !normalizedSearchTerm ||
          clientName.includes(normalizedSearchTerm) ||
          location.includes(normalizedSearchTerm) ||
          shootType.includes(normalizedSearchTerm);
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
  }, [shoots, normalizedSearchTerm, filterStatus]);

  const filteredClients = useMemo(() => {
    const result = clients.filter(client => {
      const stat = clientStats.get(client.id);
      const clientShoots = stat?.shoots || [];

      const matchesName =
        !normalizedSearchTerm ||
        client.name.toLocaleLowerCase('tr-TR').includes(normalizedSearchTerm);

      const matchesWorkStatus =
        clientWorkStatus === 'all' ||
        (clientWorkStatus === 'withJobs' && clientShoots.length > 0) ||
        (clientWorkStatus === 'withoutJobs' && clientShoots.length === 0);

      const matchingShoots = clientShoots.filter(shoot => {
        const matchesStatus = clientShootStatus === 'all' || shoot.status === clientShootStatus;
        const matchesType = clientShootType === 'all' || shoot.shoot_type === clientShootType;
        const matchesFrom = !clientDateFrom || (shoot.date && shoot.date >= clientDateFrom);
        const matchesTo = !clientDateTo || (shoot.date && shoot.date <= clientDateTo);
        return matchesStatus && matchesType && matchesFrom && matchesTo;
      });

      const hasAdvancedShootFilter =
        clientShootStatus !== 'all' ||
        clientShootType !== 'all' ||
        Boolean(clientDateFrom) ||
        Boolean(clientDateTo);

      return matchesName && matchesWorkStatus && (!hasAdvancedShootFilter || matchingShoots.length > 0);
    });

    return result.sort((a, b) => {
      const statsA = clientStats.get(a.id);
      const statsB = clientStats.get(b.id);

      switch (clientSort) {
        case 'za':
          return b.name.localeCompare(a.name, 'tr');
        case 'recent':
          return (statsB?.lastDate || '').localeCompare(statsA?.lastDate || '');
        case 'oldest':
          return (statsA?.firstDate || '9999').localeCompare(statsB?.firstDate || '9999');
        case 'mostJobs':
          return (statsB?.shoots.length || 0) - (statsA?.shoots.length || 0);
        case 'leastJobs':
          return (statsA?.shoots.length || 0) - (statsB?.shoots.length || 0);
        case 'highestRevenue':
          return (statsB?.totalRevenue || 0) - (statsA?.totalRevenue || 0);
        default:
          return a.name.localeCompare(b.name, 'tr');
      }
    });
  }, [
    clients,
    clientStats,
    normalizedSearchTerm,
    clientWorkStatus,
    clientShootStatus,
    clientShootType,
    clientDateFrom,
    clientDateTo,
    clientSort
  ]);

  const selectedClientShoots = useMemo(() => {
    if (!selectedClientForDetail) return [];

    const baseShoots = clientStats.get(selectedClientForDetail.id)?.shoots || [];
    const search = clientShootSearch.trim().toLocaleLowerCase('tr-TR');

    return baseShoots.filter(shoot => {
      const matchesStatus = clientShootStatus === 'all' || shoot.status === clientShootStatus;
      const matchesType = clientShootType === 'all' || shoot.shoot_type === clientShootType;
      const matchesFrom = !clientDateFrom || (shoot.date && shoot.date >= clientDateFrom);
      const matchesTo = !clientDateTo || (shoot.date && shoot.date <= clientDateTo);
      const searchableText = [
        shoot.shoot_type,
        shoot.location,
        shoot.notes,
        shoot.date,
        shoot.time,
        String(shoot.price || ''),
        shoot.status
      ].join(' ').toLocaleLowerCase('tr-TR');

      return matchesStatus && matchesType && matchesFrom && matchesTo && (!search || searchableText.includes(search));
    });
  }, [
    selectedClientForDetail,
    clientStats,
    clientShootSearch,
    clientShootStatus,
    clientShootType,
    clientDateFrom,
    clientDateTo
  ]);

  const selectedClientSummary = useMemo(() => {
    if (!selectedClientForDetail) {
      return { totalJobs: 0, totalRevenue: 0, firstDate: '', lastDate: '', averagePrice: 0 };
    }

    const stat = clientStats.get(selectedClientForDetail.id);
    const totalJobs = stat?.shoots.length || 0;
    const totalRevenue = stat?.totalRevenue || 0;

    return {
      totalJobs,
      totalRevenue,
      firstDate: stat?.firstDate || '',
      lastDate: stat?.lastDate || '',
      averagePrice: totalJobs ? totalRevenue / totalJobs : 0
    };
  }, [selectedClientForDetail, clientStats]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);

  const formatDate = (value?: string) => {
    if (!value) return 'Kayıt yok';
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
      .format(new Date(`${value}T00:00:00`));
  };

  const resetClientFilters = () => {
    setClientSort('az');
    setClientWorkStatus('all');
    setClientShootStatus('all');
    setClientShootType('all');
    setClientDateFrom('');
    setClientDateTo('');
    setClientShootSearch('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/50">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">Cancelled</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">Planned</span>;
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
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@domain.com" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition shadow-lg shadow-indigo-600/30 text-xs">
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-700/60">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); setAuthMessage(''); }} className="text-xs text-indigo-400 hover:underline">
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-5">
          <div className="inline-flex p-4 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Approval Required</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your account is currently waiting for administrator approval (or subscription renewal). Once approved, click below to access your dashboard.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button onClick={checkStatusAgain} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition text-xs shadow">
              Check Status / Refresh
            </button>
            <button onClick={handleLogout} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition text-xs flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative">
      {updateAvailable && (
        <div className="bg-indigo-600 text-white px-4 py-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span className="font-medium">{updateMsg}</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1.5 bg-white text-indigo-700 font-bold rounded-lg shadow hover:bg-indigo-50 transition flex items-center gap-1 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Update & Refresh
          </button>
        </div>
      )}

      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Camera className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ShootFlow</h1>
              <p className="text-xs text-slate-400">Shoot & Client CRM</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('shoots')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeTab === 'shoots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              <Calendar className="w-3.5 h-3.5" /><span>Shoot Calendar</span>
            </button>
            <button onClick={() => setActiveTab('clients')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              <Users className="w-3.5 h-3.5" /><span>Client Portfolio</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleOpenAddShootModal} className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition text-xs shadow whitespace-nowrap">
              <Plus className="w-4 h-4" /><span>New Shoot</span>
            </button>
            <button onClick={handleLogout} className="p-1.5 bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 rounded-lg border border-slate-600 transition" title="Log Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder={activeTab === 'shoots' ? "Search shoot or client..." : "Search client..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm" />
          </div>

          {activeTab === 'shoots' ? (
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 w-full md:w-auto">
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <button onClick={handleOpenAddClientModal} className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg font-medium transition text-xs shadow w-full md:w-auto justify-center">
              <UserPlus className="w-4 h-4" /><span>Add New Client</span>
            </button>
          )}
        </div>

        {activeTab === 'shoots' && (
          loading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>
          ) : filteredShoots.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center"><Camera className="w-10 h-10 text-slate-500 mx-auto mb-3" /><h3 className="text-base font-medium text-slate-300">No Shoots Found</h3></div>
          ) : (
            <div className="space-y-2">
              {filteredShoots.map((shoot) => {
                const isExpanded = expandedShootId === shoot.id;
                const client = shoot.client_id
                  ? clientById.get(shoot.client_id)
                  : clients.find(c => c.name.toLocaleLowerCase('tr-TR') === shoot.client_name.toLocaleLowerCase('tr-TR'));
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          {shoot.client_phone && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40"><Phone className="w-3.5 h-3.5 text-indigo-400" /><span>{shoot.client_phone}</span></div>}
                          {shoot.client_email && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40"><Mail className="w-3.5 h-3.5 text-indigo-400" /><span className="truncate">{shoot.client_email}</span></div>}
                          {shoot.location && <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40 sm:col-span-2"><MapPin className="w-3.5 h-3.5 text-indigo-400" /><span>{shoot.location}</span></div>}
                          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/40"><DollarSign className="w-3.5 h-3.5 text-green-400" /><span className="font-bold text-green-400">₺{shoot.price || 0}</span></div>
                        </div>
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
        )
        )}

        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{filteredClients.length}</span> müşteri gösteriliyor
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClientFilters(!showClientFilters)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    {showClientFilters ? 'Filtreleri Kapat' : 'Detaylı Filtre'}
                  </button>
                  <button
                    type="button"
                    onClick={resetClientFilters}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 text-xs text-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
                  </button>
                </div>
              </div>

              {showClientFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Sıralama</label>
                    <select value={clientSort} onChange={(e) => setClientSort(e.target.value as typeof clientSort)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
                      <option value="az">İsim A–Z</option>
                      <option value="za">İsim Z–A</option>
                      <option value="recent">En son çalışılan</option>
                      <option value="oldest">İlk çalışması en eski</option>
                      <option value="mostJobs">En çok çalışılan</option>
                      <option value="leastJobs">En az çalışılan</option>
                      <option value="highestRevenue">En yüksek kazanç</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Müşteri durumu</label>
                    <select value={clientWorkStatus} onChange={(e) => setClientWorkStatus(e.target.value as typeof clientWorkStatus)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
                      <option value="all">Tüm müşteriler</option>
                      <option value="withJobs">Çalışması olanlar</option>
                      <option value="withoutJobs">Henüz çalışılmayanlar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Çalışma durumu</label>
                    <select value={clientShootStatus} onChange={(e) => setClientShootStatus(e.target.value as typeof clientShootStatus)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
                      <option value="all">Tüm durumlar</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="planned">Planlandı</option>
                      <option value="cancelled">İptal edildi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Çekim türü</label>
                    <select value={clientShootType} onChange={(e) => setClientShootType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
                      <option value="all">Tüm çekim türleri</option>
                      {shootTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Başlangıç tarihi</label>
                    <input type="date" value={clientDateFrom} onChange={(e) => setClientDateFrom(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100" />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Bitiş tarihi</label>
                    <input type="date" value={clientDateTo} onChange={(e) => setClientDateTo(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Güncel Müşteri Listesi</h2>

                {filteredClients.length === 0 ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-xs text-slate-400">
                    Filtrelere uygun müşteri bulunamadı.
                  </div>
                ) : filteredClients.map(client => {
                  const stat = clientStats.get(client.id);
                  return (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => setSelectedClientForDetail(client)}
                      className={`w-full text-left p-3 rounded-xl border transition flex justify-between items-center gap-3 ${
                        selectedClientForDetail?.id === client.id
                          ? 'bg-indigo-950/60 border-indigo-500'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {client.avatar_url ? (
                          <img loading="lazy" src={client.avatar_url} alt={client.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-100 text-sm truncate">{client.name}</h3>
                          <p className="text-xs text-slate-400 truncate">{client.phone || 'Telefon eklenmemiş'}</p>
                          <p className="text-[11px] text-indigo-300 mt-0.5">
                            {stat?.shoots.length || 0} çalışma
                            {stat?.lastDate ? ` • Son: ${formatDate(stat.lastDate)}` : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="md:col-span-2">
                {selectedClientForDetail ? (
                  <div className="space-y-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
                      <div className="flex items-center space-x-4 border-b border-slate-700 pb-4">
                        {selectedClientForDetail.avatar_url ? (
                          <img loading="lazy" src={selectedClientForDetail.avatar_url} alt={selectedClientForDetail.name} className="w-16 h-16 rounded-xl object-cover border border-indigo-500/50" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-indigo-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-slate-100 truncate">{selectedClientForDetail.name}</h2>
                          <p className="text-xs text-indigo-400 font-medium">Müşteri Arşivi ve İletişim Bilgileri</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60">
                          <div className="text-[11px] text-slate-400">Toplam çalışma</div>
                          <div className="text-lg font-bold text-white">{selectedClientSummary.totalJobs}</div>
                        </div>
                        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60">
                          <div className="text-[11px] text-slate-400">Toplam kazanç</div>
                          <div className="text-sm font-bold text-green-400">{formatCurrency(selectedClientSummary.totalRevenue)}</div>
                        </div>
                        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60">
                          <div className="text-[11px] text-slate-400">Ortalama ücret</div>
                          <div className="text-sm font-bold text-slate-200">{formatCurrency(selectedClientSummary.averagePrice)}</div>
                        </div>
                        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60">
                          <div className="text-[11px] text-slate-400">İlk çalışma</div>
                          <div className="text-xs font-semibold text-slate-200">{formatDate(selectedClientSummary.firstDate)}</div>
                        </div>
                        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60 col-span-2 lg:col-span-1">
                          <div className="text-[11px] text-slate-400">Son çalışma</div>
                          <div className="text-xs font-semibold text-slate-200">{formatDate(selectedClientSummary.lastDate)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-400" /> Telefon</span>
                          <p className="font-semibold text-slate-200 mt-1">{selectedClientForDetail.phone || 'Belirtilmemiş'}</p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> E-posta</span>
                          <p className="font-semibold text-slate-200 truncate mt-1">{selectedClientForDetail.email || 'Belirtilmemiş'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-indigo-400" /> Adres</span>
                        <p className="text-slate-200 mt-1">{selectedClientForDetail.address || 'Adres kaydı yok.'}</p>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Müşteri notları</span>
                        <p className="text-slate-300 italic mt-1">{selectedClientForDetail.notes || 'Müşteri notu eklenmemiş.'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-4 h-4 text-indigo-400" /> Çalışma Geçmişi
                        </h3>
                        <div className="text-xs text-slate-400">
                          {selectedClientShoots.length} kayıt gösteriliyor
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={clientShootSearch}
                          onChange={(e) => setClientShootSearch(e.target.value)}
                          placeholder="Çekim türü, konum, not, tarih veya ücret ara..."
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(['all', 'completed', 'planned', 'cancelled'] as const).map(status => (
                          <button
                            type="button"
                            key={status}
                            onClick={() => setClientShootStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs border ${
                              clientShootStatus === status
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}
                          >
                            {status === 'all' ? 'Tümü' : status === 'completed' ? 'Tamamlandı' : status === 'planned' ? 'Planlandı' : 'İptal'}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                        {selectedClientShoots.length === 0 ? (
                          <p className="text-xs text-slate-500 italic bg-slate-900/40 p-5 rounded-lg text-center">
                            Bu filtrelere uygun çalışma kaydı bulunamadı.
                          </p>
                        ) : selectedClientShoots.map(shoot => (
                          <div key={shoot.id} className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-xs space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-100 text-sm">{shoot.shoot_type || 'Çekim'}</div>
                                <div className="text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span><Calendar className="w-3 h-3 inline mr-1 text-indigo-400" />{formatDate(shoot.date)}</span>
                                  {shoot.time && <span><Clock className="w-3 h-3 inline mr-1 text-indigo-400" />{shoot.time}</span>}
                                  <span><MapPin className="w-3 h-3 inline mr-1 text-indigo-400" />{shoot.location || 'Konum belirtilmemiş'}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-green-400 text-sm">{formatCurrency(Number(shoot.price) || 0)}</div>
                                <div className="mt-1">{getStatusBadge(shoot.status)}</div>
                              </div>
                            </div>

                            {shoot.notes && (
                              <div className="bg-slate-800/70 border border-slate-700/50 rounded-lg p-2.5 text-slate-300 italic">
                                “{shoot.notes}”
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                              <div>
                                {shoot.drive_link && (
                                  <a href={shoot.drive_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/50 text-blue-200 border border-blue-700 rounded-lg">
                                    <ExternalLink className="w-3.5 h-3.5" /> Galeriyi Aç
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button type="button" onClick={(e) => handleOpenEditModal(shoot, e)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-indigo-300 bg-indigo-950/50 border border-indigo-800 rounded-lg">
                                  <Edit className="w-3.5 h-3.5" /> Düzenle
                                </button>
                                <button type="button" onClick={(e) => handleDelete(shoot.id, e)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-300 bg-red-950/50 border border-red-800 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" /> Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
                    Detayları görmek için bir müşteri seç.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </main>

    {isClientModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-bold text-slate-100 mb-4">Create New Client</h2>
          <form onSubmit={handleClientSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Client Avatar / Photo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900 border border-slate-700 rounded-lg p-1" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Full Name / Company *</label>
              <input type="text" name="name" required placeholder="Full Name or Company Name" value={clientFormData.name} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone</label>
              <input type="text" name="phone" placeholder="+90 (555) 000 00 00" value={clientFormData.phone} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email</label>
              <input type="email" name="email" placeholder="example@domain.com" value={clientFormData.email} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Address</label>
              <input type="text" name="address" placeholder="Full address details" value={clientFormData.address} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Client Notes</label>
              <textarea name="notes" placeholder="Special notes about the client..." rows={3} value={clientFormData.notes} onChange={handleClientInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition">Cancel</button>
              <button type="submit" disabled={uploadingAvatar} className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition">{uploadingAvatar ? 'Uploading...' : 'Save'}</button>
            </div>
        </form>
      </div>
    </div>
  )}

  {isShootModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold text-slate-100 mb-4">{editingShootId ? 'Edit Shoot' : 'New Shoot'}</h2>
        <form onSubmit={handleShootSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Select Client</label>
            <select value={selectedClientId} onChange={handleClientSelectChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100">
              <option value="new">+ New Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Client Name *</label>
            <input type="text" name="client_name" required placeholder="Client Name" value={formData.client_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Shoot Type</label>
            <input type="text" name="shoot_type" placeholder="e.g. Portrait / Concept / Sport" value={formData.shoot_type} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Date *</label>
              <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location</label>
            <input type="text" name="location" placeholder="Studio or Venue location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Price (₺)</label>
            <input type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Drive / Gallery Link</label>
            <input type="url" name="drive_link" placeholder="https://..." value={formData.drive_link} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Shoot Notes</label>
            <textarea name="notes" placeholder="Special requests or notes for this shoot..." rows={2} value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setIsShootModalOpen(false)} className="w-1/2 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition">Cancel</button>
            <button type="submit" className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition">Save</button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>
);
}
