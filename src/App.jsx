import { useState, useMemo, useEffect } from 'react';
import { Coins, Plus, History, Settings, Home, X, Trash2, ArrowUpRight, ArrowDownRight, Info, Edit3, Check, LogOut, ChevronRight, TrendingUp } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db, auth } from './firebase';
import './index.css';

// -----------------------------------------------------------------------------
// Temas (Themes)
// -----------------------------------------------------------------------------
const THEMES = [
  { id: 0, name: "Azul Vaultify", color: "#3B82F6", rgb: "59, 130, 246" },
  { id: 1, name: "Morado Neón", color: "#A855F7", rgb: "168, 85, 247" },
  { id: 2, name: "Esmeralda", color: "#10B981", rgb: "16, 185, 129" },
  { id: 3, name: "Rosa Chicle", color: "#F43F5E", rgb: "244, 63, 94" },
  { id: 4, name: "Naranja Atardecer", color: "#F97316", rgb: "249, 115, 22" },
  { id: 5, name: "Dorado Premium", color: "#F59E0B", rgb: "245, 158, 11" }
];

// -----------------------------------------------------------------------------
// Pantalla de Autenticación & Tutorial
// -----------------------------------------------------------------------------
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { setError(err.message.includes('auth/') ? 'Credenciales incorrectas o usuario no encontrado.' : err.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '2rem', boxSizing: 'border-box', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem', width: '100%' }}>
        <div style={{ background: 'rgba(var(--accent-blue-rgb), 0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', color: 'var(--accent-blue)' }}><Coins size={40} /></div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px' }}>VAULTIFY</h1>
        <p className="text-secondary">Controla tus finanzas y ahorros</p>
      </div>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>{isLogin ? 'Iniciar sesión' : 'Registrarse'}</h2>
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Correo electrónico" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', marginBottom: '1rem' }} />
          <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" required minLength="6" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', marginBottom: '2rem' }} />
          <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', background: 'var(--accent-blue)', color: 'white', marginBottom: '1rem' }}>{isLogin ? 'Entrar' : 'Crear Cuenta'}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', color: 'var(--text-secondary)', width: '100%', textAlign: 'center', fontSize: '0.9rem' }}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button>
      </div>
    </div>
  );
};

const TutorialOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const renderTooltip = () => {
    switch (step) {
      case 1: return ( <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '130px', left: '10%', right: '10%', zIndex: 1001, border: '2px solid var(--accent-blue)' }}><h3 style={{ marginBottom: '10px', color: 'var(--accent-blue)' }}>¡Bienvenido a Vaultify!</h3><p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Esta tarjeta anclada siempre mostrará la <b>suma total</b> de todos tus ahorros en tiempo real.</p><button onClick={() => setStep(2)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold' }}>Siguiente <ChevronRight size={16} style={{display: 'inline', verticalAlign: 'text-bottom'}} /></button></div> );
      case 2: return ( <div className="glass-card animate-fade-in" style={{ position: 'absolute', bottom: '100px', left: '10%', right: '10%', zIndex: 1001, border: '2px solid var(--accent-green)' }}><h3 style={{ marginBottom: '10px', color: 'var(--accent-green)' }}>Añadir Fuentes</h3><p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Usa el <b>botón azul (+)</b> de la barra inferior para crear nuevas fuentes de fondos (cuentas bancarias, efectivo, criptos...).</p><button onClick={() => setStep(3)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--accent-green)', color: 'white', fontWeight: 'bold' }}>Siguiente <ChevronRight size={16} style={{display: 'inline', verticalAlign: 'text-bottom'}} /></button></div> );
      case 3: return ( <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', transform: 'translateY(-50%)', zIndex: 1001, border: '2px solid var(--text-primary)' }}><h3 style={{ marginBottom: '10px', color: 'white' }}>Gestión Fácil</h3><p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Toca cualquier fuente para ver su historial. Además, ¡ahora puedes <b>arrastrar y soltar</b> las tarjetas para ordenarlas a tu gusto!</p><button onClick={onComplete} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'white', color: 'black', fontWeight: 'bold' }}>¡Empezar a ahorrar!</button></div> );
      default: return null;
    }
  };
  return ( <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000 }}>{renderTooltip()}</div> );
};

// -----------------------------------------------------------------------------
// Componentes UI Básicos (Tarjetas)
// -----------------------------------------------------------------------------
const AccountCard = ({ account, isPinned, onSelect, privacyMode, isReorderMode }) => {
  const isCrypto = account.currency !== '€';
  const balanceEur = isCrypto ? (account.cryptoBalance * account.rate) : account.balance;
  return (
    <div className={`glass-card ${isPinned ? 'pinned' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isPinned ? 'default' : (isReorderMode ? 'grab' : 'pointer'), position: 'relative' }} onClick={() => !isPinned && !isReorderMode && onSelect && onSelect(account)}>
      {!isPinned && account.excludeFromTotal && (<div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--text-secondary)' }} title="Excluido del total"><Info size={14} /></div>)}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: isPinned ? 'rgba(var(--accent-blue-rgb), 0.2)' : 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: isPinned ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
          {isPinned ? <Coins size={28} /> : <Coins size={24} />}
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{account.name}</h3>
          {isCrypto && (<p className="text-secondary" style={{ fontSize: '0.85rem' }}>{privacyMode ? '****' : (account.cryptoBalance || 0).toFixed(4)} {account.currency}</p>)}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: account.excludeFromTotal ? '10px' : '0' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{privacyMode ? '**** €' : `${(balanceEur || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}</h2>
        {!isPinned && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', fontSize: '0.8rem' }}><span className="text-secondary">Ver detalles</span></div>)}
      </div>
    </div>
  );
};

const WatchlistCard = ({ coinId, onRemove, privacyMode }) => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const coinNames = { 'bitcoin': 'Bitcoin (BTC)', 'ethereum': 'Ethereum (ETH)', 'litecoin': 'Litecoin (LTC)', 'solana': 'Solana (SOL)', 'usd-coin': 'USDC' };

  useEffect(() => {
    let isMounted = true;
    const fetchMarketData = async () => {
      const cacheKey = `vaultify_coin_${coinId}`;
      
      try {
        // 1. Check valid cache (5 minutos)
        const cachedStr = localStorage.getItem(cacheKey);
        let cachedData = null;
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            // Cache is still fresh
            processChartData(parsed.data);
            return;
          }
          cachedData = parsed.data; // Keep as fallback
        }

        // 2. Fetch API
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=eur&days=1`);
        if (!res.ok) throw new Error('Rate limit or API error');
        const data = await res.json();
        
        // 3. Save to cache and process
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        if (isMounted) processChartData(data);

      } catch (err) { 
        console.error("Error fetching coin:", coinId, err);
        // Fallback to expired cache if API fails
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr && isMounted) {
          processChartData(JSON.parse(cachedStr).data);
        }
      } finally { 
        if (isMounted) setLoading(false); 
      }
    };

    const processChartData = (data) => {
      if (data && data.prices && data.prices.length > 0) {
        const formattedData = data.prices.map(item => ({ price: item[1] }));
        setChartData(formattedData);
        const firstPrice = formattedData[0].price; 
        const lastPrice = formattedData[formattedData.length - 1].price;
        setCurrentPrice(lastPrice); 
        setPriceChange(((lastPrice - firstPrice) / firstPrice) * 100);
      }
    };

    fetchMarketData();
    return () => { isMounted = false; };
  }, [coinId]);

  if (loading) return <div className="glass-card" style={{ height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p className="text-secondary">Cargando...</p></div>;

  const isUp = priceChange >= 0;
  const color = 'var(--accent-blue)'; // Hereda el color del tema actual

  return (
    <div className="glass-card" style={{ padding: '1.2rem', position: 'relative', cursor: 'default' }}>
      {/* Botón borrar */}
      <div 
        onPointerDown={e => e.stopPropagation()} 
        onClick={(e) => { e.stopPropagation(); onRemove(coinId); }} 
        style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--text-secondary)', zIndex: 20, cursor: 'pointer' }}
      >
        <X size={16} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{coinNames[coinId]}</h3>
          <p style={{ color: color, fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isUp ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />} {isUp ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>
        <div style={{ textAlign: 'right' }}><h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{privacyMode ? '**** €' : `${currentPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}</h2></div>
      </div>
      
      <div style={{ width: '100%', height: '50px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}><YAxis domain={['dataMin', 'dataMax']} hide /><Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componentes DND Wrappers
// -----------------------------------------------------------------------------
const SortableAccountCard = ({ id, isReorderMode, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isReorderMode });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  return ( <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="animate-fade-in"><AccountCard {...props} isReorderMode={isReorderMode} /></div> );
};

const SortableWatchlistCard = ({ id, isReorderMode, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isReorderMode });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  return ( <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="animate-fade-in"><WatchlistCard coinId={id} {...props} /></div> );
};

// -----------------------------------------------------------------------------
// Modales de Acción (iguales que antes)
// -----------------------------------------------------------------------------
const CreateAccountModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState(''); const [currency, setCurrency] = useState('€'); const [excludeFromTotal, setExcludeFromTotal] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = (e) => { e.preventDefault(); if (!name) return; onSubmit({ name, currency, excludeFromTotal, balance: 0, cryptoBalance: 0 }); setName(''); setCurrency('€'); setExcludeFromTotal(false); onClose(); };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', border: '1px solid var(--card-border)' }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}><h2 style={{ fontSize: '1.3rem' }}>Nueva Fuente de Fondos</h2><button onClick={onClose} style={{ background: 'none', color: 'var(--text-primary)' }}><X size={24} /></button></div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre de la fuente</label><input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Cuenta Banco..." style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} /></div>
          <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Divisa</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}><option value="€" style={{ background: 'var(--bg-color)' }}>Euros (€)</option><option value="BTC" style={{ background: 'var(--bg-color)' }}>Bitcoin (BTC)</option><option value="ETH" style={{ background: 'var(--bg-color)' }}>Ethereum (ETH)</option><option value="LTC" style={{ background: 'var(--bg-color)' }}>Litecoin (LTC)</option><option value="SOL" style={{ background: 'var(--bg-color)' }}>Solana (SOL)</option><option value="USDC" style={{ background: 'var(--bg-color)' }}>USDC</option></select></div>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><input type="checkbox" id="excludeCb" checked={excludeFromTotal} onChange={e => setExcludeFromTotal(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-blue)' }} /><label htmlFor="excludeCb" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>No incluir esta fuente en el "Total de ahorros"</label></div>
          <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', background: 'var(--accent-blue)', color: 'white' }}>Crear Fuente</button>
        </form>
      </div>
    </div>
  );
};

const AccountDetailsModal = ({ isOpen, onClose, account, transactions, onAddFunds, onWithdrawFunds, onDelete, onUpdateName }) => {
  const [isEditingName, setIsEditingName] = useState(false); const [editNameValue, setEditNameValue] = useState('');
  useEffect(() => { if (account) { setEditNameValue(account.name); setIsEditingName(false); } }, [account]);
  if (!isOpen || !account) return null;
  const accTxs = transactions.filter(t => t.accountId === account.id);
  const handleSaveName = () => { if (editNameValue.trim() && editNameValue !== account.name) { onUpdateName(account, editNameValue.trim()); } setIsEditingName(false); };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 90 }}>
      <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '600px', height: '85vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid var(--card-border)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            {isEditingName ? ( <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="text" value={editNameValue} onChange={e => setEditNameValue(e.target.value)} autoFocus style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)', fontSize: '1.2rem', width: '100%', outline: 'none' }} /><button onClick={handleSaveName} style={{ background: 'var(--accent-green)', color: 'white', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}><Check size={20} /></button></div> ) : ( <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><h2 style={{ fontSize: '1.4rem' }}>{account.name}</h2><button onClick={() => setIsEditingName(true)} style={{ background: 'none', color: 'var(--text-secondary)' }}><Edit3 size={18} /></button></div> )}
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '4px' }}>Balance: {account.currency === '€' ? `${(account.balance || 0).toFixed(2)} €` : `${(account.cryptoBalance || 0).toFixed(4)} ${account.currency}`}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-primary)' }}><X size={28} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Movimientos recientes</h3>
          {accTxs.length === 0 ? ( <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No hay movimientos aún.</p> ) : ( accTxs.map(tx => ( <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '0.8rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</div><div><p style={{ fontWeight: '600' }}>{tx.concept}</p><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(tx.date).toLocaleDateString()}</p></div></div><div style={{ fontWeight: 'bold', color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} {account.currency}</div></div> )) )}
        </div>
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}><button onClick={() => onAddFunds(account)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>Ingresar</button><button onClick={() => onWithdrawFunds(account)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }}>Retirar</button></div>
          <button onClick={() => onDelete(account)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Trash2 size={18} /> Eliminar esta cuenta</button>
        </div>
      </div>
    </div>
  );
};

const GlobalHistoryModal = ({ isOpen, onClose, transactions, accounts }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 120 }}>
      <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '600px', height: '90vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid var(--card-border)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontSize: '1.4rem' }}>Historial Global</h2><button onClick={onClose} style={{ background: 'none', color: 'var(--text-primary)' }}><X size={28} /></button></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {transactions.length === 0 ? ( <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No hay movimientos en ninguna cuenta.</p> ) : ( transactions.map(tx => { const acc = accounts.find(a => a.id === tx.accountId); const currency = acc ? acc.currency : '€'; const accName = acc ? acc.name : 'Cuenta Eliminada'; return ( <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '0.8rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</div><div><p style={{ fontWeight: '600' }}>{tx.concept}</p><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(tx.date).toLocaleDateString()} &bull; {accName}</p></div></div><div style={{ fontWeight: 'bold', color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} {currency}</div></div> ); }) )}
        </div>
      </div>
    </div>
  );
};

const TransactionModal = ({ isOpen, onClose, account, type, onSubmit }) => {
  const [amount, setAmount] = useState(''); const [concept, setConcept] = useState('');
  if (!isOpen || !account) return null;
  const handleSubmit = (e) => { e.preventDefault(); if (!amount || isNaN(amount) || amount <= 0) return; onSubmit({ accountId: account.id, type, amount: parseFloat(amount), concept, date: new Date().toISOString() }); setAmount(''); setConcept(''); onClose(); };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 110 }}>
      <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', border: '1px solid var(--card-border)' }} className="animate-fade-in"><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}><h2 style={{ fontSize: '1.3rem' }}>{type === 'income' ? 'Nuevo Ingreso' : 'Nuevo Retiro'}</h2><button onClick={onClose} style={{ background: 'none', color: 'var(--text-primary)' }}><X size={24} /></button></div><form onSubmit={handleSubmit}><div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Cantidad ({account.currency})</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required autoFocus style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '1.5rem', fontWeight: 'bold', outline: 'none' }} /></div><div style={{ marginBottom: '2rem' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Concepto</label><input type="text" value={concept} onChange={e => setConcept(e.target.value)} placeholder={type === 'income' ? "Ej. Nómina..." : "Ej. Compra..."} required style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} /></div><button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', background: type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)', color: 'white' }}>Confirmar</button></form></div>
    </div>
  );
};

const AddWatchlistModal = ({ isOpen, onClose, currentWatchlist, onAdd }) => {
  if (!isOpen) return null;
  const allCoins = [{ id: 'bitcoin', label: 'Bitcoin (BTC)' }, { id: 'ethereum', label: 'Ethereum (ETH)' }, { id: 'litecoin', label: 'Litecoin (LTC)' }, { id: 'solana', label: 'Solana (SOL)' }, { id: 'usd-coin', label: 'USDC' }];
  const availableCoins = allCoins.filter(c => !currentWatchlist.includes(c.id));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', border: '1px solid var(--card-border)' }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}><h2 style={{ fontSize: '1.3rem' }}>Añadir a Watchlist</h2><button onClick={onClose} style={{ background: 'none', color: 'var(--text-primary)' }}><X size={24} /></button></div>
        {availableCoins.length === 0 ? ( <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Ya estás siguiendo todas las criptomonedas disponibles.</p> ) : ( <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{availableCoins.map(coin => ( <button key={coin.id} onClick={() => { onAdd(coin.id); onClose(); }} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1.1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>{coin.label}<Plus size={20} color="var(--accent-blue)" /></button> ))}</div> )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componentes Nuevos: Perfil y Preferencias
// -----------------------------------------------------------------------------
const ProfileModal = ({ isOpen, onClose, user, onUpdateName }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.displayName || '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      if (onUpdateName) onUpdateName(name.trim());
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  };

  const createdDate = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('es-ES') : 'Desconocido';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg-color)', width: '90%', maxWidth: '400px', borderRadius: '24px', border: '1px solid var(--card-border)', overflow: 'hidden' }} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Mi Perfil</h2>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', border: '3px solid rgba(255,255,255,0.1)' }}>
            {getInitials()}
          </div>
          <form onSubmit={handleSave} style={{ width: '100%' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nombre de usuario</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Tu nombre..." style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email</label>
              <input type="email" value={user.email} disabled style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '1rem', outline: 'none', cursor: 'not-allowed' }} />
            </div>
            <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', background: 'var(--accent-blue)', color: 'white', opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Miembro desde: {createdDate}</p>
        </div>
      </div>
    </div>
  );
};

const PreferencesModal = ({ isOpen, onClose, privacyMode, hideWatchlist, onTogglePrivacy, onToggleWatchlist }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg-color)', width: '90%', maxWidth: '400px', borderRadius: '24px', border: '1px solid var(--card-border)', overflow: 'hidden' }} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Preferencias</h2>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Modo Discreto</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ocultar cifras con asteriscos</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={privacyMode} onChange={(e) => onTogglePrivacy(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Ocultar Watchlist</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No mostrar tarjetas de criptos</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={hideWatchlist} onChange={(e) => onToggleWatchlist(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componente de Temas
// -----------------------------------------------------------------------------
const ThemeModal = ({ isOpen, onClose, activeThemeId, onSelectTheme }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg-color)', width: '90%', maxWidth: '400px', borderRadius: '24px', border: '1px solid var(--card-border)', overflow: 'hidden' }} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Apariencia</h2>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
          {THEMES.map(theme => (
            <button 
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              style={{ 
                width: '60px', height: '60px', borderRadius: '50%', background: theme.color, 
                border: activeThemeId === theme.id ? '3px solid white' : '3px solid transparent',
                cursor: 'pointer', transition: 'transform 0.2s', 
                transform: activeThemeId === theme.id ? 'scale(1.1)' : 'scale(1)',
                boxShadow: activeThemeId === theme.id ? `0 0 20px ${theme.color}` : 'none'
              }}
              title={theme.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------
function App() {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cryptoRates, setCryptoRates] = useState({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [accountsOrder, setAccountsOrder] = useState([]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [hideWatchlist, setHideWatchlist] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  
  const [selectedAccount, setSelectedAccount] = useState(null); 
  const [txModalParams, setTxModalParams] = useState(null); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);


  // Configuración de Drag & Drop Sensors (requiere 5px de arrastre para activar y permitir clics)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoaded(true);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.hasSeenTutorial) setShowTutorial(true);
            setWatchlist(data.watchlist || []);
            setAccountsOrder(data.accountsOrder || []);
            setPrivacyMode(data.privacyMode || false);
            setHideWatchlist(data.hideWatchlist || false);
            setActiveThemeId(data.themeId !== undefined ? data.themeId : 0);
          } else {
            setShowTutorial(true);
            setWatchlist([]);
            setAccountsOrder([]);
            setPrivacyMode(false);
            setHideWatchlist(false);
            setActiveThemeId(0);
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAccounts = [];
      snapshot.forEach(doc => loadedAccounts.push({ id: doc.id, ...doc.data() }));
      setAccounts(loadedAccounts);
      setSelectedAccount(prev => {
        if (prev) {
          const updated = loadedAccounts.find(a => a.id === prev.id);
          return updated || null;
        }
        return prev;
      });
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = [];
      snapshot.forEach(doc => txs.push({ id: doc.id, ...doc.data() }));
      // Ordenar localmente por fecha descendente para evitar index compuesto en Firestore
      txs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      const cacheKey = 'vaultify_crypto_rates';
      try {
        // Try to load cache first to show something immediately
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Date.now() - parsed.timestamp < 2 * 60 * 1000) {
             setCryptoRates(parsed.data);
             return;
          }
        }
        
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,solana,usd-coin&vs_currencies=eur');
        if (!response.ok) throw new Error('API Rate Limit');
        const data = await response.json();
        
        const rates = { BTC: data.bitcoin?.eur || 0, ETH: data.ethereum?.eur || 0, LTC: data.litecoin?.eur || 0, SOL: data.solana?.eur || 0, USDC: data['usd-coin']?.eur || 0 };
        setCryptoRates(rates);
        localStorage.setItem(cacheKey, JSON.stringify({ data: rates, timestamp: Date.now() }));
      } catch (error) { 
        console.error("Error crypto:", error);
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) setCryptoRates(JSON.parse(cachedStr).data);
      }
    };
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Aplicar tema de color dinámico
  useEffect(() => {
    const theme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    document.documentElement.style.setProperty('--accent-blue', theme.color);
    document.documentElement.style.setProperty('--accent-blue-rgb', theme.rgb);
  }, [activeThemeId]);

  // Ordenar Accounts para renderizar respetando accountsOrder
  const sortedAccounts = useMemo(() => {
    const mapped = accounts.map(acc => {
      const isCrypto = acc.currency !== '€';
      return { ...acc, rate: isCrypto ? (cryptoRates[acc.currency] || 1) : 1 };
    });
    mapped.sort((a, b) => {
      const idxA = accountsOrder.indexOf(a.id);
      const idxB = accountsOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
    return mapped;
  }, [accounts, cryptoRates, accountsOrder]);

  const totalBalance = useMemo(() => {
    return sortedAccounts.reduce((sum, acc) => {
      if (acc.excludeFromTotal) return sum;
      const eurValue = acc.currency !== '€' ? (acc.cryptoBalance * acc.rate) : acc.balance;
      return sum + (eurValue || 0);
    }, 0);
  }, [sortedAccounts]);

  const pinnedAccount = { id: 'total', name: 'Total de ahorros', currency: '€', balance: totalBalance, excludeFromTotal: false };

  // Handlers
  const handleCreateAccount = async (newAccount) => {
    const accId = 'acc_' + Date.now();
    await setDoc(doc(db, 'accounts', accId), { ...newAccount, userId: user.uid });
    
    // Añadir al final del array de orden
    const newOrder = [...accountsOrder, accId];
    await setDoc(doc(db, 'users', user.uid), { accountsOrder: newOrder }, { merge: true });
  };

  const handleUpdateAccountName = async (account, newName) => { await updateDoc(doc(db, 'accounts', account.id), { name: newName }); };
  
  const handleDeleteAccount = async (account) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la fuente "${account.name}" y todo su historial de movimientos?`)) {
      await deleteDoc(doc(db, 'accounts', account.id));
      setSelectedAccount(null); 
    }
  };

  const handleTransaction = async (transaction) => {
    const acc = accounts.find(a => a.id === transaction.accountId);
    if (acc) {
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      let updates = {};
      if (acc.currency === '€') updates.balance = (acc.balance || 0) + amount;
      else updates.cryptoBalance = (acc.cryptoBalance || 0) + amount;
      
      await updateDoc(doc(db, 'accounts', transaction.accountId), updates);
      const txId = Date.now().toString();
      await setDoc(doc(db, 'transactions', txId), { ...transaction, userId: user.uid });
    }
  };

  const handleCompleteTutorial = async () => {
    setShowTutorial(false);
    await setDoc(doc(db, 'users', user.uid), { hasSeenTutorial: true }, { merge: true });
  };

  const handleLogout = async () => { await signOut(auth); };

  // Watchlist & DND Handlers
  const handleAddToWatchlist = async (coinId) => {
    const newWatchlist = [...watchlist, coinId];
    await setDoc(doc(db, 'users', user.uid), { watchlist: newWatchlist }, { merge: true });
  };

  const handleRemoveFromWatchlist = async (coinId) => {
    const newWatchlist = watchlist.filter(id => id !== coinId);
    await setDoc(doc(db, 'users', user.uid), { watchlist: newWatchlist }, { merge: true });
  };

  const handleDragEndAccounts = async (event) => {
    setActiveAccountId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedAccounts.findIndex((a) => a.id === active.id);
      const newIndex = sortedAccounts.findIndex((a) => a.id === over.id);
      
      const newOrder = arrayMove(sortedAccounts, oldIndex, newIndex).map(a => a.id);
      await setDoc(doc(db, 'users', user.uid), { accountsOrder: newOrder }, { merge: true });
    }
  };

  const handleDragEndWatchlist = async (event) => {
    setActiveWatchlistId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = watchlist.indexOf(active.id);
      const newIndex = watchlist.indexOf(over.id);
      
      const newWatchlist = arrayMove(watchlist, oldIndex, newIndex);
      await setDoc(doc(db, 'users', user.uid), { watchlist: newWatchlist }, { merge: true });
    }
  };

  const handleTogglePrivacy = async (value) => {
    setPrivacyMode(value);
    await setDoc(doc(db, 'users', user.uid), { privacyMode: value }, { merge: true });
  };

  const handleToggleWatchlist = async (value) => {
    setHideWatchlist(value);
    await setDoc(doc(db, 'users', user.uid), { hideWatchlist: value }, { merge: true });
  };

  const handleSelectTheme = async (themeId) => {
    setActiveThemeId(themeId);
    await setDoc(doc(db, 'users', user.uid), { themeId: themeId }, { merge: true });
  };

  // Fuerza actualización del UI local al cambiar el nombre de usuario desde el perfil
  const handleProfileNameUpdated = (newName) => {
    setUser(prev => ({...prev, displayName: newName}));
  };

  if (!authLoaded) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div style={{ padding: 'clamp(1rem, 4vw, 3rem)', paddingBottom: 'var(--bottom-nav-height)' }}>
      <header style={{ height: 'var(--header-height)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '1rem' }}>
        
        {/* Gear Menu */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', margin: '-8px' }}
          >
            <Settings size={20} className="text-secondary" style={{ transition: 'transform 0.2s', transform: isSettingsMenuOpen ? 'rotate(45deg)' : 'rotate(0)' }} />
          </div>

          {isSettingsMenuOpen && (
            <>
              {/* Overlay invisible para cerrar al hacer clic fuera */}
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 9 }} 
                onClick={() => setIsSettingsMenuOpen(false)}
              />
              <div className="sc-settings-dropdown animate-fade-in" style={{ position: 'absolute', top: '100%', left: '0', background: '#16162a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '4px', marginTop: '10px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: '180px' }}>
                <div className="sc-settings-option" onClick={() => { setIsSettingsMenuOpen(false); setIsProfileModalOpen(true); }}>Mi Perfil</div>
                <div className="sc-settings-option" onClick={() => { setIsSettingsMenuOpen(false); setIsThemeModalOpen(true); }}>Apariencia (Color)</div>
                <div className="sc-settings-option" onClick={() => { setIsSettingsMenuOpen(false); setIsPreferencesModalOpen(true); }}>Preferencias</div>
                <div className="sc-settings-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setIsReorderMode(!isReorderMode); }}>
                  <span>Reordenar</span>
                  <div className="toggle-switch" style={{ transform: 'scale(0.8)' }}>
                    <input type="checkbox" checked={isReorderMode} readOnly />
                    <span className="toggle-slider"></span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <h1 style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '1px' }}>VAULTIFY</h1>
        <div onClick={handleLogout} style={{ color: 'var(--accent-red)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogOut size={16} /> Salir
        </div>
      </header>

      <main style={{ paddingBottom: '2rem' }}>
        <AccountCard account={pinnedAccount} isPinned={true} privacyMode={privacyMode} />
        
        {/* SECCIÓN FUENTES DE AHORRO (SORTABLE) */}
        <div style={{ margin: '2rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Fuentes de ahorro</h2>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveAccountId(e.active.id)} onDragEnd={handleDragEndAccounts} onDragCancel={() => setActiveAccountId(null)}>
          <SortableContext items={sortedAccounts.map(a => a.id)} strategy={rectSortingStrategy}>
            <div className="cards-grid">
              {sortedAccounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tienes fuentes de ahorro. Toca el botón <b>+</b> abajo para empezar.
                </div>
              ) : (
                sortedAccounts.map(acc => (
                  <SortableAccountCard key={acc.id} id={acc.id} account={acc} isPinned={false} onSelect={setSelectedAccount} privacyMode={privacyMode} isReorderMode={isReorderMode} />
                ))
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeAccountId ? <div style={{ transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', borderRadius: '24px', cursor: 'grabbing' }}><AccountCard account={sortedAccounts.find(a => a.id === activeAccountId)} isPinned={false} privacyMode={privacyMode} /></div> : null}
          </DragOverlay>
        </DndContext>

        {/* SECCIÓN WATCHLIST (SORTABLE) */}
        {!hideWatchlist && (
          <>
            <div style={{ margin: '3rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Watchlist (24h)</h2>
              <button onClick={() => setIsWatchlistModalOpen(true)} style={{ background: 'transparent', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <Plus size={16} /> Añadir
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveWatchlistId(e.active.id)} onDragEnd={handleDragEndWatchlist} onDragCancel={() => setActiveWatchlistId(null)}>
              <SortableContext items={watchlist} strategy={rectSortingStrategy}>
                <div className="cards-grid">
                  {watchlist.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Tu Watchlist está vacía. Añade monedas para ver sus gráficas.
                    </div>
                  ) : (
                    watchlist.map(coinId => (
                      <SortableWatchlistCard key={coinId} id={coinId} onRemove={handleRemoveFromWatchlist} privacyMode={privacyMode} isReorderMode={isReorderMode} />
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeWatchlistId ? <div style={{ transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', borderRadius: '24px', cursor: 'grabbing' }}><WatchlistCard coinId={activeWatchlistId} privacyMode={privacyMode} /></div> : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </main>

      <AccountDetailsModal isOpen={!!selectedAccount} account={selectedAccount} transactions={transactions} onClose={() => setSelectedAccount(null)} onAddFunds={(acc) => setTxModalParams({ account: acc, type: 'income' })} onWithdrawFunds={(acc) => setTxModalParams({ account: acc, type: 'expense' })} onDelete={handleDeleteAccount} onUpdateName={handleUpdateAccountName} />
      <TransactionModal isOpen={!!txModalParams} account={txModalParams?.account} type={txModalParams?.type} onClose={() => setTxModalParams(null)} onSubmit={handleTransaction} />
      <CreateAccountModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateAccount} />
      <GlobalHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} transactions={transactions} accounts={accounts} />
      <AddWatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} currentWatchlist={watchlist} onAdd={handleAddToWatchlist} />
      
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUpdateName={handleProfileNameUpdated} />
      <PreferencesModal isOpen={isPreferencesModalOpen} onClose={() => setIsPreferencesModalOpen(false)} privacyMode={privacyMode} hideWatchlist={hideWatchlist} onTogglePrivacy={handleTogglePrivacy} onToggleWatchlist={handleToggleWatchlist} />
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} activeThemeId={activeThemeId} onSelectTheme={handleSelectTheme} />

      <nav style={{ position: 'fixed', bottom: 0, left: '0', width: '100%', height: 'var(--bottom-nav-height)', background: 'linear-gradient(to top, rgba(var(--accent-blue-rgb), 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(var(--accent-blue-rgb), 0.25)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 clamp(1rem, 5vw, 3rem)', zIndex: 10 }}>
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} style={{ background: 'none', color: 'var(--accent-blue)' }}><Home size={28} /></button>
        <button onClick={() => setIsCreateModalOpen(true)} style={{ background: 'var(--accent-blue)', color: 'white', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: 'translateY(-20px)', boxShadow: '0 10px 25px rgba(var(--accent-blue-rgb), 0.4)' }}><Plus size={32} /></button>
        <button onClick={() => setIsHistoryModalOpen(true)} style={{ background: 'none', color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}><History size={28} /></button>
      </nav>

      {showTutorial && <TutorialOverlay onComplete={handleCompleteTutorial} />}
    </div>
  );
}

export default App;
