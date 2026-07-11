import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("./src/App.tsx", "utf8");

// 1. Add new tabs to Tab type
src = src.replace(
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar' | 'ai_chat' | 'warranty' | 'job_queue' | 'reports';`,
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar' | 'ai_chat' | 'warranty' | 'job_queue' | 'reports' | 'device_history' | 'settings';`
);

// 2. Add state for device history and settings after reports state
src = src.replace(
  `  // Save helpers`,
  `  // Device History state
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyForm, setHistoryForm] = useState({ customer_name:'', device:'', event_type:'Repair', description:'', cost:0, technician:'', ticket_id:'' });

  async function loadDeviceHistory(search?: string) {
    try {
      const url = search ? \`\${API}/ai/device-history?customer_name=\${encodeURIComponent(search)}\` : \`\${API}/ai/device-history\`;
      const r = await axios.get(url);
      setDeviceHistory(r.data);
    } catch {}
  }
  async function submitHistory() {
    if (!historyForm.customer_name.trim() || !historyForm.description.trim()) { notify('Customer and description required','error'); return; }
    try {
      await axios.post(\`\${API}/ai/device-history\`, historyForm);
      notify('History event added.'); loadDeviceHistory();
      setHistoryForm({ customer_name:'', device:'', event_type:'Repair', description:'', cost:0, technician:'', ticket_id:'' });
    } catch { notify('Failed to add history','error'); }
  }
  async function deleteHistory(id: number) {
    if (!confirm('Delete history entry?')) return;
    try { await axios.delete(\`\${API}/ai/device-history/\${id}\`); notify('Deleted.','warning'); loadDeviceHistory(); } catch {}
  }

  // Settings / Password state
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm_password:'' });
  const [pwLoading, setPwLoading] = useState(false);

  async function changePassword() {
    if (!pwForm.current_password || !pwForm.new_password) { notify('All fields required','error'); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { notify('Passwords do not match','error'); return; }
    if (pwForm.new_password.length < 6) { notify('Password must be at least 6 characters','error'); return; }
    setPwLoading(true);
    try {
      await axios.post(\`\${API}/ai/auth/change-password\`, { username: authUser, current_password: pwForm.current_password, new_password: pwForm.new_password });
      notify('Password changed successfully!','success');
      setPwForm({ current_password:'', new_password:'', confirm_password:'' });
    } catch(e: any) {
      notify(e?.response?.data?.detail ?? 'Failed to change password','error');
    }
    setPwLoading(false);
  }

  // Stock deduction
  async function deductStock(itemId: string, quantity: number = 1) {
    try {
      const r = await axios.patch(\`\${API}/ai/inventory/deduct/\${itemId}?quantity=\${quantity}\`);
      if (r.data.low_stock_alert) notify(\`⚠ Low stock: \${r.data.item_name} (\${r.data.new_quantity} left)\`,'warning');
      else notify(\`Stock deducted: \${r.data.item_name}\`,'success');
    } catch { notify('Stock deduction failed','error'); }
  }
  async function restockItem(itemId: string, quantity: number = 1) {
    try {
      const r = await axios.patch(\`\${API}/ai/inventory/restock/\${itemId}?quantity=\${quantity}\`);
      notify(\`Restocked: \${r.data.item_name} (+\${quantity})\`,'success');
    } catch { notify('Restock failed','error'); }
  }

  // Save helpers`
);

// 3. Add useEffect for new tabs
src = src.replace(
  `  useEffect(() => {
    if (tab === 'warranty') loadWarranties();
    if (tab === 'job_queue') loadJobs();
    if (tab === 'reports') loadReports();
  }, [tab]);`,
  `  useEffect(() => {
    if (tab === 'warranty') loadWarranties();
    if (tab === 'job_queue') loadJobs();
    if (tab === 'reports') loadReports();
    if (tab === 'device_history') loadDeviceHistory();
  }, [tab]);`
);

// 4. Add tab buttons
src = src.replace(
  `        <button className={'tab'+(tab==='reports'?' active':'')} onClick={()=>setTab('reports')}>📊 Reports</button>`,
  `        <button className={'tab'+(tab==='reports'?' active':'')} onClick={()=>setTab('reports')}>📊 Reports</button>
        <button className={'tab'+(tab==='device_history'?' active':'')} onClick={()=>setTab('device_history')}>📱 Device History</button>
        <button className={'tab'+(tab==='settings'?' active':'')} onClick={()=>setTab('settings')}>⚙ Settings</button>`
);

// 5. Add DEVICE HISTORY and SETTINGS panels before ANALYTICS
src = src.replace(
  `      {/* ── ANALYTICS ── */}`,
  `      {/* ── DEVICE HISTORY ── */}
      {tab==='device_history'&&(
        <div className='page'>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>Add History Event</h3>
              <div className='form-field'><label className='form-label'>Customer Name *</label>
                <select className='form-select' value={historyForm.customer_name} onChange={e=>setHistoryForm({...historyForm,customer_name:e.target.value})}>
                  <option value=''>-- Select customer --</option>
                  {customers.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className='form-field'><label className='form-label'>Device</label><input className='form-input' placeholder='e.g. Samsung Galaxy S23' value={historyForm.device} onChange={e=>setHistoryForm({...historyForm,device:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Event Type</label>
                <select className='form-select' value={historyForm.event_type} onChange={e=>setHistoryForm({...historyForm,event_type:e.target.value})}>
                  <option>Repair</option><option>Diagnosis</option><option>Part Replaced</option><option>Software Update</option><option>Water Damage</option><option>Screen Replacement</option><option>Battery Replacement</option><option>Warranty Claim</option><option>Inspection</option>
                </select>
              </div>
              <div className='form-field'><label className='form-label'>Description *</label><input className='form-input' placeholder='What was done...' value={historyForm.description} onChange={e=>setHistoryForm({...historyForm,description:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Cost (€)</label><input className='form-input' type='number' value={historyForm.cost} onChange={e=>setHistoryForm({...historyForm,cost:parseFloat(e.target.value)||0})}/></div>
              <div className='form-field'><label className='form-label'>Technician</label><input className='form-input' placeholder='Technician name' value={historyForm.technician} onChange={e=>setHistoryForm({...historyForm,technician:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Ticket ID</label><input className='form-input' placeholder='Linked ticket' value={historyForm.ticket_id} onChange={e=>setHistoryForm({...historyForm,ticket_id:e.target.value})}/></div>
              <button className='btn-primary' onClick={submitHistory}>Add Event</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',gap:8}}>
                <input className='search-input' style={{flex:1}} placeholder='Search by customer name...' value={historySearch} onChange={e=>setHistorySearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDeviceHistory(historySearch)}/>
                <button className='btn-sm green' onClick={()=>loadDeviceHistory(historySearch)}>Search</button>
                <button className='btn-sm gray' onClick={()=>{setHistorySearch('');loadDeviceHistory();}}>All</button>
              </div>
              <div style={{background:'#111827',border:'1px solid #1e2d40',borderRadius:10,padding:'8px 0',fontSize:12,color:'#64748b',textAlign:'center'}}>{deviceHistory.length} event{deviceHistory.length!==1?'s':''} found</div>
              {deviceHistory.length===0?<div className='cust-table-wrap'><div className='empty-msg' style={{padding:32}}>No history events yet.</div></div>:
              deviceHistory.map(h=>(
                <div key={h.id} className='ticket-row'>
                  <div className='ticket-head'>
                    <span className='ticket-id'>#{h.id}</span>
                    <span className='ticket-title'>{h.customer_name} — {h.device}</span>
                    <span style={{background:'#1e3a5f',color:'#60a5fa',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600}}>{h.event_type}</span>
                  </div>
                  <div style={{fontSize:13,color:'#e2e8f0',margin:'6px 0'}}>{h.description}</div>
                  <div className='ticket-meta'>
                    {h.cost>0&&<span>💰 €{h.cost}</span>}
                    {h.technician&&<span>👤 {h.technician}</span>}
                    {h.ticket_id&&<span>🎫 #{h.ticket_id}</span>}
                    <span>🕐 {h.created_at}</span>
                  </div>
                  <div className='ticket-actions'>
                    <button className='btn-sm red' onClick={()=>deleteHistory(h.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab==='settings'&&(
        <div className='page'>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
            {/* Change Password */}
            <div className='cust-form'>
              <h3>🔑 Change Password</h3>
              <p style={{fontSize:12,color:'#64748b',marginBottom:4}}>Logged in as: <strong style={{color:'#60a5fa'}}>{authUser}</strong></p>
              <div className='form-field'><label className='form-label'>Current Password</label><input className='form-input' type='password' placeholder='Current password' value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>New Password</label><input className='form-input' type='password' placeholder='New password (min 6 chars)' value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Confirm New Password</label><input className='form-input' type='password' placeholder='Confirm new password' value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})}/></div>
              <button className='btn-primary' onClick={changePassword} disabled={pwLoading} style={{opacity:pwLoading?0.6:1}}>{pwLoading?'Changing...':'Change Password'}</button>
            </div>
            {/* Stock Management */}
            <div className='cust-form'>
              <h3>📦 Quick Stock Management</h3>
              <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Deduct or restock inventory items directly.</p>
              {inventory.length===0?<div className='empty-msg'>No inventory items yet.</div>:
              inventory.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid #1e2d40'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#f1f5f9'}}>{item.name}</div>
                    <div style={{fontSize:11,color:item.quantity<=item.minStock?'#f87171':'#4ade80'}}>{item.quantity} in stock</div>
                  </div>
                  <button className='btn-sm red' onClick={()=>deductStock(item.id,1)}>-1</button>
                  <button className='btn-sm green' onClick={()=>restockItem(item.id,1)}>+1</button>
                  <button className='btn-sm' onClick={()=>restockItem(item.id,10)}>+10</button>
                </div>
              ))}
            </div>
            {/* System Info */}
            <div className='cust-form'>
              <h3>ℹ System Info</h3>
              <div className='info-row'><span className='info-key'>Version</span><span className='info-val'>v1.0.0</span></div>
              <div className='info-row'><span className='info-key'>Backend</span><span className='info-val'><span className='badge badge-green'>Online</span></span></div>
              <div className='info-row'><span className='info-key'>User</span><span className='info-val'>{authUser}</span></div>
              <div className='info-row'><span className='info-key'>AI Model</span><span className='info-val'>llama-3.1-8b-instant</span></div>
              <div className='info-row'><span className='info-key'>Database</span><span className='info-val'>SQLite (Railway)</span></div>
              <div className='info-row'><span className='info-key'>Developed by</span><span className='info-val'>Network Nice IT (NNIT)</span></div>
              <div style={{marginTop:12}}>
                <button className='btn-sm red' onClick={onLogout} style={{width:'100%',padding:'8px'}}>Sign Out</button>
              </div>
            </div>
            {/* WhatsApp Config */}
            <div className='cust-form'>
              <h3>📱 WhatsApp Config</h3>
              <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Configure UltraMsg for WhatsApp notifications.</p>
              <div className='form-field'><label className='form-label'>Instance ID</label><input className='form-input' placeholder='instance12345' value={waApiKey} onChange={e=>setWaApiKey(e.target.value)}/></div>
              <div className='form-field'><label className='form-label'>API Token</label><input className='form-input' placeholder='your_token_here' value={waInstanceId} onChange={e=>setWaInstanceId(e.target.value)}/></div>
              <button className='btn-primary' onClick={()=>{localStorage.setItem("nnit_wa_key",waApiKey);localStorage.setItem("nnit_wa_instance",waInstanceId);notify("WhatsApp config saved!");}}>Save Config</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}`
);

writeFileSync("./src/App.tsx", src, "utf8");
console.log("Phase 3b frontend tabs added OK");
