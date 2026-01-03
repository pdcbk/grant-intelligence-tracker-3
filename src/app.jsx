import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  collection 
} from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Lock, Unlock, Calendar, DollarSign, CheckCircle, 
  RefreshCcw, ListChecks, PieChart, ChevronRight, ChevronLeft, Search,
  AlertTriangle, TrendingDown, Info, Edit3, Save, X, Activity, MoreHorizontal, LogOut, Loader2
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const manualConfig = {
  apiKey: "AIzaSyArzZweirCdxAYccL9XtxNkrg5l73Oy1fY", 
  authDomain: "pdc-grant-intelligence-1.firebaseapp.com",
  projectId: "pdc-grant-intelligence-1",
  storageBucket: "pdc-grant-intelligence-1.firebasestorage.app",
  messagingSenderId: "631553093054",
  appId: "1:631553093054:web:83d5ea233f08be58f2ddef"
};

// Priority logic: Use manualConfig if apiKey is filled, otherwise fallback to environment
const firebaseConfig = (manualConfig.apiKey && manualConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE")
  ? manualConfig 
  : (typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : manualConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pdc-grant-intel-v1';

// --- AUTH & PERMISSIONS CONFIG ---
const ADMIN_EMAIL = "justin@pdcbk.com"; 

const FontImport = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@300;400;500;600;700&display=swap');
      .brand-title { font-family: 'Playfair Display', serif; }
      .brand-body { font-family: 'Poppins', sans-serif; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #E09E42; border-radius: 10px; }
    `}
  </style>
);

const App = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // --- APP STATE ---
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); 
  const [activeTab, setActiveTab] = useState('overview'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [syncedRecords, setSyncedRecords] = useState({});

  const isAdmin = user?.email === ADMIN_EMAIL;

  const COLORS = {
    blue: '#052B6B',
    yellow: '#E09E42',
    cream: '#EDD1A1',
    pink: '#E58F91',
    bgLight: '#FBF9F6',
    softCream: '#FAF3E8' 
  };

  const months = ["Dec '25", "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26", "Nov '26", "Dec '26"];

  const grants = [
    {
      id: 'autism-next',
      name: 'Autism Next',
      total: 10000,
      color: COLORS.blue,
      lineItems: [
        { id: 0, label: 'Payroll Costs (3 programs)', total: 1900, monthly: 158.33, category: 'Wages', type: 'recurring' },
        { id: 1, label: 'Employee Benefits (ICHRA/PTO)', total: 750, monthly: 62.50, category: 'Benefits', type: 'recurring' },
        { id: 2, label: 'Travel Stipends / Lunch & Learns', total: 1000, monthly: 83.33, category: 'Opex', type: 'recurring' },
        { id: 3, label: 'Krowing Dogs 101 / Computers', total: 1350, monthly: 1350, category: 'Opex', type: 'lump' },
        { id: 4, label: 'Supplies / Sensory / Printing', total: 2000, monthly: 166.67, category: 'Opex', type: 'recurring' },
        { id: 5, label: 'Promotion / Marketing', total: 2000, monthly: 166.67, category: 'Opex', type: 'recurring' },
        { id: 6, label: 'Rent, Utilities, Insurance', total: 1000, monthly: 83.33, category: 'Rent', type: 'recurring' },
      ]
    },
    {
      id: 'far-fund',
      name: 'Far Fund',
      total: 40000,
      color: COLORS.yellow,
      lineItems: [
        { id: 0, label: 'PT Salary (Molly)', total: 32500, monthly: 2708.33, category: 'Wages', type: 'recurring' },
        { id: 1, label: 'Health Benefits (ICHRA)', total: 3000, monthly: 250, category: 'Benefits', type: 'recurring' },
        { id: 2, label: 'Employer Payroll Taxes (8.66%)', total: 1407.25, monthly: 117.27, category: 'Taxes', type: 'recurring' },
        { id: 3, label: 'Unrestricted Support', total: 3092.75, monthly: 3092.75, category: 'General', type: 'lump' },
      ]
    },
    {
      id: 'butler',
      name: 'Butler',
      total: 33095.95,
      color: COLORS.pink,
      lineItems: [
        { id: 0, label: 'FT Salary ($25/hr)', total: 19500, monthly: 1950, category: 'Wages', type: 'recurring' },
        { id: 1, label: 'Health Benefits (ICHRA)', total: 3000, monthly: 300, category: 'Benefits', type: 'recurring' },
        { id: 2, label: 'Indirect Costs (OT/Travel)', total: 7500, monthly: 7500, category: 'Opex', type: 'lump' },
        { id: 3, label: 'Employer Payroll Taxes (8.66%)', total: 3095.95, monthly: 309.60, category: 'Taxes', type: 'recurring' },
      ]
    }
  ];

  // --- FIREBASE EFFECT: AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- FIREBASE EFFECT: DATA SYNC ---
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'records');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSyncedRecords(docSnap.data().records || {});
      }
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
    } catch (err) {
      setAuthError("Login failed. Verify your email is enabled in Firebase Auth.");
    } finally {
      setLoading(false);
    }
  };

  const persistData = async (newRecords) => {
    if (!isAdmin && !user?.isAnonymous) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'records');
    try {
      await setDoc(docRef, { records: newRecords });
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const toggleSync = (grantId, item, monthIndex) => {
    if (!isAdmin && !user?.isAnonymous) return;
    const key = `${grantId}-${item.id}-${monthIndex}`;
    const next = { ...syncedRecords };
    if (next[key]?.status) {
      delete next[key];
    } else {
      next[key] = { status: true, amount: item.monthly };
    }
    setSyncedRecords(next);
    persistData(next);
  };

  const saveManualAmount = (key) => {
    if (!isAdmin && !user?.isAnonymous) return;
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      const next = { ...syncedRecords, [key]: { status: true, amount: val } };
      setSyncedRecords(next);
      persistData(next);
    }
    setEditingKey(null);
  };

  const stats = useMemo(() => {
    let releasedSum = 0;
    let behindPaceItems = [];

    grants.forEach(grant => {
      grant.lineItems.forEach(item => {
        let itemMissedAmount = 0;
        for (let m = 0; m <= currentMonthIndex; m++) {
          const record = syncedRecords[`${grant.id}-${item.id}-${m}`];
          if (record?.status) {
            releasedSum += record.amount;
          } else {
            if (item.type === 'recurring') itemMissedAmount += item.monthly;
            else if (m === currentMonthIndex) {
              const anySpent = Object.keys(syncedRecords).some(k => k.startsWith(`${grant.id}-${item.id}-`));
              if (!anySpent) itemMissedAmount = item.total;
            }
          }
        }
        if (itemMissedAmount > 0) {
          behindPaceItems.push({ grantName: grant.name, label: item.label, amount: itemMissedAmount, category: item.category, severity: itemMissedAmount > 2000 ? 'high' : 'medium' });
        }
      });
    });

    const chartData = grants.map(grant => {
      let grantReleased = 0;
      grant.lineItems.forEach(item => {
        for (let m = 0; m <= currentMonthIndex; m++) {
          const record = syncedRecords[`${grant.id}-${item.id}-${m}`];
          if (record?.status) grantReleased += record.amount;
        }
      });
      return { name: grant.name, released: parseFloat(grantReleased.toFixed(2)), remaining: parseFloat(Math.max(0, grant.total - grantReleased).toFixed(2)), color: grant.color };
    });

    behindPaceItems.sort((a, b) => b.amount - a.amount);
    return { chartData, totalReleased: releasedSum, behindPaceItems };
  }, [syncedRecords, currentMonthIndex]);

  const { chartData, totalReleased, behindPaceItems } = stats;
  const totalAwarded = grants.reduce((acc, g) => acc + g.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6]">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: COLORS.blue }} />
      </div>
    );
  }

  // Auth Guard
  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF9F6]">
        <FontImport />
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="brand-title text-3xl font-black text-slate-900 leading-none tracking-tight">PDC INTELLIGENCE</h2>
            <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Grant Flow Audit Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            {authError && <p className="text-rose-500 text-xs font-bold text-center">{authError}</p>}
            <button 
              type="submit"
              className="w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: COLORS.blue }}
            >
              Enter Portal
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Pawsability Dog Club Restricted Access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-20 brand-body" style={{ backgroundColor: COLORS.bgLight }}>
      <FontImport />
      
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: COLORS.blue }}>
                <path d="M50 15c-19.3 0-35 15.7-35 35 0 8.7 3.2 16.6 8.5 22.7l.5.6c4.5 5.1 10.9 8.2 18 8.6 2.6.2 5.3.3 8 .3s5.4-.1 8-.3c7.1-.4 13.5-3.5 18-8.6l.5-.6c5.3-6.1 8.5-14 8.5-22.7 0-19.3-15.7-35-35-35z" />
                <path d="M38 45c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4-4 1.8-4 4zm12 0c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4-4 1.8-4 4z" fill="white" />
                <path d="M50 62c-3.5 0-6.5-1.5-6.5-4s3-4 6.5-4 6.5 1.5 6.5 4-3 4-6.5 4z" fill="white" />
                <path d="M22 35c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm56 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" fill={COLORS.yellow} />
              </svg>
            </div>
            <div>
              <h1 className="brand-title text-3xl font-black uppercase leading-[0.85]" style={{ color: COLORS.blue }}>
                PAWSABILITY<br />
                <span className="text-2xl" style={{ color: COLORS.yellow }}>DOG CLUB</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-[2px] w-8" style={{ backgroundColor: COLORS.pink }} />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {isAdmin ? 'Admin Portal' : 'Read-Only Viewer'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              style={activeTab === 'overview' ? { backgroundColor: COLORS.blue } : {}}
            >
              <PieChart className="w-4 h-4" /> Portfolio
            </button>
            <button 
              onClick={() => setActiveTab('quickbooks')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'quickbooks' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              style={activeTab === 'quickbooks' ? { backgroundColor: COLORS.blue } : {}}
            >
              <RefreshCcw className="w-4 h-4" /> QB Sync
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Restricted</p>
                <h3 className="text-5xl font-black brand-title tracking-tighter" style={{ color: COLORS.blue }}>${totalAwarded.toLocaleString()}</h3>
                <div className="mt-6 flex items-center text-[10px] text-slate-600 font-black uppercase tracking-widest bg-[#FAF3E8] w-fit px-4 py-2 rounded-xl border border-[#EDD1A1]">
                  <ListChecks className="w-3.5 h-3.5 mr-2" style={{ color: COLORS.yellow }} /> Active Sources
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden" style={{ backgroundColor: COLORS.yellow }}>
                <p className="text-amber-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Released to Operations</p>
                <h3 className="text-5xl font-black brand-title tracking-tighter">${totalReleased.toLocaleString(undefined, {minimumFractionDigits: 0})}</h3>
                <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Unlock className="w-3.5 h-3.5 mr-2" /> {((totalReleased / totalAwarded) * 100).toFixed(0)}% Utilized
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden bg-white">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Liability Balance</p>
                <h3 className="text-5xl font-black brand-title tracking-tighter" style={{ color: COLORS.blue }}>${(totalAwarded - totalReleased).toLocaleString(undefined, {minimumFractionDigits: 0})}</h3>
                <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest bg-[#FDF2F3] text-rose-600 w-fit px-4 py-2 rounded-xl border border-[#FBE0E1]">
                  <Lock className="w-3.5 h-3.5 mr-2" /> Pending Audit
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 p-10 rounded-[3.5rem] shadow-sm border border-[#E9E1D6]" style={{ backgroundColor: COLORS.softCream }}>
                <h2 className="text-3xl font-black brand-title mb-12" style={{ color: COLORS.blue }}>Funding Velocity</h2>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E9E1D6" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} className="font-black text-slate-600 uppercase text-[10px] tracking-widest" />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.4)'}} contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '24px' }} />
                      <Bar dataKey="released" stackId="a" fill={COLORS.yellow} />
                      <Bar dataKey="remaining" stackId="a" fill="white" radius={[0, 15, 15, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black brand-title mb-10" style={{ color: COLORS.blue }}>Audit Alerts</h2>
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar">
                  {behindPaceItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.grantName}</span>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight my-2">{item.label}</h4>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200/40">
                        <div className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{item.category}</div>
                        <p className="text-lg font-black brand-title" style={{ color: COLORS.pink }}>-${item.amount.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-[3rem] shadow-sm border border-[#E9E1D6] flex flex-col md:flex-row gap-8 items-center justify-between" style={{ backgroundColor: COLORS.softCream }}>
              <div className="flex items-center gap-10 w-full md:w-auto bg-white p-3 rounded-[2.5rem] shadow-sm border border-[#E9E1D6]">
                <button onClick={() => setCurrentMonthIndex(Math.max(0, currentMonthIndex - 1))} className="p-5 hover:bg-[#FAF3E8] rounded-2xl"><ChevronLeft className="w-6 h-6"/></button>
                <div className="flex-1 text-center min-w-[180px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fiscal Window</p>
                  <p className="text-3xl font-black brand-title tracking-tighter uppercase" style={{ color: COLORS.blue }}>{months[currentMonthIndex]}</p>
                </div>
                <button onClick={() => setCurrentMonthIndex(Math.min(months.length - 1, currentMonthIndex + 1))} className="p-5 hover:bg-[#FAF3E8] rounded-2xl"><ChevronRight className="w-6 h-6"/></button>
              </div>
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Search grants..." 
                  className="w-full pl-16 pr-8 py-6 bg-white border border-[#E9E1D6] rounded-[3rem] text-sm font-bold placeholder-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-12">
              {grants.map(grant => {
                const filteredItems = grant.lineItems.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  grant.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filteredItems.length === 0) return null;

                return (
                  <div key={grant.id} className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-12 py-10 flex justify-between items-center" style={{ backgroundColor: COLORS.softCream, borderBottom: `6px solid ${grant.color}` }}>
                      <div className="flex items-center gap-6">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: grant.color }} />
                        <h3 className="text-3xl font-black brand-title uppercase" style={{ color: COLORS.blue }}>{grant.name}</h3>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Accounting Status</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {filteredItems.map(item => {
                        const syncKey = `${grant.id}-${item.id}-${currentMonthIndex}`;
                        const record = syncedRecords[syncKey];
                        const isSynced = record?.status;
                        
                        return (
                          <div key={item.id} className={`group flex items-center justify-between px-12 py-10 transition-all ${isSynced ? 'bg-[#FAFBFD]' : 'hover:bg-[#FAF3E8]/30'}`}>
                            <div className="flex items-center gap-10">
                              <button 
                                onClick={() => toggleSync(grant.id, item, currentMonthIndex)}
                                className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center transition-all ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''} ${isSynced ? 'text-white' : 'bg-white border-2 border-slate-100 text-slate-200'}`}
                                style={isSynced ? { backgroundColor: COLORS.blue } : {}}
                                disabled={!isAdmin}
                              >
                                {isSynced ? <CheckCircle className="w-8 h-8" /> : <RefreshCcw className="w-7 h-7" />}
                              </button>
                              
                              <div>
                                <h4 className={`text-xl font-bold ${isSynced ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.label}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget: ${item.monthly.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right min-w-[180px]">
                              {editingKey === syncKey && isAdmin ? (
                                <input 
                                  autoFocus
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveManualAmount(syncKey)}
                                  className="w-32 px-5 py-3 text-right text-lg border-2 border-blue-500 rounded-2xl outline-none font-black"
                                />
                              ) : (
                                <div 
                                  className={`flex items-center justify-end gap-6 ${isAdmin ? 'cursor-pointer group/val' : ''}`}
                                  onClick={() => isAdmin && isSynced ? (setEditingKey(syncKey), setEditValue(record.amount.toString())) : toggleSync(grant.id, item, currentMonthIndex)}
                                >
                                  <div>
                                    <div className={`text-3xl font-black brand-title ${isSynced ? '' : 'text-slate-200'}`} style={isSynced ? { color: COLORS.yellow } : {}}>
                                      ${(isSynced ? record.amount : item.monthly).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                      {isSynced ? 'Audit Verified' : 'Forecasted'}
                                    </p>
                                  </div>
                                  {isAdmin && <Edit3 className="w-5 h-5 text-slate-200 opacity-0 group-hover/val:opacity-100 transition-opacity" />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
