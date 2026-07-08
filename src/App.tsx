import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const API = 'https://nnit-ai-electronics-doctor-backend-production.up.railway.app';

interface Customer {
  id: string; name: string; phone: string; email: string;
  device: string; model: string; notes: string; createdAt: string;
}
interface Ticket {
  id: string; customerId: string; customerName: string;
  device: string; model: string; fault: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  cost: string; techNotes: string; createdAt: string; updatedAt: string;
}
interface Invoice {
  id: string; ticketId: string; customerId: string; customerName: string;
  customerEmail: string; customerPhone: string;
  device: string; model: string; fault: string;
  laborCost: string; partsCost: string; totalCost: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  notes: string; createdAt: string; dueDate: string;
}
interface InventoryItem {
  id: string; name: string; category: string; sku: string;
  quantity: number; minStock: number; unitCost: string;
  supplier: string; notes: string; updatedAt: string;
}
interface Appointment {
  id: string; customerId: string; customerName: string;
  ticketId: string; date: string; time: string;
  duration: string; type: string; notes: string; status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar';

// â”€â”€ LOGIN SCREEN â”€â”€
function LoginScreen({ onLogin }: { onLogin: (token: string, user: string) => void }) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) { setError('Username and password required.'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'register') {
        await axios.post(`${API}/ai/auth/register`, { username, password, full_name: fullName, role: 'Admin' });
        setMode('login'); setError('Registered! Please log in.');
      } else {
        const res = await axios.post(`${API}/ai/auth/login`, { username, password });
        const token = res.data?.token ?? res.data?.access_token ?? res.data?.key ?? '';
        if (token) {
          localStorage.setItem('nnit_token', token);
          localStorage.setItem('nnit_user', username);
          onLogin(token, username);
        } else {
          // Backend login succeeded but no token â€” allow access anyway
          localStorage.setItem('nnit_user', username);
          onLogin('local', username);
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Login failed. Check credentials.');
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:'100vh',background:'#0b0f1a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:380,background:'#111827',border:'1px solid #1e2d40',borderRadius:14,padding:36,display:'flex',flexDirection:'column',gap:18}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{width:42,height:42,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>ðŸ”¬</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9'}}>NNIT AI Electronics Doctor Pro</div>
            <div style={{fontSize:11,color:'#475569'}}>Network Nice IT (NNIT)</div>
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:'#f1f5f9'}}>{mode==='login'?'Sign In':'Create Account'}</div>
        {mode==='register'&&(
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'.8px'}}>Full Name</label>
            <input style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#e2e8f0',outline:'none',width:'100%'}} placeholder='Your name' value={fullName} onChange={e=>setFullName(e.target.value)}/>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'.8px'}}>Username</label>
          <input style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#e2e8f0',outline:'none',width:'100%'}} placeholder='Username' value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'.8px'}}>Password</label>
          <input style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#e2e8f0',outline:'none',width:'100%'}} type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
        </div>
        {error&&<div style={{background: error.includes('Registered') ?'#14532d':'#450a0a',color:error.includes('Registered')?'#4ade80':'#f87171',borderRadius:6,padding:'8px 12px',fontSize:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',color:'#fff',padding:'10px 20px',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}>
          {loading?'Please wait...':(mode==='login'?'Sign In':'Create Account')}
        </button>
        <div style={{textAlign:'center',fontSize:12,color:'#475569'}}>
          {mode==='login'?<>No account? <span style={{color:'#60a5fa',cursor:'pointer'}} onClick={()=>{setMode('register');setError('');}}>Register</span></>
            :<>Have an account? <span style={{color:'#60a5fa',cursor:'pointer'}} onClick={()=>{setMode('login');setError('');}}>Sign In</span></>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // â”€â”€ AUTH â”€â”€
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('nnit_token'));
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('nnit_user') ?? '');

  function handleLogin(token: string, user: string) {
    setAuthed(true); setAuthUser(user);
  }
  function handleLogout() {
    localStorage.removeItem('nnit_token');
    localStorage.removeItem('nnit_user');
    setAuthed(false); setAuthUser('');
  }

  if (!authed) return <LoginScreen onLogin={handleLogin}/>;

  return <MainApp authUser={authUser} onLogout={handleLogout}/>;
}

function MainApp({ authUser, onLogout }: { authUser: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');

  // Dashboard state
  const [home, setHome] = useState<any>(null);
  const [scan, setScan] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [storage, setStorage] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [phone, setPhone] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<{id:string;msg:string;type:'success'|'warning'|'error'|'info'}[]>([]);
  function notify(msg: string, type: 'success'|'warning'|'error'|'info' = 'success') {
    const id = Date.now().toString();
    setNotifications(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 3500);
  }

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem('nnit_customers') ?? '[]'); } catch { return []; }
  });
  const [customerForm, setCustomerForm] = useState({ name:'', phone:'', email:'', device:'', model:'', notes:'' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Ticket state
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try { return JSON.parse(localStorage.getItem('nnit_tickets') ?? '[]'); } catch { return []; }
  });
  const blankTicket: Omit<Ticket,'id'|'createdAt'|'updatedAt'> = { customerId:'', customerName:'', device:'', model:'', fault:'', status:'Open', priority:'Medium', cost:'', techNotes:'' };
  const [ticketForm, setTicketForm] = useState(blankTicket);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState('All');
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);

  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try { return JSON.parse(localStorage.getItem('nnit_invoices') ?? '[]'); } catch { return []; }
  });
  const blankInvoice: Omit<Invoice,'id'|'createdAt'> = { ticketId:'', customerId:'', customerName:'', customerEmail:'', customerPhone:'', device:'', model:'', fault:'', laborCost:'', partsCost:'', totalCost:'', status:'Draft', notes:'', dueDate:'' };
  const [invoiceForm, setInvoiceForm] = useState(blankInvoice);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('nnit_inventory') ?? '[]'); } catch { return []; }
  });
  const blankItem = { name:'', category:'', sku:'', quantity:0, minStock:5, unitCost:'', supplier:'', notes:'' };
  const [itemForm, setItemForm] = useState(blankItem);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  // â”€â”€ FEATURE 1: Backend sync state â”€â”€
  const [backendOnline, setBackendOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle'|'syncing'|'synced'|'error'>('idle');

  // â”€â”€ FEATURE 2: WhatsApp state â”€â”€
  const [waPhone] = useState(() => localStorage.getItem('nnit_wa_phone') ?? '');
  const [waApiKey, setWaApiKey] = useState(() => localStorage.getItem('nnit_wa_key') ?? '');
  const [waInstanceId, setWaInstanceId] = useState(() => localStorage.getItem('nnit_wa_instance') ?? '');
  const [showWaConfig, setShowWaConfig] = useState(false);

  // â”€â”€ FEATURE 3: Barcode scanner state â”€â”€
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanTarget, setScanTarget] = useState<'ticket'|'inventory'>('ticket');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);


  // â”€â”€ FEATURE 4: Calendar/Appointments state â”€â”€
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try { return JSON.parse(localStorage.getItem('nnit_appointments') ?? '[]'); } catch { return []; }
  });
  const blankAppt: Omit<Appointment,'id'|'createdAt'> = { customerId:'', customerName:'', ticketId:'', date:'', time:'', duration:'60', type:'Repair Drop-off', notes:'', status:'Scheduled' };
  const [apptForm, setApptForm] = useState(blankAppt);
  const [editingApptId, setEditingApptId] = useState<string|null>(null);
  const [calView, setCalView] = useState<'month'|'list'>('list');
  const [calMonth, setCalMonth] = useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });

  // Save helpers
  function saveCustomers(list: Customer[]) { setCustomers(list); localStorage.setItem('nnit_customers', JSON.stringify(list)); }
  function saveTickets(list: Ticket[]) { setTickets(list); localStorage.setItem('nnit_tickets', JSON.stringify(list)); }
  function saveInvoices(list: Invoice[]) { setInvoices(list); localStorage.setItem('nnit_invoices', JSON.stringify(list)); }
  function saveInventory(list: InventoryItem[]) { setInventory(list); localStorage.setItem('nnit_inventory', JSON.stringify(list)); }
  function saveAppointments(list: Appointment[]) { setAppointments(list); localStorage.setItem('nnit_appointments', JSON.stringify(list)); }

  // â”€â”€ FEATURE 1: Backend sync â”€â”€
  async function syncToBackend(type: 'customers'|'tickets', data: any[]) {
    setSyncStatus('syncing');
    try {
      for (const item of data) {
        await axios.post(`${API}/ai/${type}`, item).catch(() => {});
      }
      setSyncStatus('synced');
      notify(`Synced ${type} to backend.`, 'success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
      notify('Backend sync failed â€” data saved locally.', 'warning');
    }
  }

  async function loadBackendCustomers() {
    try {
      const res = await axios.get(`${API}/ai/customers`);
      if (res.data?.length > 0) {
        // Read fresh from localStorage to avoid stale closure
        const local: Customer[] = (() => { try { return JSON.parse(localStorage.getItem('nnit_customers') ?? '[]'); } catch { return []; } })();
        const seenIds = new Set(local.map(c => c.id));
        const seenKeys = new Set(local.map(c => `${c.name}|${c.phone}`));
        const toAdd: Customer[] = [];
        res.data.forEach((bc: any, idx: number) => {
          const bcId = String(bc.id ?? '');
          const bcKey = `${bc.name ?? ''}|${bc.phone ?? ''}`;
          if (bcId && seenIds.has(bcId)) return;
          if (seenKeys.has(bcKey)) return;
          const newId = bcId || `bc-${Date.now()}-${idx}`;
          seenIds.add(newId);
          seenKeys.add(bcKey);
          toAdd.push({ id: newId, name: bc.name ?? '', phone: bc.phone ?? '', email: bc.email ?? '', device: bc.device ?? '', model: bc.model ?? '', notes: bc.notes ?? '', createdAt: bc.created_at ?? new Date().toLocaleString() });
        });
        if (toAdd.length > 0) {
          saveCustomers([...local, ...toAdd]);
          notify(`Synced ${toAdd.length} customer(s) from backend.`, 'info');
        }
      }
    } catch { /* backend may not have these yet */ }
  }

  async function loadBackendTickets() {
    try {
      const res = await axios.get(`${API}/ai/tickets`);
      if (res.data?.length > 0) {
        const local: Ticket[] = (() => { try { return JSON.parse(localStorage.getItem('nnit_tickets') ?? '[]'); } catch { return []; } })();
        const seenIds = new Set(local.map(t => t.id));
        const seenKeys = new Set(local.map(t => `${t.customerName}|${t.fault}`));
        const toAdd: Ticket[] = [];
        res.data.forEach((bt: any, idx: number) => {
          const btId = String(bt.id ?? '');
          const btKey = `${bt.customer_name ?? ''}|${bt.fault ?? ''}`;
          if (btId && seenIds.has(btId)) return;
          if (seenKeys.has(btKey)) return;
          const newId = btId || `bt-${Date.now()}-${idx}`;
          seenIds.add(newId);
          seenKeys.add(btKey);
          toAdd.push({ id: newId, customerId: bt.customer_id ?? '', customerName: bt.customer_name ?? '', device: bt.device ?? '', model: bt.model ?? '', fault: bt.fault ?? '', status: (bt.status ?? 'Open') as Ticket['status'], priority: (bt.priority ?? 'Medium') as Ticket['priority'], cost: bt.cost ?? '', techNotes: bt.tech_notes ?? '', createdAt: bt.created_at ?? new Date().toLocaleString(), updatedAt: bt.updated_at ?? new Date().toLocaleString() });
        });
        if (toAdd.length > 0) {
          saveTickets([...local, ...toAdd]);
          notify(`Synced ${toAdd.length} ticket(s) from backend.`, 'info');
        }
      }
    } catch { /* backend may not have these yet */ }
  }

  // â”€â”€ FEATURE 2: WhatsApp notifications â”€â”€
  function saveWaConfig() {
    localStorage.setItem('nnit_wa_phone', waPhone);
    localStorage.setItem('nnit_wa_key', waApiKey);
    localStorage.setItem('nnit_wa_instance', waInstanceId);
    setShowWaConfig(false);
    notify('WhatsApp config saved.', 'success');
  }

  async function sendWhatsApp(toPhone: string, message: string) {
    if (!waApiKey || !waInstanceId) {
      notify('Configure WhatsApp first (âš™ button top-right).', 'warning');
      return;
    }
    const phone = toPhone.replace(/\D/g, '');
    if (!phone) { notify('Customer has no phone number.', 'error'); return; }
    try {
      // Using UltraMsg API (widely used, simple REST)
      await axios.post(`https://api.ultramsg.com/${waInstanceId}/messages/chat`, {
        token: waApiKey,
        to: `+${phone}`,
        body: message
      });
      notify('WhatsApp message sent! ðŸ“±', 'success');
    } catch {
      notify('WhatsApp send failed. Check your API config.', 'error');
    }
  }

  function sendTicketStatusWA(t: Ticket) {
    const c = customers.find(x => x.id === t.customerId);
    const phone = c?.phone ?? '';
    const msg = `Hello ${t.customerName || 'Customer'},\n\nYour repair update from NNIT AI Electronics Doctor:\n\nðŸ“± Device: ${t.device} ${t.model}\nðŸ”§ Fault: ${t.fault}\nðŸ“‹ Status: *${t.status}*\n${t.cost ? `ðŸ’° Est. Cost: ${t.cost}\n` : ''}${t.techNotes ? `ðŸ“ Notes: ${t.techNotes}\n` : ''}\nThank you for choosing Network Nice IT (NNIT)!\nnetworkniceit@gmail.com`;
    sendWhatsApp(phone, msg);
  }

  function sendInvoiceWA(inv: Invoice) {
    const msg = `Hello ${inv.customerName},\n\nYour invoice from NNIT AI Electronics Doctor:\n\nðŸ§¾ Invoice: *${inv.id}*\nðŸ“± Device: ${inv.device}\nðŸ”§ Service: ${inv.fault}\nðŸ’° Total: *${inv.totalCost}*\nðŸ“… Due: ${inv.dueDate || 'On receipt'}\n\nPlease contact us to arrange payment.\nnetworkniceit@gmail.com`;
    sendWhatsApp(inv.customerPhone, msg);
  }

  // â”€â”€ FEATURE 3: Barcode/QR scanner â”€â”€
  async function startScanner() {
    setScannerActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
    } catch {
      notify('Camera not available. Use manual barcode entry below.', 'warning');
    }
  }

  function stopScanner() {
    setScannerActive(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function applyBarcode(code: string) {
    if (!code.trim()) return;
    // Try to decode brand/model from common barcode formats
    const parts = code.split(/[-_|]/);
    if (scanTarget === 'ticket') {
      setTicketForm(f => ({
        ...f,
        device: parts[0] ?? f.device,
        model: parts.slice(1).join(' ') || f.model || code
      }));
      setTab('tickets');
    } else {
      setItemForm(f => ({ ...f, sku: code, name: f.name || code }));
      setTab('inventory');
    }
    stopScanner();
    setScannedCode('');
    notify(`Barcode applied: ${code}`, 'success');
  }

  // Keyboard barcode scanner listener (USB HID scanners type fast)
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!scannerActive) return;
      if (e.key === 'Enter') {
        applyBarcode(barcodeBuffer.current);
        barcodeBuffer.current = '';
        return;
      }
      barcodeBuffer.current += e.key;
      if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
      barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ''; }, 300);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scannerActive, scanTarget]);

  // â”€â”€ FEATURE 4: Calendar/Appointments CRUD â”€â”€
  function submitAppt() {
    if (!apptForm.date || !apptForm.time) { notify('Date and time are required.', 'error'); return; }
    const now = new Date().toLocaleString();
    if (editingApptId) {
      saveAppointments(appointments.map(a => a.id === editingApptId ? { ...a, ...apptForm } : a));
      setEditingApptId(null); notify('Appointment updated.');
    } else {
      saveAppointments([{ ...apptForm, id: Date.now().toString(), createdAt: now }, ...appointments]);
      notify('Appointment booked.');
    }
    setApptForm(blankAppt);
  }
  function editAppt(a: Appointment) {
    setApptForm({ customerId:a.customerId, customerName:a.customerName, ticketId:a.ticketId, date:a.date, time:a.time, duration:a.duration, type:a.type, notes:a.notes, status:a.status });
    setEditingApptId(a.id);
  }
  function deleteAppt(id: string) {
    if (!confirm('Delete this appointment?')) return;
    saveAppointments(appointments.filter(a => a.id !== id)); notify('Appointment deleted.', 'warning');
  }
  function updateApptStatus(id: string, status: Appointment['status']) {
    saveAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    notify(`Appointment ${status}.`);
  }
  function sendApptWA(a: Appointment) {
    const c = customers.find(x => x.id === a.customerId);
    const msg = `Hello ${a.customerName},\n\nYour repair appointment at NNIT AI Electronics Doctor:\n\nðŸ“… Date: *${a.date}*\nðŸ• Time: *${a.time}*\nâ± Duration: ~${a.duration} min\nðŸ”§ Type: ${a.type}\n${a.notes ? `ðŸ“ Notes: ${a.notes}` : ''}\n\nSee you soon!\nnetworkniceit@gmail.com`;
    sendWhatsApp(c?.phone ?? '', msg);
  }

  // Calendar month grid
  const calDays = (() => {
    const [y, m] = calMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  })();

  function apptOnDay(day: number) {
    const [y, m] = calMonth.split('-').map(Number);
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return appointments.filter(a => a.date === dateStr);
  }

  // â”€â”€ FEATURE 5: Export â”€â”€
  function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) { notify('Nothing to export.', 'warning'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filename}`, 'success');
  }

  function exportToXLSX(data: any[], sheetName: string, filename: string) {
    if (data.length === 0) { notify('Nothing to export.', 'warning'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    notify(`Exported ${filename}`, 'success');
  }

  function exportAllXLSX() {
    if (customers.length === 0 && tickets.length === 0 && invoices.length === 0) { notify('Nothing to export.', 'warning'); return; }
    const wb = XLSX.utils.book_new();
    if (customers.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers), 'Customers');
    if (tickets.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tickets), 'Tickets');
    if (invoices.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoices), 'Invoices');
    if (inventory.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventory), 'Inventory');
    if (appointments.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appointments), 'Appointments');
    XLSX.writeFile(wb, 'NNIT_Export_All.xlsx');
    notify('Full export downloaded!', 'success');
  }

  // Customer CRUD
  function submitCustomer() {
    if (!customerForm.name.trim()) { notify('Name is required.', 'error'); return; }
    if (editingCustomerId) {
      const updated = customers.map(c => c.id === editingCustomerId ? { ...c, ...customerForm } : c);
      saveCustomers(updated);
      if (backendOnline) syncToBackend('customers', updated);
      setEditingCustomerId(null); notify('Customer updated.');
    } else {
      const newC: Customer = { ...customerForm, id: Date.now().toString(), createdAt: new Date().toLocaleString() };
      const updated = [newC, ...customers];
      saveCustomers(updated);
      if (backendOnline) axios.post(`${API}/ai/customers`, newC).catch(() => {});
      notify('Customer added.');
    }
    setCustomerForm({ name:'', phone:'', email:'', device:'', model:'', notes:'' });
  }
  function editCustomer(c: Customer) {
    setCustomerForm({ name:c.name, phone:c.phone, email:c.email, device:c.device, model:c.model, notes:c.notes });
    setEditingCustomerId(c.id);
  }
  function deleteCustomer(id: string) {
    if (!confirm('Delete this customer?')) return;
    saveCustomers(customers.filter(c => c.id !== id)); notify('Customer deleted.', 'warning');
  }

  // Ticket CRUD
  function submitTicket() {
    if (!ticketForm.fault.trim()) { notify('Fault description is required.', 'error'); return; }
    const now = new Date().toLocaleString();
    if (editingTicketId) {
      const updated = tickets.map(t => t.id === editingTicketId ? { ...t, ...ticketForm, updatedAt: now } : t);
      saveTickets(updated);
      if (backendOnline) syncToBackend('tickets', updated);
      setEditingTicketId(null); notify('Ticket updated.');
    } else {
      const newT: Ticket = { ...ticketForm, id: Date.now().toString(), createdAt: now, updatedAt: now };
      const updated = [newT, ...tickets];
      saveTickets(updated);
      if (backendOnline) axios.post(`${API}/ai/tickets`, newT).catch(() => {});
      notify('Ticket created.');
    }
    setTicketForm(blankTicket);
  }
  function editTicket(t: Ticket) {
    setTicketForm({ customerId:t.customerId, customerName:t.customerName, device:t.device, model:t.model, fault:t.fault, status:t.status, priority:t.priority, cost:t.cost, techNotes:t.techNotes });
    setEditingTicketId(t.id);
  }
  function deleteTicket(id: string) {
    if (!confirm('Delete this ticket?')) return;
    saveTickets(tickets.filter(t => t.id !== id)); notify('Ticket deleted.', 'warning');
  }
  function updateTicketStatus(id: string, status: Ticket['status']) {
    const now = new Date().toLocaleString();
    const updated = tickets.map(t => t.id === id ? { ...t, status, updatedAt: now } : t);
    saveTickets(updated);
    notify(`Ticket marked ${status}.`);
    // Auto-send WhatsApp if configured
    const t = updated.find(t => t.id === id);
    if (t && waApiKey && waInstanceId) sendTicketStatusWA(t);
  }

  // Invoice CRUD
  function submitInvoice() {
    if (!invoiceForm.customerName.trim()) { notify('Customer name is required.', 'error'); return; }
    const labor = parseFloat(invoiceForm.laborCost) || 0;
    const parts = parseFloat(invoiceForm.partsCost) || 0;
    const total = (labor + parts).toFixed(2);
    const now = new Date().toLocaleString();
    if (editingInvoiceId) {
      saveInvoices(invoices.map(i => i.id === editingInvoiceId ? { ...i, ...invoiceForm, totalCost: 'â‚¬'+total } : i));
      setEditingInvoiceId(null); notify('Invoice updated.');
    } else {
      saveInvoices([{ ...invoiceForm, id: 'INV-'+Date.now().toString().slice(-6), totalCost:'â‚¬'+total, createdAt: now }, ...invoices]);
      notify('Invoice created.');
    }
    setInvoiceForm(blankInvoice);
  }
  function editInvoice(inv: Invoice) {
    setInvoiceForm({ ticketId:inv.ticketId, customerId:inv.customerId, customerName:inv.customerName, customerEmail:inv.customerEmail, customerPhone:inv.customerPhone, device:inv.device, model:inv.model, fault:inv.fault, laborCost:inv.laborCost, partsCost:inv.partsCost, totalCost:inv.totalCost, status:inv.status, notes:inv.notes, dueDate:inv.dueDate });
    setEditingInvoiceId(inv.id);
  }
  function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return;
    saveInvoices(invoices.filter(i => i.id !== id)); notify('Invoice deleted.', 'warning');
  }
  function updateInvoiceStatus(id: string, status: Invoice['status']) {
    saveInvoices(invoices.map(i => i.id === id ? { ...i, status } : i));
    notify(`Invoice marked ${status}.`);
  }
  function downloadInvoicePDF(inv: Invoice) {
    const doc = new jsPDF();
    const lh = 8; let y = 20;
    doc.setFillColor(17,24,39); doc.rect(0,0,210,35,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(18);
    doc.text('NNIT AI Electronics Doctor Pro', 20, 15);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Network Nice IT (NNIT) â€” Invoice', 20, 23);
    doc.text('networkniceit@gmail.com', 20, 30);
    y = 50; doc.setTextColor(0,0,0);
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('INVOICE', 150, y); y += 6;
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Invoice #: '+inv.id, 150, y); y += 6;
    doc.text('Date: '+inv.createdAt, 150, y); y += 6;
    if(inv.dueDate) { doc.text('Due: '+inv.dueDate, 150, y); }
    y = 50;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('Bill To:', 20, y); y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(inv.customerName, 20, y); y += 6;
    if(inv.customerEmail) { doc.text(inv.customerEmail, 20, y); y += 6; }
    if(inv.customerPhone) { doc.text(inv.customerPhone, 20, y); y += 6; }
    y = 100;
    doc.setFillColor(240,240,240); doc.rect(15,y-5,180,10,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('Description', 20, y); doc.text('Amount', 170, y); y += lh+4;
    doc.setFont('helvetica','normal');
    doc.text('Device: '+inv.device+' '+inv.model, 20, y); y += lh;
    doc.text('Fault: '+inv.fault, 20, y); y += lh+4;
    if(inv.laborCost) { doc.text('Labour Cost', 20, y); doc.text('â‚¬'+inv.laborCost, 170, y); y += lh; }
    if(inv.partsCost) { doc.text('Parts Cost', 20, y); doc.text('â‚¬'+inv.partsCost, 170, y); y += lh; }
    y += 4; doc.setFillColor(17,24,39); doc.rect(130,y-5,65,12,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text('TOTAL: '+inv.totalCost, 135, y+3);
    if(inv.notes) { y += 20; doc.setTextColor(0,0,0); doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.text('Notes: '+inv.notes, 20, y); }
    doc.setFillColor(17,24,39); doc.rect(0,280,210,20,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Generated by NNIT AI Electronics Doctor Pro â€” Network Nice IT (NNIT)', 20, 292);
    doc.save('Invoice_'+inv.id+'.pdf');
    notify('Invoice PDF downloaded.');
  }

  // Inventory CRUD
  function submitItem() {
    if (!itemForm.name.trim()) { notify('Item name is required.', 'error'); return; }
    const now = new Date().toLocaleString();
    if (editingItemId) {
      saveInventory(inventory.map(i => i.id === editingItemId ? { ...i, ...itemForm, updatedAt: now } : i));
      setEditingItemId(null); notify('Item updated.');
    } else {
      saveInventory([{ ...itemForm, id: Date.now().toString(), updatedAt: now }, ...inventory]);
      notify('Item added to inventory.');
    }
    setItemForm(blankItem);
  }
  function editItem(item: InventoryItem) {
    setItemForm({ name:item.name, category:item.category, sku:item.sku, quantity:item.quantity, minStock:item.minStock, unitCost:item.unitCost, supplier:item.supplier, notes:item.notes });
    setEditingItemId(item.id);
  }
  function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    saveInventory(inventory.filter(i => i.id !== id)); notify('Item removed.', 'warning');
  }
  function adjustStock(id: string, delta: number) {
    const now = new Date().toLocaleString();
    const updated = inventory.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta), updatedAt: now } : i);
    saveInventory(updated);
    const item = updated.find(i => i.id === id);
    if (item && item.quantity <= item.minStock) notify(`âš  Low stock: ${item.name} (${item.quantity} left)`, 'warning');
  }

  function handlePrintTicket(t: Ticket) {
    setPrintTicket(t);
    setTimeout(() => { window.print(); setPrintTicket(null); }, 300);
  }

  // Filtered lists
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.device.toLowerCase().includes(customerSearch.toLowerCase())
  );
  const filteredTickets = tickets.filter(t => {
    const s = t.customerName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.fault.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.device.toLowerCase().includes(ticketSearch.toLowerCase());
    return s && (ticketFilter === 'All' || t.status === ticketFilter);
  });
  const filteredInvoices = invoices.filter(i => invoiceFilter === 'All' || i.status === invoiceFilter);
  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    i.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    i.sku.toLowerCase().includes(inventorySearch.toLowerCase())
  );
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);

  // Analytics
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (parseFloat(i.totalCost.replace('â‚¬','')) || 0), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Sent' || i.status === 'Draft').reduce((sum, i) => sum + (parseFloat(i.totalCost.replace('â‚¬','')) || 0), 0);
  const faultCounts: Record<string,number> = {};
  tickets.forEach(t => { const k = t.device||'Unknown'; faultCounts[k] = (faultCounts[k]||0)+1; });
  const topDevices = Object.entries(faultCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const ticketsByStatus = ['Open','In Progress','Completed','Cancelled'].map(s => ({ status: s, count: tickets.filter(t => t.status === s).length }));
  const inventoryValue = inventory.reduce((s,i) => s + (parseFloat(i.unitCost)||0)*i.quantity, 0);

  // Dashboard data
  async function loadData() {
    setLoading(true);
    try {
      const [h,sc,dx,st,im,ph,rp] = await Promise.all([
        axios.get(`${API}/`), axios.get(`${API}/ai/device-scan`),
        axios.get(`${API}/ai/ai-diagnosis`), axios.get(`${API}/ai/storage`),
        axios.get(`${API}/ai/images`), axios.get(`${API}/ai/android-phone`),
        axios.get(`${API}/ai/report-history`),
      ]);
      setHome(h.data); setScan(sc.data); setDiagnosis(dx.data);
      setStorage(st.data); setImages(im.data); setPhone(ph.data); setReports(rp.data);
      setBackendOnline(true);
      // Sync from backend on load
      loadBackendCustomers();
      loadBackendTickets();
    } catch(err) { setBackendOnline(false); console.error(err); }
    finally { setLoading(false); }
  }
  async function uploadFile() {
    if (!file) { notify('Choose a file first','error'); return; }
    const form = new FormData(); form.append('file', file);
    try {
      const res = await axios.post(`${API}/ai/upload-file`, form, { headers: {'Content-Type':'multipart/form-data'} });
      setUploadResult(res.data); loadData(); notify('File uploaded.');
    } catch { notify('Upload failed','error'); }
  }
  async function analyzeFile(filename: string) {
    try { const res = await axios.get(`${API}/ai/smart-analyze/${encodeURIComponent(filename)}`); setAnalysis(res.data); }
    catch { notify('Analysis failed','error'); }
  }
  async function generateReport() {
    if (!analysis?.filename) { notify('Analyze a file first.','error'); return; }
    try {
      const res = await axios.get(`${API}/ai/repair-report/${encodeURIComponent(analysis.filename)}`);
      setAnalysis({ ...analysis, report: res.data }); notify('Report generated.');
    } catch { notify('Failed to generate report.','error'); }
  }
  async function viewReport(reportName: string) {
    try { const res = await axios.get(`${API}/ai/view-report/${encodeURIComponent(reportName)}`); setAnalysis({ report: res.data }); }
    catch { notify('Failed to load report.','error'); }
  }
  function copyResult() {
    if (!analysis) return;
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    notify('Copied to clipboard.');
  }
  function downloadPDF() {
    const report = analysis?.report;
    if (!report) { notify('Generate a report first.','error'); return; }
    const doc = new jsPDF();
    const lh = 8; let y = 20;
    const line = (label: string, value: any) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(label+':', 20, y);
      doc.setFont('helvetica','normal'); doc.text(String(value ?? 'â€”'), 75, y); y += lh;
    };
    doc.setFillColor(17,24,39); doc.rect(0,0,210,30,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('NNIT AI Electronics Doctor Pro', 20, 15);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Network Nice IT (NNIT) â€” Repair Report', 20, 23);
    y = 45; doc.setTextColor(0,0,0);
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Report Details', 20, y); y += lh+2; doc.setFontSize(10);
    line('Report ID', report.report_id); line('Date', report.date); line('Technician', report.technician); line('Status', report.status);
    y += 4; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Device & Diagnosis', 20, y); y += lh+2; doc.setFontSize(10);
    line('Device', report.device); line('Filename', report.filename); line('Fault', report.diagnosis?.fault);
    line('Confidence', (report.diagnosis?.confidence ?? 0)+'%'); line('Severity', report.diagnosis?.severity);
    y += 4; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Repair Estimate', 20, y); y += lh+2; doc.setFontSize(10);
    line('Estimated Cost', report.estimated_cost); line('Repair Time', report.estimated_repair_time);
    doc.setFillColor(17,24,39); doc.rect(0,280,210,20,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8);
    doc.text('Generated by NNIT AI Electronics Doctor Pro â€” Network Nice IT (NNIT)', 20, 290);
    doc.save('NNIT_Report_'+report.report_id+'.pdf');
    notify('Report PDF downloaded.');
  }

  useEffect(() => { loadData(); }, []);

  const phoneOk  = phone?.connection?.includes('device');
  const cpuUsage = diagnosis?.analysis?.cpu_usage;
  const ramUsage = diagnosis?.analysis?.ram_usage;
  const faults   = (diagnosis?.analysis?.faults ?? []).filter((f: string) =>
    !f.toLowerCase().includes('no major') && !f.toLowerCase().includes('no fault') &&
    !f.toLowerCase().includes('healthy') && !f.toLowerCase().includes('appears healthy')
  );
  const phoneTemp = phone?.temperature
    ? (typeof phone.temperature === 'number' && phone.temperature > 100
        ? (phone.temperature / 10).toFixed(1)+'Â°C'
        : phone.temperature+'Â°C')
    : 'Unknown';

  const statusColor: Record<string,string> = { 'Open':'#60a5fa','In Progress':'#fbbf24','Completed':'#4ade80','Cancelled':'#f87171' };
  const statusBg:    Record<string,string> = { 'Open':'#1e3a5f','In Progress':'#422006','Completed':'#14532d','Cancelled':'#450a0a' };
  const priorityColor: Record<string,string> = { 'Low':'#4ade80','Medium':'#fbbf24','High':'#f87171' };
  const invStatusColor: Record<string,string> = { 'Draft':'#64748b','Sent':'#60a5fa','Paid':'#4ade80','Overdue':'#f87171' };
  const invStatusBg:    Record<string,string> = { 'Draft':'#1e293b','Sent':'#1e3a5f','Paid':'#14532d','Overdue':'#450a0a' };
  const apptStatusColor: Record<string,string> = { 'Scheduled':'#60a5fa','Confirmed':'#4ade80','Completed':'#c084fc','Cancelled':'#f87171' };
  const apptStatusBg:    Record<string,string> = { 'Scheduled':'#1e3a5f','Confirmed':'#14532d','Completed':'#2e1065','Cancelled':'#450a0a' };

  const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const activeInvoices = invoices.filter(i => i.status === 'Sent').length;
  const todayAppts = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length;

  return (
    <>
      <style>{`
        @media print {
          body > *:not(.print-ticket) { display: none !important; }
          .print-ticket { display: block !important; }
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; background: #0b0f1a; color: #e2e8f0; min-height: 100vh; }
        .notif-stack { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .notif { padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: 220px; box-shadow: 0 4px 20px rgba(0,0,0,.4); animation: slideIn .2s ease; }
        .notif-success { background: #14532d; color: #4ade80; border-left: 3px solid #4ade80; }
        .notif-warning { background: #422006; color: #fbbf24; border-left: 3px solid #fbbf24; }
        .notif-error   { background: #450a0a; color: #f87171; border-left: 3px solid #f87171; }
        .notif-info    { background: #1e3a5f; color: #60a5fa; border-left: 3px solid #60a5fa; }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 28px; background:#111827; border-bottom:1px solid #1e2d40; position:sticky; top:0; z-index:100; }
        .topbar-brand { display:flex; align-items:center; gap:10px; }
        .topbar-logo { width:32px; height:32px; background:linear-gradient(135deg,#3b82f6,#8b5cf6); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .topbar-name { font-size:15px; font-weight:700; color:#f1f5f9; letter-spacing:-0.3px; }
        .topbar-sub  { font-size:11px; color:#64748b; margin-top:1px; }
        .topbar-right { display:flex; align-items:center; gap:8px; }
        .topbar-status { display:flex; align-items:center; gap:6px; font-size:12px; color:#22c55e; }
        .topbar-status::before { content:''; width:7px; height:7px; background:#22c55e; border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .btn-refresh { background:#1e293b; border:1px solid #334155; color:#94a3b8; padding:7px 14px; border-radius:7px; font-size:12px; cursor:pointer; transition:all .15s; }
        .btn-refresh:hover { background:#273549; color:#e2e8f0; }
        .backend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .sync-pill { display:flex; align-items:center; gap:5px; background:#1e293b; border:1px solid #334155; border-radius:20px; padding:4px 10px; font-size:11px; color:#64748b; }
        .tabs { display:flex; gap:2px; background:#0b0f1a; padding:12px 28px 0; border-bottom:1px solid #1e2d40; overflow-x:auto; }
        .tab { padding:8px 16px; font-size:12px; font-weight:600; border:none; cursor:pointer; border-radius:8px 8px 0 0; background:transparent; color:#475569; transition:all .15s; display:flex; align-items:center; gap:5px; white-space:nowrap; }
        .tab:hover { color:#94a3b8; background:#111827; }
        .tab.active { background:#111827; color:#f1f5f9; border-top:2px solid #3b82f6; }
        .dashboard { display:grid; grid-template-columns:280px 1fr; gap:0; min-height:calc(100vh - 105px); }
        .sidebar { background:#111827; border-right:1px solid #1e2d40; padding:20px 16px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; }
        .sidebar-section { display:flex; flex-direction:column; gap:4px; }
        .sidebar-label { font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#475569; padding:4px 8px; margin-bottom:2px; }
        .info-row { display:flex; justify-content:space-between; align-items:flex-start; padding:7px 8px; border-radius:6px; gap:8px; }
        .info-row:hover { background:#1a2332; }
        .info-key { font-size:11px; color:#64748b; white-space:nowrap; flex-shrink:0; }
        .info-val { font-size:11px; color:#cbd5e1; text-align:right; word-break:break-all; max-width:160px; }
        .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }
        .badge-green  { background:#14532d; color:#4ade80; }
        .badge-red    { background:#450a0a; color:#f87171; }
        .badge-blue   { background:#1e3a5f; color:#60a5fa; }
        .badge-yellow { background:#422006; color:#fbbf24; }
        .badge-gray   { background:#1e293b; color:#64748b; }
        .badge-purple { background:#2e1065; color:#c084fc; }
        .divider { height:1px; background:#1e2d40; margin:4px 0; }
        .main { padding:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; }
        .stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .stat-card { background:#111827; border:1px solid #1e2d40; border-radius:10px; padding:16px; }
        .stat-label { font-size:11px; color:#64748b; margin-bottom:6px; }
        .stat-value { font-size:22px; font-weight:700; color:#f1f5f9; }
        .stat-sub   { font-size:11px; color:#475569; margin-top:3px; }
        .panels { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .panel { background:#111827; border:1px solid #1e2d40; border-radius:10px; overflow:hidden; }
        .panel-full { grid-column:1/-1; }
        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid #1e2d40; }
        .panel-title { font-size:13px; font-weight:600; color:#f1f5f9; display:flex; align-items:center; gap:8px; }
        .panel-body { padding:16px; }
        .data-table { width:100%; border-collapse:collapse; font-size:12px; }
        .data-table th { text-align:left; color:#475569; font-weight:600; padding:6px 10px; border-bottom:1px solid #1e2d40; font-size:11px; letter-spacing:.5px; }
        .data-table td { padding:9px 10px; color:#cbd5e1; border-bottom:1px solid #0f1724; }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { background:#131f30; }
        .file-item { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-radius:7px; margin-bottom:4px; background:#0d1525; border:1px solid #1a2740; gap:8px; }
        .file-name { font-size:12px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .btn-sm { background:#1e3a5f; border:none; color:#60a5fa; padding:5px 12px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background .15s; }
        .btn-sm:hover { background:#1d4ed8; color:#fff; }
        .btn-sm.green  { background:#14532d; color:#4ade80; } .btn-sm.green:hover  { background:#166534; }
        .btn-sm.purple { background:#2e1065; color:#c084fc; } .btn-sm.purple:hover { background:#3b0764; }
        .btn-sm.red    { background:#450a0a; color:#f87171; } .btn-sm.red:hover    { background:#7f1d1d; }
        .btn-sm.yellow { background:#422006; color:#fbbf24; } .btn-sm.yellow:hover { background:#78350f; }
        .btn-sm.gray   { background:#1e293b; color:#94a3b8; } .btn-sm.gray:hover   { background:#334155; }
        .btn-sm.wa     { background:#14532d; color:#25d366; border:1px solid #166534; } .btn-sm.wa:hover { background:#166534; }
        .btn-sm.orange { background:#431407; color:#fb923c; } .btn-sm.orange:hover { background:#7c2d12; }
        .upload-zone { border:2px dashed #1e3a5f; border-radius:8px; padding:20px; text-align:center; cursor:pointer; transition:border-color .15s; }
        .upload-zone:hover { border-color:#3b82f6; }
        .upload-zone input[type=file] { display:none; }
        .upload-zone label { cursor:pointer; font-size:12px; color:#64748b; display:block; margin-bottom:10px; }
        .upload-filename { font-size:12px; color:#60a5fa; margin-bottom:10px; }
        .btn-primary { background:linear-gradient(135deg,#3b82f6,#6366f1); border:none; color:#fff; padding:8px 20px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; transition:opacity .15s; }
        .btn-primary:hover { opacity:.85; }
        .analysis-empty { text-align:center; padding:32px; color:#475569; font-size:13px; }
        .analysis-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
        .analysis-field { background:#0d1525; border:1px solid #1a2740; border-radius:7px; padding:10px 12px; }
        .analysis-field-label { font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px; }
        .analysis-field-value { font-size:13px; font-weight:600; color:#e2e8f0; }
        .fault-list { display:flex; flex-direction:column; gap:4px; margin-top:8px; }
        .fault-item { background:#450a0a; color:#f87171; border-radius:5px; padding:6px 10px; font-size:12px; }
        .step-list { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .step-item { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:#94a3b8; }
        .step-num { background:#1e3a5f; color:#60a5fa; border-radius:4px; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; }
        .report-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
        .report-field { background:#0d1525; border:1px solid #1a2740; border-radius:7px; padding:10px 12px; }
        .report-field-label { font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px; }
        .report-field-value { font-size:13px; font-weight:600; color:#e2e8f0; }
        .action-bar { display:flex; gap:8px; margin-bottom:16px; }
        .diag-bar-bg { background:#1e2d40; border-radius:4px; height:6px; overflow:hidden; flex:1; }
        .diag-bar-fill { height:100%; border-radius:4px; transition:width .6s ease; }
        .diag-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .diag-label { font-size:11px; color:#64748b; width:80px; flex-shrink:0; }
        .diag-pct { font-size:11px; color:#94a3b8; width:36px; text-align:right; flex-shrink:0; }
        .empty-msg { font-size:12px; color:#475569; padding:12px 0; text-align:center; }
        .page { padding:24px; display:flex; flex-direction:column; gap:20px; }
        .cust-layout { display:grid; grid-template-columns:320px 1fr; gap:20px; align-items:start; }
        .cust-form { background:#111827; border:1px solid #1e2d40; border-radius:10px; padding:20px; display:flex; flex-direction:column; gap:12px; }
        .cust-form h3 { font-size:13px; font-weight:600; color:#f1f5f9; margin-bottom:4px; }
        .form-field { display:flex; flex-direction:column; gap:4px; }
        .form-label { font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:.8px; }
        .form-input { background:#0d1525; border:1px solid #1a2740; border-radius:6px; padding:8px 10px; font-size:12px; color:#e2e8f0; outline:none; transition:border-color .15s; width:100%; }
        .form-input:focus { border-color:#3b82f6; }
        .form-input::placeholder { color:#334155; }
        .form-select { background:#0d1525; border:1px solid #1a2740; border-radius:6px; padding:8px 10px; font-size:12px; color:#e2e8f0; outline:none; width:100%; }
        .search-input { background:#0d1525; border:1px solid #1a2740; border-radius:6px; padding:8px 12px; font-size:12px; color:#e2e8f0; outline:none; width:100%; }
        .search-input:focus { border-color:#3b82f6; }
        .cust-table-wrap { background:#111827; border:1px solid #1e2d40; border-radius:10px; overflow:hidden; }
        .cust-table { width:100%; border-collapse:collapse; font-size:12px; }
        .cust-table th { padding:10px 12px; text-align:left; color:#475569; font-size:10px; font-weight:600; letter-spacing:.6px; text-transform:uppercase; border-bottom:1px solid #1e2d40; }
        .cust-table td { padding:10px 12px; color:#cbd5e1; border-bottom:1px solid #0f1724; vertical-align:top; }
        .cust-table tr:last-child td { border-bottom:none; }
        .cust-table tr:hover td { background:#131f30; }
        .cust-name { font-weight:600; color:#f1f5f9; margin-bottom:2px; }
        .cust-sub  { font-size:11px; color:#475569; }
        .ticket-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .ticket-card { background:#111827; border:1px solid #1e2d40; border-radius:10px; padding:14px 16px; }
        .ticket-row { background:#111827; border:1px solid #1e2d40; border-radius:8px; padding:14px 16px; margin-bottom:8px; }
        .ticket-row:hover { border-color:#334155; }
        .ticket-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .ticket-id { font-size:10px; color:#475569; }
        .ticket-title { font-size:13px; font-weight:600; color:#f1f5f9; flex:1; margin:0 10px; }
        .ticket-meta { display:flex; gap:12px; font-size:11px; color:#475569; flex-wrap:wrap; }
        .ticket-actions { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
        .filter-bar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .filter-btn { background:#1e293b; border:1px solid #334155; color:#64748b; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; }
        .filter-btn.active { background:#1e3a5f; border-color:#3b82f6; color:#60a5fa; }
        .analytics-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .analytics-card { background:#111827; border:1px solid #1e2d40; border-radius:10px; padding:20px; }
        .analytics-label { font-size:11px; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:.8px; }
        .analytics-value { font-size:28px; font-weight:700; }
        .analytics-sub { font-size:11px; color:#475569; margin-top:4px; }
        .bar-chart { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
        .bar-row { display:flex; align-items:center; gap:10px; }
        .bar-label { font-size:11px; color:#94a3b8; width:100px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bar-bg { flex:1; background:#1e2d40; border-radius:4px; height:8px; overflow:hidden; }
        .bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#3b82f6,#8b5cf6); transition:width .6s ease; }
        .bar-val { font-size:11px; color:#64748b; width:24px; text-align:right; }
        .inv-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:#111827; border:1px solid #1e2d40; border-radius:8px; margin-bottom:6px; }
        .inv-row:hover { border-color:#334155; }
        .inv-name { font-size:13px; font-weight:600; color:#f1f5f9; flex:1; }
        .inv-meta { font-size:11px; color:#475569; }
        .inv-qty  { font-size:18px; font-weight:700; min-width:36px; text-align:center; }
        .stock-btn { background:#1e293b; border:1px solid #334155; color:#94a3b8; width:26px; height:26px; border-radius:5px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .stock-btn:hover { background:#334155; color:#e2e8f0; }
        /* MODAL */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:1000; display:flex; align-items:center; justify-content:center; }
        .modal { background:#111827; border:1px solid #1e2d40; border-radius:12px; padding:24px; width:420px; max-width:95vw; display:flex; flex-direction:column; gap:14px; }
        .modal h3 { font-size:15px; font-weight:700; color:#f1f5f9; }
        /* SCANNER */
        .scanner-overlay { position:fixed; inset:0; background:#000; z-index:2000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; }
        .scanner-frame { border:3px solid #3b82f6; border-radius:12px; width:280px; height:180px; position:relative; overflow:hidden; }
        .scanner-frame video { width:100%; height:100%; object-fit:cover; }
        .scanner-line { position:absolute; top:0; left:0; right:0; height:2px; background:#3b82f6; animation:scan 2s linear infinite; }
        @keyframes scan { 0%{top:0} 100%{top:100%} }
        /* CALENDAR */
        .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
        .cal-header { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px; }
        .cal-day-name { text-align:center; font-size:10px; color:#475569; font-weight:600; padding:6px 0; }
        .cal-cell { min-height:70px; background:#0d1525; border:1px solid #1a2740; border-radius:6px; padding:4px; cursor:pointer; transition:border-color .15s; }
        .cal-cell:hover { border-color:#334155; }
        .cal-cell.today { border-color:#3b82f6; }
        .cal-cell.empty { background:transparent; border-color:transparent; cursor:default; }
        .cal-day-num { font-size:11px; color:#475569; margin-bottom:3px; }
        .cal-appt-dot { font-size:10px; background:#1e3a5f; color:#60a5fa; border-radius:4px; padding:1px 5px; margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        /* EXPORT BAR */
        .export-bar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; background:#111827; border:1px solid #1e2d40; border-radius:10px; padding:14px 16px; }
        .export-label { font-size:11px; color:#475569; font-weight:600; text-transform:uppercase; letter-spacing:.8px; flex-shrink:0; }
        .print-ticket { display:none; }
        @media print {
          .print-ticket { display:block !important; padding:24px; font-family:'Segoe UI',sans-serif; }
          .print-ticket h1 { font-size:20px; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:16px; }
          .print-ticket .pt-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
          .print-ticket .pt-label { font-weight:700; width:140px; }
          .print-ticket .pt-section { margin-top:16px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #ccc; padding-bottom:4px; margin-bottom:8px; }
        }
        @media(max-width:900px){
          .dashboard { grid-template-columns:1fr; }
          .stat-row { grid-template-columns:repeat(2,1fr); }
          .panels { grid-template-columns:1fr; }
          .analysis-grid { grid-template-columns:1fr; }
          .report-grid { grid-template-columns:repeat(2,1fr); }
          .cust-layout { grid-template-columns:1fr; }
          .ticket-stats { grid-template-columns:repeat(2,1fr); }
          .analytics-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      {/* NOTIFICATIONS */}
      <div className='notif-stack'>
        {notifications.map(n => (
          <div key={n.id} className={`notif notif-${n.type}`}>{n.msg}</div>
        ))}
      </div>

      {/* PRINT TICKET */}
      {printTicket && (
        <div className='print-ticket'>
          <h1>ðŸ”¬ NNIT AI Electronics Doctor Pro â€” Repair Job Card</h1>
          <div className='pt-section'>Customer & Device</div>
          <div className='pt-row'><span className='pt-label'>Customer:</span><span>{printTicket.customerName || 'â€”'}</span></div>
          <div className='pt-row'><span className='pt-label'>Device:</span><span>{printTicket.device} {printTicket.model}</span></div>
          <div className='pt-section'>Repair Details</div>
          <div className='pt-row'><span className='pt-label'>Ticket #:</span><span>{printTicket.id.slice(-6)}</span></div>
          <div className='pt-row'><span className='pt-label'>Fault:</span><span>{printTicket.fault}</span></div>
          <div className='pt-row'><span className='pt-label'>Priority:</span><span>{printTicket.priority}</span></div>
          <div className='pt-row'><span className='pt-label'>Status:</span><span>{printTicket.status}</span></div>
          <div className='pt-row'><span className='pt-label'>Est. Cost:</span><span>{printTicket.cost || 'â€”'}</span></div>
          <div className='pt-row'><span className='pt-label'>Created:</span><span>{printTicket.createdAt}</span></div>
          <div className='pt-section'>Technician Notes</div>
          <div style={{fontSize:'13px'}}>{printTicket.techNotes || 'No notes.'}</div>
          <div style={{marginTop:'32px',fontSize:'11px',color:'#666'}}>Network Nice IT (NNIT) Â· networkniceit@gmail.com</div>
        </div>
      )}

      {/* WHATSAPP CONFIG MODAL */}
      {showWaConfig && (
        <div className='modal-overlay' onClick={()=>setShowWaConfig(false)}>
          <div className='modal' onClick={e=>e.stopPropagation()}>
            <h3>ðŸ“± WhatsApp API Config (UltraMsg)</h3>
            <p style={{fontSize:'12px',color:'#64748b'}}>Get your Instance ID and Token from <strong style={{color:'#60a5fa'}}>ultramsg.com</strong> â€” free plan available.</p>
            <div className='form-field'><label className='form-label'>Instance ID</label><input className='form-input' placeholder='instance12345' value={waInstanceId} onChange={e=>setWaInstanceId(e.target.value)}/></div>
            <div className='form-field'><label className='form-label'>API Token</label><input className='form-input' placeholder='your_token_here' value={waApiKey} onChange={e=>setWaApiKey(e.target.value)}/></div>
            <div style={{display:'flex',gap:'8px'}}>
              <button className='btn-primary' style={{flex:1}} onClick={saveWaConfig}>Save Config</button>
              <button className='btn-sm red' onClick={()=>setShowWaConfig(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER OVERLAY */}
      {scannerActive && (
        <div className='scanner-overlay'>
          <div style={{color:'#f1f5f9',fontSize:'16px',fontWeight:700}}>ðŸ“· Barcode / QR Scanner</div>
          <div style={{fontSize:'12px',color:'#64748b'}}>Scanning for: <strong style={{color:'#60a5fa'}}>{scanTarget === 'ticket' ? 'Device (Ticket)' : 'Part (Inventory)'}</strong></div>
          <div className='scanner-frame'>
            <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <div className='scanner-line'/>
          </div>
          <div style={{fontSize:'12px',color:'#475569'}}>USB scanner? Just scan â€” it types automatically.</div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input className='form-input' style={{width:'220px'}} placeholder='Or type/paste barcode here' value={scannedCode} onChange={e=>setScannedCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyBarcode(scannedCode)} autoFocus/>
            <button className='btn-sm green' onClick={()=>applyBarcode(scannedCode)}>Apply</button>
          </div>
          <button className='btn-sm red' onClick={stopScanner}>âœ• Close Scanner</button>
        </div>
      )}

      {/* TOPBAR */}
      <div className='topbar'>
        <div className='topbar-brand'>
          <div className='topbar-logo'>ðŸ”¬</div>
          <div>
            <div className='topbar-name'>NNIT AI Electronics Doctor Pro</div>
            <div className='topbar-sub'>Network Nice IT (NNIT) &middot; v{home?.version ?? '1.0.0'}</div>
          </div>
        </div>
        <div className='topbar-right'>
          <div className='sync-pill'>
            <div className='backend-dot' style={{background:backendOnline?'#22c55e':'#f87171'}}/>
            <span style={{color:backendOnline?'#22c55e':'#f87171'}}>{backendOnline?'Backend Online Â· Cloud Mode':'Offline â€” Local'}</span>
            {syncStatus==='syncing'&&<span style={{color:'#fbbf24'}}>âŸ³</span>}
            {syncStatus==='synced'&&<span style={{color:'#4ade80'}}>âœ“</span>}
          </div>
          <div className='topbar-status'>{home?.status ?? 'running'}</div>
          <span style={{fontSize:11,color:'#64748b',padding:'4px 8px',background:'#1e293b',borderRadius:6}}>ðŸ‘¤ {authUser}</span>
          <button className='btn-sm wa' onClick={()=>setShowWaConfig(true)}>âš™ WhatsApp</button>
          <button className='btn-sm orange' onClick={()=>{setScanTarget('ticket');startScanner();}}>ðŸ“· Scanner</button>
          <button className='btn-refresh' onClick={loadData}>{loading ? 'Loading...' : 'Refresh'}</button>
          <button className='btn-sm red' onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      {/* TABS */}
      <div className='tabs'>
        <button className={'tab'+(tab==='dashboard'?' active':'')} onClick={()=>setTab('dashboard')}>Dashboard</button>
        <button className={'tab'+(tab==='customers'?' active':'')} onClick={()=>setTab('customers')}>
          Customers {customers.length>0 && <span className='badge badge-blue'>{customers.length}</span>}
        </button>
        <button className={'tab'+(tab==='tickets'?' active':'')} onClick={()=>setTab('tickets')}>
          Tickets {activeTickets>0 && <span className='badge badge-yellow'>{activeTickets}</span>}
        </button>
        <button className={'tab'+(tab==='invoices'?' active':'')} onClick={()=>setTab('invoices')}>
          Invoices {activeInvoices>0 && <span className='badge badge-blue'>{activeInvoices}</span>}
        </button>
        <button className={'tab'+(tab==='inventory'?' active':'')} onClick={()=>setTab('inventory')}>
          Inventory {lowStockItems.length>0 && <span className='badge badge-red'>{lowStockItems.length}</span>}
        </button>
        <button className={'tab'+(tab==='calendar'?' active':'')} onClick={()=>setTab('calendar')}>
          Calendar {todayAppts>0 && <span className='badge badge-purple'>{todayAppts}</span>}
        </button>
        <button className={'tab'+(tab==='analytics'?' active':'')} onClick={()=>setTab('analytics')}>Analytics</button>
      </div>

      {/* â”€â”€ DASHBOARD â”€â”€ */}
      {tab==='dashboard' && (
        <div className='dashboard'>
          <aside className='sidebar'>
            <div className='sidebar-section'>
              <div className='sidebar-label'>Computer</div>
              <div className='info-row'><span className='info-key'>Host</span><span className='info-val'>{scan?.computer??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>OS</span><span className='info-val'>{scan?.system??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>CPU</span><span className='info-val'>{scan?.processor??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>RAM</span><span className='info-val'>{scan?.ram_gb!=null?scan.ram_gb+' GB':'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>Battery</span><span className='info-val'>{scan?.battery!=null?scan.battery+'%':'â€”'}</span></div>
            </div>
            <div className='divider'/>
            <div className='sidebar-section'>
              <div className='sidebar-label'>Android Phone</div>
              <div className='info-row'><span className='info-key'>ADB</span><span className='info-val'><span className={'badge '+(phoneOk?'badge-green':'badge-red')}>{phoneOk?'Connected':'Disconnected'}</span></span></div>
              <div className='info-row'><span className='info-key'>Brand</span><span className='info-val'>{phone?.brand??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>Model</span><span className='info-val'>{phone?.model??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>Android</span><span className='info-val'>{phone?.android_version??'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>Battery</span><span className='info-val'>{phone?.battery!=null?phone.battery+'%':'â€”'}</span></div>
              <div className='info-row'><span className='info-key'>Temp</span><span className='info-val'>{phoneTemp}</span></div>
              <div className='info-row'><span className='info-key'>Voltage</span><span className='info-val'>{phone?.voltage?phone.voltage+' mV':'â€”'}</span></div>
            </div>
            <div className='divider'/>
            <div className='sidebar-section'>
              <div className='sidebar-label'>System</div>
              <div className='info-row'><span className='info-key'>API</span><span className='info-val'>{home?.api??'/docs'}</span></div>
              <div className='info-row'><span className='info-key'>Status</span><span className='info-val'><span className='badge badge-green'>{home?.status??'running'}</span></span></div>
              <div className='info-row'><span className='info-key'>Backend</span><span className='info-val'><span className={'badge '+(backendOnline?'badge-green':'badge-red')}>{backendOnline?'Online':'Offline'}</span></span></div>
            </div>
          </aside>
          <main className='main'>
            <div className='stat-row'>
              <div className='stat-card'>
                <div className='stat-label'>CPU Usage</div>
                <div className='stat-value' style={{color:cpuUsage>80?'#f87171':'#4ade80'}}>{cpuUsage!=null?cpuUsage+'%':'â€”'}</div>
                <div className='stat-sub'>Real-time</div>
              </div>
              <div className='stat-card'>
                <div className='stat-label'>RAM Usage</div>
                <div className='stat-value' style={{color:ramUsage>80?'#f87171':'#60a5fa'}}>{ramUsage!=null?ramUsage+'%':'â€”'}</div>
                <div className='stat-sub'>Real-time</div>
              </div>
              <div className='stat-card'>
                <div className='stat-label'>Faults Detected</div>
                <div className='stat-value' style={{color:faults.length>0?'#fbbf24':'#4ade80'}}>{faults.length}</div>
                <div className='stat-sub'>{faults.length>0?'Action needed':'All clear'}</div>
              </div>
              <div className='stat-card'>
                <div className='stat-label'>Open Tickets</div>
                <div className='stat-value' style={{color:'#fbbf24'}}>{activeTickets}</div>
                <div className='stat-sub'>{customers.length} customers</div>
              </div>
            </div>
            <div className='panels'>
              <div className='panel'>
                <div className='panel-head'>
                  <span className='panel-title'>AI Diagnosis</span>
                  {faults.length>0&&<span className='badge badge-yellow'>{faults.length} fault{faults.length>1?'s':''}</span>}
                </div>
                <div className='panel-body'>
                  {diagnosis?(
                    <>
                      <div className='diag-row'><span className='diag-label'>CPU</span><div className='diag-bar-bg'><div className='diag-bar-fill' style={{width:(cpuUsage??0)+'%',background:cpuUsage>80?'#ef4444':'#3b82f6'}}/></div><span className='diag-pct'>{cpuUsage!=null?cpuUsage+'%':'â€”'}</span></div>
                      <div className='diag-row'><span className='diag-label'>RAM</span><div className='diag-bar-bg'><div className='diag-bar-fill' style={{width:(ramUsage??0)+'%',background:ramUsage>80?'#ef4444':'#8b5cf6'}}/></div><span className='diag-pct'>{ramUsage!=null?ramUsage+'%':'â€”'}</span></div>
                      {faults.length>0&&<div className='fault-list'>{faults.map((f:string,i:number)=><div key={i} className='fault-item'>âš  {f}</div>)}</div>}
                      {diagnosis.recommendations?.length>0&&<div className='step-list' style={{marginTop:'12px'}}>{diagnosis.recommendations.map((r:string,i:number)=><div key={i} className='step-item'><div className='step-num'>{i+1}</div><span>{r}</span></div>)}</div>}
                    </>
                  ):<div className='empty-msg'>Loading diagnosis...</div>}
                </div>
              </div>
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>Storage</span></div>
                <div className='panel-body' style={{padding:0}}>
                  {storage?.length>0?(
                    <table className='data-table'>
                      <thead><tr><th>Drive</th><th>Total</th><th>Used</th><th>Free</th></tr></thead>
                      <tbody>{storage.map((d:any,i:number)=><tr key={i}><td><span className='badge badge-blue'>{d.drive}</span></td><td>{d.total_gb} GB</td><td>{d.used_gb} GB</td><td style={{color:'#4ade80'}}>{d.free_gb} GB</td></tr>)}</tbody>
                    </table>
                  ):<div className='empty-msg'>No storage data</div>}
                </div>
              </div>
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>Upload File</span></div>
                <div className='panel-body'>
                  <div className='upload-zone'>
                    <input type='file' id='file-input' onChange={e=>setFile(e.target.files?.[0]||null)}/>
                    <label htmlFor='file-input'>Click to choose an image or video</label>
                    {file&&<div className='upload-filename'>{file.name}</div>}
                    <button className='btn-primary' onClick={uploadFile}>Upload</button>
                  </div>
                  {uploadResult&&<div style={{marginTop:'10px',padding:'8px 12px',background:'#14532d',borderRadius:'6px',fontSize:'12px',color:'#4ade80'}}>{uploadResult.message}</div>}
                </div>
              </div>
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>Uploaded Files</span><span className='badge badge-blue'>{images.length}</span></div>
                <div className='panel-body'>
                  {images.length===0?<div className='empty-msg'>No files uploaded yet</div>
                    :images.map((img:any,i:number)=>(
                      <div key={i} className='file-item'>
                        <span className='file-name'>{img.filename??img}</span>
                        <button className='btn-sm' onClick={()=>analyzeFile(img.filename??img)}>Analyze</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className='panels'>
              <div className='panel panel-full'>
                <div className='panel-head'>
                  <span className='panel-title'>AI Analysis Result</span>
                  {analysis&&(
                    <div className='action-bar' style={{margin:0}}>
                      <button className='btn-sm purple' onClick={copyResult}>Copy JSON</button>
                      <button className='btn-sm green' onClick={generateReport}>Generate Report</button>
                      {analysis.report&&<button className='btn-sm' onClick={downloadPDF}>Download PDF</button>}
                    </div>
                  )}
                </div>
                <div className='panel-body'>
                  {!analysis?(<div className='analysis-empty'><div style={{fontSize:'32px',marginBottom:'8px'}}>ðŸ”</div>Select a file above and click <strong>Analyze</strong> to get started.</div>):(
                    <>
                      <div className='analysis-grid'>
                        <div className='analysis-field'><div className='analysis-field-label'>File</div><div className='analysis-field-value'>{analysis.filename??'â€”'}</div></div>
                        <div className='analysis-field'><div className='analysis-field-label'>Type</div><div className='analysis-field-value'>{analysis.type??'â€”'}</div></div>
                        <div className='analysis-field'><div className='analysis-field-label'>Device</div><div className='analysis-field-value'>{analysis.device??'â€”'}</div></div>
                        <div className='analysis-field'><div className='analysis-field-label'>Confidence</div><div className='analysis-field-value'>{analysis.confidence!=null?analysis.confidence+'%':'â€”'}</div></div>
                      </div>
                      {analysis.faults?.length>0&&(<><div style={{fontSize:'11px',color:'#475569',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.8px'}}>Faults</div><div className='fault-list' style={{marginBottom:'14px'}}>{analysis.faults.map((f:string,i:number)=><div key={i} className='fault-item'>âš  {f}</div>)}</div></>)}
                      {analysis.repair_steps?.length>0&&(<><div style={{fontSize:'11px',color:'#475569',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.8px'}}>Repair Steps</div><div className='step-list' style={{marginBottom:'14px'}}>{analysis.repair_steps.map((s:string,i:number)=><div key={i} className='step-item'><div className='step-num'>{i+1}</div><span>{s}</span></div>)}</div></>)}
                      {analysis.report&&(
                        <>
                          <div style={{fontSize:'11px',color:'#475569',margin:'16px 0 8px',textTransform:'uppercase',letterSpacing:'.8px',borderTop:'1px solid #1e2d40',paddingTop:'16px'}}>Repair Report Â· {analysis.report.report_id}</div>
                          <div className='report-grid'>
                            <div className='report-field'><div className='report-field-label'>Device</div><div className='report-field-value'>{analysis.report.device??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Fault</div><div className='report-field-value'>{analysis.report.diagnosis?.fault??'No fault data'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Confidence</div><div className='report-field-value'>{analysis.report.diagnosis?.confidence??0}%</div></div>
                            <div className='report-field'><div className='report-field-label'>Severity</div><div className='report-field-value'>{analysis.report.diagnosis?.severity??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Est. Cost</div><div className='report-field-value' style={{color:'#4ade80'}}>{analysis.report.estimated_cost??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Repair Time</div><div className='report-field-value'>{analysis.report.estimated_repair_time??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Technician</div><div className='report-field-value'>{analysis.report.technician??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Date</div><div className='report-field-value'>{analysis.report.date??'â€”'}</div></div>
                            <div className='report-field'><div className='report-field-label'>Status</div><div className='report-field-value'><span className='badge badge-green'>{analysis.report.status??'â€”'}</span></div></div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className='panels'>
              <div className='panel panel-full'>
                <div className='panel-head'><span className='panel-title'>Report History</span><span className='badge badge-blue'>{(reports??[]).length}</span></div>
                <div className='panel-body'>
                  {(reports??[]).length===0?<div className='empty-msg'>No reports saved yet</div>:(
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'8px'}}>
                      {reports.map((r:any,i:number)=>(
                        <div key={i} className='file-item'>
                          <span className='file-name'>{r.name??r}</span>
                          <button className='btn-sm' onClick={()=>viewReport(r.name??r)}>View</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* â”€â”€ CUSTOMERS â”€â”€ */}
      {tab==='customers'&&(
        <div className='page'>
          {/* Export bar */}
          <div className='export-bar'>
            <span className='export-label'>Export Customers:</span>
            <button className='btn-sm green' onClick={()=>exportToXLSX(customers,'Customers','NNIT_Customers.xlsx')}>â¬‡ Excel</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(customers,'NNIT_Customers.csv')}>â¬‡ CSV</button>
            {backendOnline&&<button className='btn-sm' onClick={()=>syncToBackend('customers',customers)}>â˜ Sync to Backend</button>}
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>{editingCustomerId?'Edit Customer':'Add Customer'}</h3>
              <div className='form-field'><label className='form-label'>Name *</label><input className='form-input' placeholder='Full name' value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Phone</label><input className='form-input' placeholder='+49 123 456789' value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Email</label><input className='form-input' placeholder='email@example.com' value={customerForm.email} onChange={e=>setCustomerForm({...customerForm,email:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device Brand</label><input className='form-input' placeholder='e.g. Samsung, Apple' value={customerForm.device} onChange={e=>setCustomerForm({...customerForm,device:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device Model</label><input className='form-input' placeholder='e.g. Galaxy S23' value={customerForm.model} onChange={e=>setCustomerForm({...customerForm,model:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Any notes...' value={customerForm.notes} onChange={e=>setCustomerForm({...customerForm,notes:e.target.value})}/></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className='btn-primary' style={{flex:1}} onClick={submitCustomer}>{editingCustomerId?'Save Changes':'Add Customer'}</button>
                {editingCustomerId&&<button className='btn-sm red' onClick={()=>{setEditingCustomerId(null);setCustomerForm({name:'',phone:'',email:'',device:'',model:'',notes:''});}}>Cancel</button>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <input className='search-input' placeholder='Search customers...' value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/>
              <div className='cust-table-wrap'>
                {filteredCustomers.length===0?(<div className='empty-msg' style={{padding:'32px'}}>{customers.length===0?'No customers yet.':'No results found.'}</div>):(
                  <table className='cust-table'>
                    <thead><tr><th>Customer</th><th>Phone</th><th>Device</th><th>Notes</th><th>Added</th><th></th></tr></thead>
                    <tbody>{filteredCustomers.map(c=>(
                      <tr key={c.id}>
                        <td><div className='cust-name'>{c.name}</div><div className='cust-sub'>{c.email}</div></td>
                        <td>{c.phone||'â€”'}</td>
                        <td>{c.device?c.device+(c.model?' '+c.model:''):'â€”'}</td>
                        <td style={{maxWidth:'160px',color:'#64748b'}}>{c.notes||'â€”'}</td>
                        <td style={{color:'#475569',whiteSpace:'nowrap'}}>{c.createdAt}</td>
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className='btn-sm' onClick={()=>editCustomer(c)}>Edit</button>
                            {c.phone&&<button className='btn-sm wa' onClick={()=>sendWhatsApp(c.phone,`Hello ${c.name}, this is NNIT AI Electronics Doctor. How can we help you today?`)}>WA</button>}
                            <button className='btn-sm red' onClick={()=>deleteCustomer(c.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ TICKETS â”€â”€ */}
      {tab==='tickets'&&(
        <div className='page'>
          <div className='ticket-stats'>
            {(['Open','In Progress','Completed','Cancelled'] as const).map(s=>(
              <div key={s} className='ticket-card'>
                <div className='stat-label'>{s}</div>
                <div className='stat-value' style={{color:statusColor[s]}}>{tickets.filter(t=>t.status===s).length}</div>
              </div>
            ))}
          </div>
          {/* Export bar */}
          <div className='export-bar'>
            <span className='export-label'>Export Tickets:</span>
            <button className='btn-sm green' onClick={()=>exportToXLSX(tickets,'Tickets','NNIT_Tickets.xlsx')}>â¬‡ Excel</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(tickets,'NNIT_Tickets.csv')}>â¬‡ CSV</button>
            <button className='btn-sm orange' onClick={()=>{setScanTarget('ticket');startScanner();}}>ðŸ“· Scan Device</button>
            {backendOnline&&<button className='btn-sm' onClick={()=>syncToBackend('tickets',tickets)}>â˜ Sync to Backend</button>}
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>{editingTicketId?'Edit Ticket':'New Ticket'}</h3>
              <div className='form-field'>
                <label className='form-label'>Customer</label>
                <select className='form-select' value={ticketForm.customerId} onChange={e=>{
                  const c=customers.find(c=>c.id===e.target.value);
                  setTicketForm({...ticketForm,customerId:e.target.value,customerName:c?.name??'',device:c?.device??ticketForm.device,model:c?.model??ticketForm.model});
                }}>
                  <option value=''>-- Select customer --</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='form-field'><label className='form-label'>Device Brand</label><input className='form-input' placeholder='e.g. Samsung' value={ticketForm.device} onChange={e=>setTicketForm({...ticketForm,device:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device Model</label><input className='form-input' placeholder='e.g. Galaxy S23' value={ticketForm.model} onChange={e=>setTicketForm({...ticketForm,model:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Fault Description *</label><input className='form-input' placeholder='Describe the fault...' value={ticketForm.fault} onChange={e=>setTicketForm({...ticketForm,fault:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Priority</label><select className='form-select' value={ticketForm.priority} onChange={e=>setTicketForm({...ticketForm,priority:e.target.value as Ticket['priority']})}><option>Low</option><option>Medium</option><option>High</option></select></div>
              <div className='form-field'><label className='form-label'>Status</label><select className='form-select' value={ticketForm.status} onChange={e=>setTicketForm({...ticketForm,status:e.target.value as Ticket['status']})}><option>Open</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></div>
              <div className='form-field'><label className='form-label'>Estimated Cost</label><input className='form-input' placeholder='e.g. â‚¬50' value={ticketForm.cost} onChange={e=>setTicketForm({...ticketForm,cost:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Technician Notes</label><input className='form-input' placeholder='Internal notes...' value={ticketForm.techNotes} onChange={e=>setTicketForm({...ticketForm,techNotes:e.target.value})}/></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className='btn-primary' style={{flex:1}} onClick={submitTicket}>{editingTicketId?'Save Changes':'Create Ticket'}</button>
                {editingTicketId&&<button className='btn-sm red' onClick={()=>{setEditingTicketId(null);setTicketForm(blankTicket);}}>Cancel</button>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className='filter-bar'>
                <input className='search-input' style={{flex:1}} placeholder='Search tickets...' value={ticketSearch} onChange={e=>setTicketSearch(e.target.value)}/>
                {['All','Open','In Progress','Completed','Cancelled'].map(f=>(
                  <button key={f} className={'filter-btn'+(ticketFilter===f?' active':'')} onClick={()=>setTicketFilter(f)}>{f}</button>
                ))}
              </div>
              {filteredTickets.length===0?(
                <div className='cust-table-wrap'><div className='empty-msg' style={{padding:'32px'}}>{tickets.length===0?'No tickets yet. Create your first ticket.':'No results found.'}</div></div>
              ):filteredTickets.map(t=>(
                <div key={t.id} className='ticket-row'>
                  <div className='ticket-head'>
                    <span className='ticket-id'>#{t.id.slice(-6)}</span>
                    <span className='ticket-title'>{t.fault}</span>
                    <span style={{background:statusBg[t.status],color:statusColor[t.status],padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:600}}>{t.status}</span>
                  </div>
                  <div className='ticket-meta'>
                    <span>ðŸ‘¤ {t.customerName||'No customer'}</span>
                    <span>ðŸ“± {t.device} {t.model}</span>
                    {t.cost&&<span>ðŸ’° {t.cost}</span>}
                    <span style={{color:priorityColor[t.priority]}}>â— {t.priority}</span>
                    <span>ðŸ• {t.createdAt}</span>
                  </div>
                  {t.techNotes&&<div style={{marginTop:'6px',fontSize:'11px',color:'#475569'}}>Notes: {t.techNotes}</div>}
                  <div className='ticket-actions'>
                    {t.status==='Open'&&<button className='btn-sm yellow' onClick={()=>updateTicketStatus(t.id,'In Progress')}>Start</button>}
                    {t.status==='In Progress'&&<button className='btn-sm green' onClick={()=>updateTicketStatus(t.id,'Completed')}>Complete</button>}
                    {t.status!=='Cancelled'&&t.status!=='Completed'&&<button className='btn-sm red' onClick={()=>updateTicketStatus(t.id,'Cancelled')}>Cancel</button>}
                    <button className='btn-sm' onClick={()=>editTicket(t)}>Edit</button>
                    <button className='btn-sm gray' onClick={()=>handlePrintTicket(t)}>ðŸ–¨ Print</button>
                    <button className='btn-sm wa' onClick={()=>sendTicketStatusWA(t)}>ðŸ“± WA Update</button>
                    <button className='btn-sm red' onClick={()=>deleteTicket(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ INVOICES â”€â”€ */}
      {tab==='invoices'&&(
        <div className='page'>
          <div className='ticket-stats'>
            {(['Draft','Sent','Paid','Overdue'] as const).map(s=>(
              <div key={s} className='ticket-card'>
                <div className='stat-label'>{s}</div>
                <div className='stat-value' style={{color:invStatusColor[s]}}>{invoices.filter(i=>i.status===s).length}</div>
                <div className='stat-sub'>{s==='Paid'?'â‚¬'+invoices.filter(i=>i.status==='Paid').reduce((a,i)=>a+(parseFloat(i.totalCost.replace('â‚¬',''))||0),0).toFixed(2):''}</div>
              </div>
            ))}
          </div>
          {/* Export bar */}
          <div className='export-bar'>
            <span className='export-label'>Export Invoices:</span>
            <button className='btn-sm green' onClick={()=>exportToXLSX(invoices,'Invoices','NNIT_Invoices.xlsx')}>â¬‡ Excel</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(invoices,'NNIT_Invoices.csv')}>â¬‡ CSV</button>
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>{editingInvoiceId?'Edit Invoice':'New Invoice'}</h3>
              <div className='form-field'>
                <label className='form-label'>Link to Ticket</label>
                <select className='form-select' value={invoiceForm.ticketId} onChange={e=>{
                  const t=tickets.find(t=>t.id===e.target.value);
                  const c=t?customers.find(c=>c.id===t.customerId):undefined;
                  setInvoiceForm({...invoiceForm,ticketId:e.target.value,customerName:t?.customerName??invoiceForm.customerName,customerId:t?.customerId??'',device:t?.device??'',model:t?.model??'',fault:t?.fault??'',customerEmail:c?.email??'',customerPhone:c?.phone??''});
                }}>
                  <option value=''>-- Select ticket (optional) --</option>
                  {tickets.map(t=><option key={t.id} value={t.id}>#{t.id.slice(-6)} Â· {t.customerName} Â· {t.fault.slice(0,30)}</option>)}
                </select>
              </div>
              <div className='form-field'><label className='form-label'>Customer Name *</label><input className='form-input' placeholder='Customer name' value={invoiceForm.customerName} onChange={e=>setInvoiceForm({...invoiceForm,customerName:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Customer Email</label><input className='form-input' placeholder='email@example.com' value={invoiceForm.customerEmail} onChange={e=>setInvoiceForm({...invoiceForm,customerEmail:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Customer Phone</label><input className='form-input' placeholder='+49 123...' value={invoiceForm.customerPhone} onChange={e=>setInvoiceForm({...invoiceForm,customerPhone:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device</label><input className='form-input' placeholder='e.g. Samsung Galaxy S23' value={invoiceForm.device+' '+invoiceForm.model} onChange={e=>setInvoiceForm({...invoiceForm,device:e.target.value,model:''})}/></div>
              <div className='form-field'><label className='form-label'>Fault / Service</label><input className='form-input' placeholder='Describe the repair...' value={invoiceForm.fault} onChange={e=>setInvoiceForm({...invoiceForm,fault:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Labour Cost (â‚¬)</label><input className='form-input' type='number' placeholder='0.00' value={invoiceForm.laborCost} onChange={e=>setInvoiceForm({...invoiceForm,laborCost:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Parts Cost (â‚¬)</label><input className='form-input' type='number' placeholder='0.00' value={invoiceForm.partsCost} onChange={e=>setInvoiceForm({...invoiceForm,partsCost:e.target.value})}/></div>
              <div style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:'6px',padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'11px',color:'#475569',textTransform:'uppercase',letterSpacing:'.8px'}}>Total</span>
                <span style={{fontSize:'18px',fontWeight:700,color:'#4ade80'}}>â‚¬{((parseFloat(invoiceForm.laborCost)||0)+(parseFloat(invoiceForm.partsCost)||0)).toFixed(2)}</span>
              </div>
              <div className='form-field'><label className='form-label'>Status</label><select className='form-select' value={invoiceForm.status} onChange={e=>setInvoiceForm({...invoiceForm,status:e.target.value as Invoice['status']})}><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
              <div className='form-field'><label className='form-label'>Due Date</label><input className='form-input' type='date' value={invoiceForm.dueDate} onChange={e=>setInvoiceForm({...invoiceForm,dueDate:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Additional notes...' value={invoiceForm.notes} onChange={e=>setInvoiceForm({...invoiceForm,notes:e.target.value})}/></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className='btn-primary' style={{flex:1}} onClick={submitInvoice}>{editingInvoiceId?'Save Changes':'Create Invoice'}</button>
                {editingInvoiceId&&<button className='btn-sm red' onClick={()=>{setEditingInvoiceId(null);setInvoiceForm(blankInvoice);}}>Cancel</button>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className='filter-bar'>
                {['All','Draft','Sent','Paid','Overdue'].map(f=>(
                  <button key={f} className={'filter-btn'+(invoiceFilter===f?' active':'')} onClick={()=>setInvoiceFilter(f)}>{f}</button>
                ))}
              </div>
              {filteredInvoices.length===0?
                <div className='cust-table-wrap'><div className='empty-msg' style={{padding:'32px'}}>{invoices.length===0?'No invoices yet.':'No results found.'}</div></div>
              :(
                <div className='cust-table-wrap'>
                  <table className='cust-table'>
                    <thead><tr><th>Invoice</th><th>Customer</th><th>Device / Fault</th><th>Total</th><th>Status</th><th>Due</th><th></th></tr></thead>
                    <tbody>{filteredInvoices.map(inv=>(
                      <tr key={inv.id}>
                        <td><div className='cust-name'>{inv.id}</div><div className='cust-sub'>{inv.createdAt}</div></td>
                        <td><div style={{fontWeight:600,color:'#f1f5f9'}}>{inv.customerName}</div><div className='cust-sub'>{inv.customerEmail}</div></td>
                        <td><div style={{color:'#94a3b8'}}>{inv.device}</div><div className='cust-sub'>{inv.fault?.slice(0,40)}</div></td>
                        <td style={{fontWeight:700,color:'#4ade80'}}>{inv.totalCost}</td>
                        <td><span style={{background:invStatusBg[inv.status],color:invStatusColor[inv.status],padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:600}}>{inv.status}</span></td>
                        <td style={{color:'#475569',fontSize:'11px'}}>{inv.dueDate||'â€”'}</td>
                        <td>
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                            {inv.status!=='Paid'&&<button className='btn-sm green' onClick={()=>updateInvoiceStatus(inv.id,'Paid')}>Paid</button>}
                            {inv.status==='Draft'&&<button className='btn-sm' onClick={()=>updateInvoiceStatus(inv.id,'Sent')}>Send</button>}
                            <button className='btn-sm gray' onClick={()=>downloadInvoicePDF(inv)}>PDF</button>
                            {inv.customerPhone&&<button className='btn-sm wa' onClick={()=>sendInvoiceWA(inv)}>ðŸ“± WA</button>}
                            <button className='btn-sm' onClick={()=>editInvoice(inv)}>Edit</button>
                            <button className='btn-sm red' onClick={()=>deleteInvoice(inv.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ INVENTORY â”€â”€ */}
      {tab==='inventory'&&(
        <div className='page'>
          <div className='ticket-stats'>
            <div className='ticket-card'><div className='stat-label'>Total Items</div><div className='stat-value' style={{color:'#60a5fa'}}>{inventory.length}</div></div>
            <div className='ticket-card'><div className='stat-label'>Low Stock</div><div className='stat-value' style={{color:lowStockItems.length>0?'#f87171':'#4ade80'}}>{lowStockItems.length}</div></div>
            <div className='ticket-card'><div className='stat-label'>Total Units</div><div className='stat-value' style={{color:'#c084fc'}}>{inventory.reduce((s,i)=>s+i.quantity,0)}</div></div>
            <div className='ticket-card'><div className='stat-label'>Stock Value</div><div className='stat-value' style={{color:'#4ade80',fontSize:'18px'}}>â‚¬{inventoryValue.toFixed(2)}</div></div>
          </div>
          {lowStockItems.length>0&&(
            <div style={{background:'#422006',border:'1px solid #92400e',borderRadius:'8px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'16px'}}>âš </span>
              <span style={{fontSize:'13px',color:'#fbbf24',fontWeight:600}}>Low stock alert: {lowStockItems.map(i=>i.name).join(', ')}</span>
            </div>
          )}
          {/* Export bar */}
          <div className='export-bar'>
            <span className='export-label'>Export Inventory:</span>
            <button className='btn-sm green' onClick={()=>exportToXLSX(inventory,'Inventory','NNIT_Inventory.xlsx')}>â¬‡ Excel</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(inventory,'NNIT_Inventory.csv')}>â¬‡ CSV</button>
            <button className='btn-sm orange' onClick={()=>{setScanTarget('inventory');startScanner();}}>ðŸ“· Scan Part</button>
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>{editingItemId?'Edit Item':'Add Part / Item'}</h3>
              <div className='form-field'><label className='form-label'>Part Name *</label><input className='form-input' placeholder='e.g. iPhone 13 Screen' value={itemForm.name} onChange={e=>setItemForm({...itemForm,name:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Category</label><input className='form-input' placeholder='e.g. Screens, Batteries' value={itemForm.category} onChange={e=>setItemForm({...itemForm,category:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>SKU / Part #</label><input className='form-input' placeholder='e.g. SCR-IP13-001' value={itemForm.sku} onChange={e=>setItemForm({...itemForm,sku:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Quantity</label><input className='form-input' type='number' min={0} value={itemForm.quantity} onChange={e=>setItemForm({...itemForm,quantity:parseInt(e.target.value)||0})}/></div>
              <div className='form-field'><label className='form-label'>Min Stock Alert</label><input className='form-input' type='number' min={0} value={itemForm.minStock} onChange={e=>setItemForm({...itemForm,minStock:parseInt(e.target.value)||0})}/></div>
              <div className='form-field'><label className='form-label'>Unit Cost (â‚¬)</label><input className='form-input' type='number' placeholder='0.00' value={itemForm.unitCost} onChange={e=>setItemForm({...itemForm,unitCost:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Supplier</label><input className='form-input' placeholder='Supplier name' value={itemForm.supplier} onChange={e=>setItemForm({...itemForm,supplier:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Notes...' value={itemForm.notes} onChange={e=>setItemForm({...itemForm,notes:e.target.value})}/></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className='btn-primary' style={{flex:1}} onClick={submitItem}>{editingItemId?'Save Changes':'Add Item'}</button>
                {editingItemId&&<button className='btn-sm red' onClick={()=>{setEditingItemId(null);setItemForm(blankItem);}}>Cancel</button>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <input className='search-input' placeholder='Search inventory...' value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)}/>
              {filteredInventory.length===0?
                <div className='cust-table-wrap'><div className='empty-msg' style={{padding:'32px'}}>{inventory.length===0?'No items yet. Add your first spare part.':'No results found.'}</div></div>
              :filteredInventory.map(item=>(
                <div key={item.id} className='inv-row'>
                  <div style={{flex:1}}>
                    <div className='inv-name'>{item.name}</div>
                    <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap'}}>
                      {item.category&&<span className='badge badge-blue'>{item.category}</span>}
                      {item.sku&&<span className='inv-meta'>SKU: {item.sku}</span>}
                      {item.supplier&&<span className='inv-meta'>ðŸ“¦ {item.supplier}</span>}
                      {item.unitCost&&<span className='inv-meta'>â‚¬{item.unitCost}/unit</span>}
                    </div>
                    {item.notes&&<div style={{marginTop:'4px',fontSize:'11px',color:'#475569'}}>{item.notes}</div>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                    <button className='stock-btn' onClick={()=>adjustStock(item.id,-1)}>âˆ’</button>
                    <div className='inv-qty' style={{color:item.quantity<=item.minStock?'#f87171':item.quantity<=item.minStock*2?'#fbbf24':'#4ade80'}}>{item.quantity}</div>
                    <button className='stock-btn' onClick={()=>adjustStock(item.id,1)}>+</button>
                  </div>
                  <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                    {item.quantity<=item.minStock&&<span className='badge badge-red'>Low</span>}
                    <button className='btn-sm' onClick={()=>editItem(item)}>Edit</button>
                    <button className='btn-sm red' onClick={()=>deleteItem(item.id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ CALENDAR â”€â”€ */}
      {tab==='calendar'&&(
        <div className='page'>
          <div className='ticket-stats'>
            <div className='ticket-card'><div className='stat-label'>Total Appointments</div><div className='stat-value' style={{color:'#c084fc'}}>{appointments.length}</div></div>
            <div className='ticket-card'><div className='stat-label'>Today</div><div className='stat-value' style={{color:'#60a5fa'}}>{todayAppts}</div></div>
            <div className='ticket-card'><div className='stat-label'>Scheduled</div><div className='stat-value' style={{color:'#fbbf24'}}>{appointments.filter(a=>a.status==='Scheduled').length}</div></div>
            <div className='ticket-card'><div className='stat-label'>Confirmed</div><div className='stat-value' style={{color:'#4ade80'}}>{appointments.filter(a=>a.status==='Confirmed').length}</div></div>
          </div>
          <div className='export-bar'>
            <span className='export-label'>Export:</span>
            <button className='btn-sm green' onClick={()=>exportToXLSX(appointments,'Appointments','NNIT_Appointments.xlsx')}>â¬‡ Excel</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(appointments,'NNIT_Appointments.csv')}>â¬‡ CSV</button>
            <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
              <button className={'filter-btn'+(calView==='list'?' active':'')} onClick={()=>setCalView('list')}>List</button>
              <button className={'filter-btn'+(calView==='month'?' active':'')} onClick={()=>setCalView('month')}>Month</button>
            </div>
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>{editingApptId?'Edit Appointment':'Book Appointment'}</h3>
              <div className='form-field'>
                <label className='form-label'>Customer</label>
                <select className='form-select' value={apptForm.customerId} onChange={e=>{
                  const c=customers.find(c=>c.id===e.target.value);
                  setApptForm({...apptForm,customerId:e.target.value,customerName:c?.name??''});
                }}>
                  <option value=''>-- Select customer --</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='form-field'>
                <label className='form-label'>Link to Ticket</label>
                <select className='form-select' value={apptForm.ticketId} onChange={e=>setApptForm({...apptForm,ticketId:e.target.value})}>
                  <option value=''>-- No ticket --</option>
                  {tickets.map(t=><option key={t.id} value={t.id}>#{t.id.slice(-6)} Â· {t.fault.slice(0,30)}</option>)}
                </select>
              </div>
              <div className='form-field'><label className='form-label'>Date *</label><input className='form-input' type='date' value={apptForm.date} onChange={e=>setApptForm({...apptForm,date:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Time *</label><input className='form-input' type='time' value={apptForm.time} onChange={e=>setApptForm({...apptForm,time:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Duration (min)</label><select className='form-select' value={apptForm.duration} onChange={e=>setApptForm({...apptForm,duration:e.target.value})}><option value='30'>30 min</option><option value='60'>60 min</option><option value='90'>90 min</option><option value='120'>2 hours</option><option value='180'>3 hours</option></select></div>
              <div className='form-field'><label className='form-label'>Type</label><select className='form-select' value={apptForm.type} onChange={e=>setApptForm({...apptForm,type:e.target.value})}><option>Repair Drop-off</option><option>Repair Pickup</option><option>Diagnosis</option><option>Consultation</option><option>On-site Repair</option></select></div>
              <div className='form-field'><label className='form-label'>Status</label><select className='form-select' value={apptForm.status} onChange={e=>setApptForm({...apptForm,status:e.target.value as Appointment['status']})}><option>Scheduled</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Any notes...' value={apptForm.notes} onChange={e=>setApptForm({...apptForm,notes:e.target.value})}/></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className='btn-primary' style={{flex:1}} onClick={submitAppt}>{editingApptId?'Save Changes':'Book Appointment'}</button>
                {editingApptId&&<button className='btn-sm red' onClick={()=>{setEditingApptId(null);setApptForm(blankAppt);}}>Cancel</button>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {calView==='month'?(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <button className='btn-sm' onClick={()=>{const [y,m]=calMonth.split('-').map(Number);const d=new Date(y,m-2,1);setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}}>â€¹ Prev</button>
                    <span style={{fontWeight:700,color:'#f1f5f9',flex:1,textAlign:'center'}}>{new Date(calMonth+'-01').toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</span>
                    <button className='btn-sm' onClick={()=>{const [y,m]=calMonth.split('-').map(Number);const d=new Date(y,m,1);setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}}>Next â€º</button>
                  </div>
                  <div className='cal-header'>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className='cal-day-name'>{d}</div>)}
                  </div>
                  <div className='cal-grid'>
                    {calDays.map((day,i)=>{
                      const todayStr=new Date().toISOString().split('T')[0];
                      const [y,m]=calMonth.split('-').map(Number);
                      const dayStr=day?`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`:'';
                      const dayAppts=day?apptOnDay(day):[];
                      return(
                        <div key={i} className={`cal-cell${!day?' empty':''}${dayStr===todayStr?' today':''}`}>
                          {day&&<div className='cal-day-num' style={{color:dayStr===todayStr?'#60a5fa':'#475569'}}>{day}</div>}
                          {dayAppts.map(a=><div key={a.id} className='cal-appt-dot'>{a.time} {a.customerName}</div>)}
                        </div>
                      );
                    })}
                  </div>
                </>
              ):(
                appointments.length===0?(
                  <div className='cust-table-wrap'><div className='empty-msg' style={{padding:'32px'}}>No appointments yet. Book your first one.</div></div>
                ):appointments.sort((a,b)=>a.date.localeCompare(b.date)).map(a=>(
                  <div key={a.id} className='ticket-row'>
                    <div className='ticket-head'>
                      <span className='ticket-id'>#{a.id.slice(-6)}</span>
                      <span className='ticket-title'>{a.type} â€” {a.customerName||'No customer'}</span>
                      <span style={{background:apptStatusBg[a.status],color:apptStatusColor[a.status],padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:600}}>{a.status}</span>
                    </div>
                    <div className='ticket-meta'>
                      <span>ðŸ“… {a.date}</span>
                      <span>ðŸ• {a.time}</span>
                      <span>â± {a.duration} min</span>
                      {a.ticketId&&<span>ðŸŽ« Ticket #{a.ticketId.slice(-6)}</span>}
                    </div>
                    {a.notes&&<div style={{marginTop:'6px',fontSize:'11px',color:'#475569'}}>Notes: {a.notes}</div>}
                    <div className='ticket-actions'>
                      {a.status==='Scheduled'&&<button className='btn-sm green' onClick={()=>updateApptStatus(a.id,'Confirmed')}>Confirm</button>}
                      {a.status==='Confirmed'&&<button className='btn-sm purple' onClick={()=>updateApptStatus(a.id,'Completed')}>Complete</button>}
                      {a.status!=='Cancelled'&&a.status!=='Completed'&&<button className='btn-sm red' onClick={()=>updateApptStatus(a.id,'Cancelled')}>Cancel</button>}
                      <button className='btn-sm' onClick={()=>editAppt(a)}>Edit</button>
                      <button className='btn-sm wa' onClick={()=>sendApptWA(a)}>ðŸ“± WA Reminder</button>
                      <button className='btn-sm red' onClick={()=>deleteAppt(a.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ ANALYTICS â”€â”€ */}
      {tab==='analytics'&&(
        <div className='page'>
          {/* Full export */}
          <div className='export-bar'>
            <span className='export-label'>Export All Data:</span>
            <button className='btn-primary' onClick={exportAllXLSX}>â¬‡ Download Full Excel Export</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(customers,'NNIT_Customers.csv')}>Customers CSV</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(tickets,'NNIT_Tickets.csv')}>Tickets CSV</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(invoices,'NNIT_Invoices.csv')}>Invoices CSV</button>
            <button className='btn-sm gray' onClick={()=>exportToCSV(inventory,'NNIT_Inventory.csv')}>Inventory CSV</button>
          </div>
          <div className='analytics-grid'>
            <div className='analytics-card'>
              <div className='analytics-label'>Total Revenue</div>
              <div className='analytics-value' style={{color:'#4ade80'}}>â‚¬{totalRevenue.toFixed(2)}</div>
              <div className='analytics-sub'>From paid invoices</div>
            </div>
            <div className='analytics-card'>
              <div className='analytics-label'>Pending Revenue</div>
              <div className='analytics-value' style={{color:'#fbbf24'}}>â‚¬{pendingRevenue.toFixed(2)}</div>
              <div className='analytics-sub'>Draft + Sent invoices</div>
            </div>
            <div className='analytics-card'>
              <div className='analytics-label'>Total Customers</div>
              <div className='analytics-value' style={{color:'#60a5fa'}}>{customers.length}</div>
              <div className='analytics-sub'>Registered</div>
            </div>
            <div className='analytics-card'>
              <div className='analytics-label'>Total Tickets</div>
              <div className='analytics-value' style={{color:'#c084fc'}}>{tickets.length}</div>
              <div className='analytics-sub'>{activeTickets} active</div>
            </div>
            <div className='analytics-card'>
              <div className='analytics-label'>Invoices Issued</div>
              <div className='analytics-value' style={{color:'#60a5fa'}}>{invoices.length}</div>
              <div className='analytics-sub'>{invoices.filter(i=>i.status==='Paid').length} paid</div>
            </div>
            <div className='analytics-card'>
              <div className='analytics-label'>Stock Value</div>
              <div className='analytics-value' style={{color:'#4ade80',fontSize:'22px'}}>â‚¬{inventoryValue.toFixed(2)}</div>
              <div className='analytics-sub'>{inventory.length} item types</div>
            </div>
          </div>
          <div className='panels'>
            <div className='panel'>
              <div className='panel-head'><span className='panel-title'>Tickets by Status</span></div>
              <div className='panel-body'>
                {tickets.length===0?<div className='empty-msg'>No ticket data yet.</div>:(
                  <div className='bar-chart'>
                    {ticketsByStatus.map(({status,count})=>{
                      const max=Math.max(...ticketsByStatus.map(x=>x.count),1);
                      return(
                        <div key={status} className='bar-row'>
                          <span className='bar-label'>{status}</span>
                          <div className='bar-bg'><div className='bar-fill' style={{width:(count/max*100)+'%',background:statusColor[status]}}/></div>
                          <span className='bar-val'>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className='panel'>
              <div className='panel-head'><span className='panel-title'>Top Devices Repaired</span></div>
              <div className='panel-body'>
                {topDevices.length===0?<div className='empty-msg'>No ticket data yet.</div>:(
                  <div className='bar-chart'>
                    {topDevices.map(([device,count])=>{
                      const max=Math.max(...topDevices.map(x=>x[1]),1);
                      return(
                        <div key={device} className='bar-row'>
                          <span className='bar-label'>{device}</span>
                          <div className='bar-bg'><div className='bar-fill' style={{width:(count/max*100)+'%'}}/></div>
                          <span className='bar-val'>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className='panel'>
              <div className='panel-head'><span className='panel-title'>Invoice Breakdown</span></div>
              <div className='panel-body'>
                {invoices.length===0?<div className='empty-msg'>No invoice data yet.</div>:(
                  <div className='bar-chart'>
                    {(['Draft','Sent','Paid','Overdue'] as const).map(s=>{
                      const count=invoices.filter(i=>i.status===s).length;
                      const max=Math.max(invoices.length,1);
                      return(
                        <div key={s} className='bar-row'>
                          <span className='bar-label'>{s}</span>
                          <div className='bar-bg'><div className='bar-fill' style={{width:(count/max*100)+'%',background:invStatusColor[s]}}/></div>
                          <span className='bar-val'>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className='panel'>
              <div className='panel-head'><span className='panel-title'>Low Stock Items</span></div>
              <div className='panel-body'>
                {lowStockItems.length===0?<div className='empty-msg' style={{color:'#4ade80'}}>âœ“ All stock levels healthy.</div>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {lowStockItems.map(item=>(
                      <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'#450a0a',borderRadius:'6px'}}>
                        <span style={{fontSize:'12px',color:'#f87171',fontWeight:600}}>{item.name}</span>
                        <span style={{fontSize:'12px',color:'#fca5a5'}}>{item.quantity} / {item.minStock} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



