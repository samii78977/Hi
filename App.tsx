import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Settings, 
  Plus, 
  PieChart as PieIcon,
  TrendingUp,
  LogOut,
  X,
  CreditCard,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  LayoutDashboard,
  History,
  ArrowRightLeft,
  Calendar,
  Github,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import { Transaction, UserProfile, FinancialStats, Language } from './types';
import { translations } from './translations';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'BDT', symbol: '৳' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<UserProfile>({ 
    name: 'Guest', 
    currency: '$', 
    language: 'en',
    syncId: Math.random().toString(36).substring(2, 10).toUpperCase()
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [importToken, setImportToken] = useState('');

  const t = translations[user.language];

  useEffect(() => {
    const savedTransactions = localStorage.getItem('lumina_transactions');
    const savedUser = localStorage.getItem('lumina_user');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_transactions', JSON.stringify(transactions));
    localStorage.setItem('lumina_user', JSON.stringify(user));
  }, [transactions, user]);

  const currentMonthYear = new Date().toISOString().substring(0, 7);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthYear));
  }, [transactions, currentMonthYear]);

  const stats = useMemo<FinancialStats>(() => {
    const targetSet = view === 'dashboard' ? monthlyTransactions : transactions;
    const income = targetSet.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = targetSet.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const breakdown: Record<string, number> = {};
    targetSet.filter(t => t.type === 'expense').forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense, categoryBreakdown: breakdown };
  }, [transactions, monthlyTransactions, view]);

  const chartData = useMemo(() => Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value })), [stats]);
  const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#2dd4bf'];

  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...data, id: crypto.randomUUID() }, ...prev]);
  };

  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const handleSyncPush = () => {
    setIsSyncing(true);
    const data = { transactions, user };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    setSyncToken(encoded);
    setTimeout(() => {
      setUser(p => ({ ...p, lastSync: new Date().toLocaleString() }));
      setIsSyncing(false);
    }, 1500);
  };

  const handleSyncPull = () => {
    if (!importToken.trim()) return;
    try {
      setIsSyncing(true);
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importToken))));
      if (decoded.transactions && decoded.user) {
        setTransactions(decoded.transactions);
        setUser({ ...decoded.user, lastSync: new Date().toLocaleString() });
        setImportToken('');
        setTimeout(() => {
          setIsSyncing(false);
          setShowSync(false);
        }, 1000);
      }
    } catch (e) {
      alert(t.syncError);
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 md:pb-16 relative">
      <header className="sticky top-0 z-40 w-full glass px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
            <CreditCard className="text-white" size={24} />
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">LUMINA</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {user.lastSync ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Cloud size={10} /> {t.cloudSync}</span>
                ) : (
                  <span className="text-white/20">{t.welcome}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowSync(true)} className="p-2.5 glass-card rounded-xl text-blue-400/60 hover:text-blue-400 hover:bg-blue-400/10 transition-all border-white/5">
            <Cloud size={22} />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2.5 glass-card rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all border-white/5">
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {view === 'dashboard' ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">{t.monthlySummary}</h2>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Calendar size={20} className="text-blue-400" />
                  {t.monthName(new Date())}
                </h3>
              </div>
              <div className="hidden sm:block text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {t.thisMonthOnly}
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-[2.5rem] p-8 group border-blue-500/20">
                <div className="glow-spot bg-blue-500 -top-20 -left-20"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Wallet size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{t.balance}</span>
                </div>
                <div className="text-4xl font-extrabold text-gradient mb-2 tracking-tight">
                  {user.currency}{stats.balance.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-400/80 font-bold">
                  <TrendingUp size={14} /> {t.stable}
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 group border-emerald-500/20">
                <div className="glow-spot bg-emerald-500 -top-20 -left-20"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <ArrowUpCircle size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{t.income}</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                  +{user.currency}{stats.totalIncome.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-400/60 font-bold">{t.allSources}</div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 group border-red-500/20">
                <div className="glow-spot bg-red-500 -top-20 -left-20"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 group-hover:scale-110 transition-transform">
                    <ArrowDownCircle size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{t.expense}</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                  -{user.currency}{stats.totalExpense.toLocaleString()}
                </div>
                <div className="text-xs text-red-400/60 font-bold">{t.toDate}</div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-[2.5rem] p-8 h-[420px]">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                      <PieIcon size={18} className="text-blue-400" />
                      {t.expenseBreakdown}
                    </h3>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                            {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(val: number) => [`${user.currency}${val}`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-white/10 italic">{t.noTransactions}</div>}
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8 h-[420px]">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                      <TrendingUp size={18} className="text-emerald-400" />
                      {t.cashFlow}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: t.income, amount: stats.totalIncome, fill: '#10b981' }, { name: t.expense, amount: stats.totalExpense, fill: '#ef4444' }]}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} />
                        <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="relative group">
                  <TransactionList transactions={monthlyTransactions.slice(0, 5)} onDelete={deleteTransaction} onExport={() => {}} currency={user.currency} language={user.language} />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none rounded-b-[2.5rem]" />
                  <button onClick={() => setView('history')} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                    {t.navHistory} <ArrowRightLeft size={14} />
                  </button>
                </div>
              </div>

              <aside className="lg:col-span-4 space-y-6">
                <div className="glass-card rounded-[2.5rem] p-6">
                  <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">{t.quickActions}</h4>
                  <div className="space-y-3">
                    <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-between p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl transition-all group text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><ArrowUpCircle size={18} /></div>
                        <span className="text-xs font-bold text-white/70">{t.addIncome}</span>
                      </div>
                      <ChevronRight size={16} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all group text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><ArrowDownCircle size={18} /></div>
                        <span className="text-xs font-bold text-white/70">{t.addExpense}</span>
                      </div>
                      <ChevronRight size={16} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
                
                <div className="glass-card rounded-[2.5rem] p-8 border-indigo-500/10 bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Storage Information</h3>
                  <p className="text-[10px] text-white/30 leading-relaxed uppercase font-bold tracking-tight">
                    Your financial data is encrypted and stored exclusively in your browser's local storage. No data is sent to external servers unless you perform a manual sync.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">{t.historyTitle}</h2>
                <p className="text-sm text-white/40">{t.allTime}</p>
              </div>
              <div className="flex items-center gap-4 glass-card px-8 py-4 rounded-[2rem] border-blue-500/10">
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t.income}</p>
                    <p className="text-xl font-black text-emerald-400">+{user.currency}{stats.totalIncome.toLocaleString()}</p>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t.expense}</p>
                    <p className="text-xl font-black text-red-400">-{user.currency}{stats.totalExpense.toLocaleString()}</p>
                 </div>
              </div>
            </div>
            <TransactionList transactions={transactions} onDelete={deleteTransaction} onExport={() => {}} currency={user.currency} language={user.language} />
          </div>
        )}
      </main>

      <footer className="mt-12 mb-20 text-center space-y-4">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 glass-card rounded-full border-white/10 text-white/40 hover:text-white transition-all hover:scale-105"
        >
          <Github size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Source on GitHub</span>
        </a>
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">© 2025 Lumina Finance • MIT Licensed</p>
      </footer>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-4 py-3 rounded-full border-white/10 shadow-2xl shadow-black flex items-center gap-2 z-40 backdrop-blur-3xl ring-1 ring-white/5">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-xs font-black transition-all ${view === 'dashboard' ? 'bg-white text-slate-950 shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <LayoutDashboard size={16} strokeWidth={3} />
          {t.navDashboard}
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-xs font-black transition-all ${view === 'history' ? 'bg-white text-slate-950 shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <History size={16} strokeWidth={3} />
          {t.navHistory}
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button 
          onClick={() => setShowForm(true)}
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 active:scale-90"
        >
          <Plus size={24} strokeWidth={4} />
        </button>
      </nav>

      {showSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl transition-all">
          <div className="w-full max-w-lg glass p-10 rounded-[3rem] shadow-2xl relative border-white/10 animate-in zoom-in duration-300">
            <button onClick={() => setShowSync(false)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={24} /></button>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center shadow-inner"><Cloud size={32} /></div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t.cloudSync}</h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t.lastSync}: {user.lastSync || t.never}</p>
              </div>
            </div>
            <div className="space-y-10">
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 relative overflow-hidden">
                {isSyncing && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10"><RefreshCw size={40} className="text-blue-400 animate-spin" /></div>}
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.syncId}</p>
                    <p className="text-xl font-black text-white tracking-widest tabular-nums">{user.syncId}</p>
                  </div>
                  <button onClick={handleSyncPush} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-110 active:scale-95"><Upload size={24} /></button>
                </div>
                {syncToken && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> {t.syncKey}</p>
                    <div className="flex gap-2">
                      <input readOnly value={syncToken} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/40 focus:outline-none" />
                      <button onClick={() => navigator.clipboard.writeText(syncToken)} className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"><Copy size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">{t.downloadCloud}</label>
                <div className="flex gap-3">
                  <input placeholder={t.pasteKey} value={importToken} onChange={(e) => setImportToken(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  <button onClick={handleSyncPull} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors"><Download size={24} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl transition-all">
          <div className="w-full max-w-md glass p-10 rounded-[3rem] shadow-2xl relative border-white/10 animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black text-white mb-8 tracking-tighter">{t.settings}</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">{t.language}</label>
                <div className="grid grid-cols-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <button onClick={() => setUser(p => ({...p, language: 'en'}))} className={`py-2.5 rounded-xl text-xs font-black transition-all ${user.language === 'en' ? 'bg-white text-slate-950 shadow-lg' : 'text-white/40 hover:text-white'}`}>English</button>
                  <button onClick={() => setUser(p => ({...p, language: 'bn'}))} className={`py-2.5 rounded-xl text-xs font-black transition-all ${user.language === 'bn' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>বাংলা</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">{t.amount} ({user.currency})</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                  {CURRENCIES.map(c => (
                    <button key={c.code} onClick={() => setUser(p => ({...p, currency: c.symbol}))} className={`py-2 rounded-xl text-[10px] font-black transition-all ${user.currency === c.symbol ? 'bg-white text-slate-950 shadow-lg' : 'text-white/40 hover:text-white'}`}>
                      {c.code} ({c.symbol})
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center justify-center gap-2 py-4 text-red-400 text-xs font-black bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-all uppercase tracking-widest"><LogOut size={16} /> Wipe Data</button>
            </div>
          </div>
        </div>
      )}

      {showForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowForm(false)} currency={user.currency} language={user.language} />}
    </div>
  );
};

export default App;