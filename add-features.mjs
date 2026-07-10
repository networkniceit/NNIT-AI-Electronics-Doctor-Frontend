import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("./src/App.tsx", "utf8");

// 1. Add new types to Tab
src = src.replace(
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar' | 'ai_chat';`,
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar' | 'ai_chat' | 'warranty' | 'job_queue' | 'reports';`
);

// 2. Add new interfaces after Appointment
src = src.replace(
  `type Tab = 'dashboard'`,
  `interface Warranty {
  id: number; ticket_id: string; customer_name: string; device: string;
  serial_number: string; warranty_type: string; start_date: string;
  end_date: string; status: string; notes: string; created_at: string;
}
interface JobQueueItem {
  id: number; ticket_id: string; customer_name: string; device: string;
  fault: string; assigned_to: string; priority: string; status: string;
  estimated_time: string; parts_used: string; labour_minutes: number;
  notes: string; created_at: string; updated_at: string;
}

type Tab = 'dashboard'`
);

// 3. Add state after chatEndRef
src = src.replace(
  `  // Save helpers`,
  `  // Warranty state
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [warrantyForm, setWarrantyForm] = useState({ ticket_id:'', customer_name:'', device:'', serial_number:'', warranty_type:'Repair Warranty', start_date:'', end_date:'', notes:'' });

  async function loadWarranties() {
    try { const r = await axios.get(\`\${API}/ai/warranty\`); setWarranties(r.data); } catch {}
  }
  async function submitWarranty() {
    if (!warrantyForm.customer_name.trim()) { notify('Customer name required','error'); return; }
    try {
      await axios.post(\`\${API}/ai/warranty\`, warrantyForm);
      notify('Warranty created.'); loadWarranties();
      setWarrantyForm({ ticket_id:'', customer_name:'', device:'', serial_number:'', warranty_type:'Repair Warranty', start_date:'', end_date:'', notes:'' });
    } catch { notify('Failed to create warranty','error'); }
  }
  async function deleteWarranty(id: number) {
    if (!confirm('Delete warranty?')) return;
    try { await axios.delete(\`\${API}/ai/warranty/\${id}\`); notify('Warranty deleted.','warning'); loadWarranties(); } catch {}
  }

  // Job Queue state
  const [jobs, setJobs] = useState<JobQueueItem[]>([]);
  const [jobForm, setJobForm] = useState({ ticket_id:'', customer_name:'', device:'', fault:'', assigned_to:'', priority:'Medium', status:'Queued', estimated_time:'', parts_used:'', labour_minutes:0, notes:'' });

  async function loadJobs() {
    try { const r = await axios.get(\`\${API}/ai/jobs/queue\`); setJobs(r.data); } catch {}
  }
  async function submitJob() {
    if (!jobForm.customer_name.trim()) { notify('Customer name required','error'); return; }
    try {
      await axios.post(\`\${API}/ai/jobs/queue\`, jobForm);
      notify('Job added to queue.'); loadJobs();
      setJobForm({ ticket_id:'', customer_name:'', device:'', fault:'', assigned_to:'', priority:'Medium', status:'Queued', estimated_time:'', parts_used:'', labour_minutes:0, notes:'' });
    } catch { notify('Failed to add job','error'); }
  }
  async function updateJobStatus(id: number, status: string) {
    try { await axios.patch(\`\${API}/ai/jobs/queue/\${id}/status?status=\${encodeURIComponent(status)}\`); notify(\`Job \${status}.\`); loadJobs(); } catch {}
  }
  async function deleteJob(id: number) {
    if (!confirm('Delete job?')) return;
    try { await axios.delete(\`\${API}/ai/jobs/queue/\${id}\`); notify('Job deleted.','warning'); loadJobs(); } catch {}
  }

  // Reports state
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [ticketReport, setTicketReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);

  async function loadReports() {
    try {
      const [rev, tkt, inv] = await Promise.all([
        axios.get(\`\${API}/ai/reports/revenue\`),
        axios.get(\`\${API}/ai/reports/tickets\`),
        axios.get(\`\${API}/ai/reports/inventory\`)
      ]);
      setRevenueReport(rev.data); setTicketReport(tkt.data); setInventoryReport(inv.data);
    } catch { notify('Failed to load reports','error'); }
  }

  // Save helpers`
);

// 4. Load data on tab change - add after useEffect loadData
src = src.replace(
  `  useEffect(() => { loadData(); }, []);`,
  `  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (tab === 'warranty') loadWarranties();
    if (tab === 'job_queue') loadJobs();
    if (tab === 'reports') loadReports();
  }, [tab]);`
);

// 5. Add new tab buttons after AI Assistant tab
src = src.replace(
  `        <button className={'tab'+(tab==='ai_chat'?' active':'')} onClick={()=>setTab('ai_chat')}>🤖 AI Assistant</button>`,
  `        <button className={'tab'+(tab==='ai_chat'?' active':'')} onClick={()=>setTab('ai_chat')}>🤖 AI Assistant</button>
        <button className={'tab'+(tab==='warranty'?' active':'')} onClick={()=>setTab('warranty')}>🛡 Warranty</button>
        <button className={'tab'+(tab==='job_queue'?' active':'')} onClick={()=>setTab('job_queue')}>⚙ Job Queue</button>
        <button className={'tab'+(tab==='reports'?' active':'')} onClick={()=>setTab('reports')}>📊 Reports</button>`
);

// 6. Add WARRANTY tab panel before ANALYTICS
src = src.replace(
  `      {/* ── ANALYTICS ── */}`,
  `      {/* ── WARRANTY ── */}
      {tab==='warranty'&&(
        <div className='page'>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>Add Warranty</h3>
              <div className='form-field'><label className='form-label'>Customer Name *</label><input className='form-input' placeholder='Customer' value={warrantyForm.customer_name} onChange={e=>setWarrantyForm({...warrantyForm,customer_name:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device</label><input className='form-input' placeholder='e.g. Samsung Galaxy S23' value={warrantyForm.device} onChange={e=>setWarrantyForm({...warrantyForm,device:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Serial Number</label><input className='form-input' placeholder='Serial / IMEI' value={warrantyForm.serial_number} onChange={e=>setWarrantyForm({...warrantyForm,serial_number:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Warranty Type</label><select className='form-select' value={warrantyForm.warranty_type} onChange={e=>setWarrantyForm({...warrantyForm,warranty_type:e.target.value})}><option>Repair Warranty</option><option>Manufacturer Warranty</option><option>Extended Warranty</option><option>Parts Warranty</option></select></div>
              <div className='form-field'><label className='form-label'>Start Date</label><input className='form-input' type='date' value={warrantyForm.start_date} onChange={e=>setWarrantyForm({...warrantyForm,start_date:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>End Date</label><input className='form-input' type='date' value={warrantyForm.end_date} onChange={e=>setWarrantyForm({...warrantyForm,end_date:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Ticket ID</label><input className='form-input' placeholder='Linked ticket ID' value={warrantyForm.ticket_id} onChange={e=>setWarrantyForm({...warrantyForm,ticket_id:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Notes...' value={warrantyForm.notes} onChange={e=>setWarrantyForm({...warrantyForm,notes:e.target.value})}/></div>
              <button className='btn-primary' onClick={submitWarranty}>Add Warranty</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                <div className='ticket-card'><div className='stat-label'>Total</div><div className='stat-value' style={{color:'#60a5fa'}}>{warranties.length}</div></div>
                <div className='ticket-card'><div className='stat-label'>Active</div><div className='stat-value' style={{color:'#4ade80'}}>{warranties.filter(w=>w.status==='Active').length}</div></div>
                <div className='ticket-card'><div className='stat-label'>Expired</div><div className='stat-value' style={{color:'#f87171'}}>{warranties.filter(w=>w.status==='Expired').length}</div></div>
              </div>
              {warranties.length===0?<div className='cust-table-wrap'><div className='empty-msg' style={{padding:32}}>No warranties yet.</div></div>:
              warranties.map(w=>(
                <div key={w.id} className='ticket-row'>
                  <div className='ticket-head'>
                    <span className='ticket-id'>#{w.id}</span>
                    <span className='ticket-title'>{w.customer_name} — {w.device}</span>
                    <span style={{background:w.status==='Active'?'#14532d':'#450a0a',color:w.status==='Active'?'#4ade80':'#f87171',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600}}>{w.status}</span>
                  </div>
                  <div className='ticket-meta'>
                    <span>🛡 {w.warranty_type}</span>
                    {w.serial_number&&<span>📱 {w.serial_number}</span>}
                    {w.start_date&&<span>📅 {w.start_date} → {w.end_date}</span>}
                  </div>
                  {w.notes&&<div style={{fontSize:11,color:'#475569',marginTop:4}}>{w.notes}</div>}
                  <div className='ticket-actions'>
                    <button className='btn-sm red' onClick={()=>deleteWarranty(w.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── JOB QUEUE ── */}
      {tab==='job_queue'&&(
        <div className='page'>
          <div className='ticket-stats'>
            {['Queued','In Progress','Completed','On Hold'].map(s=>(
              <div key={s} className='ticket-card'>
                <div className='stat-label'>{s}</div>
                <div className='stat-value' style={{color:s==='Queued'?'#60a5fa':s==='In Progress'?'#fbbf24':s==='Completed'?'#4ade80':'#f87171'}}>{jobs.filter(j=>j.status===s).length}</div>
              </div>
            ))}
          </div>
          <div className='cust-layout'>
            <div className='cust-form'>
              <h3>Add to Job Queue</h3>
              <div className='form-field'><label className='form-label'>Customer Name *</label><input className='form-input' placeholder='Customer' value={jobForm.customer_name} onChange={e=>setJobForm({...jobForm,customer_name:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Device</label><input className='form-input' placeholder='Device' value={jobForm.device} onChange={e=>setJobForm({...jobForm,device:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Fault</label><input className='form-input' placeholder='Fault description' value={jobForm.fault} onChange={e=>setJobForm({...jobForm,fault:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Assigned To</label><input className='form-input' placeholder='Technician name' value={jobForm.assigned_to} onChange={e=>setJobForm({...jobForm,assigned_to:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Priority</label><select className='form-select' value={jobForm.priority} onChange={e=>setJobForm({...jobForm,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
              <div className='form-field'><label className='form-label'>Est. Time</label><input className='form-input' placeholder='e.g. 2 hours' value={jobForm.estimated_time} onChange={e=>setJobForm({...jobForm,estimated_time:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Parts Used</label><input className='form-input' placeholder='Parts used...' value={jobForm.parts_used} onChange={e=>setJobForm({...jobForm,parts_used:e.target.value})}/></div>
              <div className='form-field'><label className='form-label'>Labour (min)</label><input className='form-input' type='number' value={jobForm.labour_minutes} onChange={e=>setJobForm({...jobForm,labour_minutes:parseInt(e.target.value)||0})}/></div>
              <div className='form-field'><label className='form-label'>Notes</label><input className='form-input' placeholder='Notes...' value={jobForm.notes} onChange={e=>setJobForm({...jobForm,notes:e.target.value})}/></div>
              <button className='btn-primary' onClick={submitJob}>Add to Queue</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {jobs.length===0?<div className='cust-table-wrap'><div className='empty-msg' style={{padding:32}}>No jobs in queue.</div></div>:
              jobs.map(j=>(
                <div key={j.id} className='ticket-row'>
                  <div className='ticket-head'>
                    <span className='ticket-id'>#{j.id}</span>
                    <span className='ticket-title'>{j.customer_name} — {j.device}</span>
                    <span style={{background:j.status==='Completed'?'#14532d':j.status==='In Progress'?'#422006':j.status==='On Hold'?'#450a0a':'#1e3a5f',color:j.status==='Completed'?'#4ade80':j.status==='In Progress'?'#fbbf24':j.status==='On Hold'?'#f87171':'#60a5fa',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600}}>{j.status}</span>
                  </div>
                  <div className='ticket-meta'>
                    <span>🔧 {j.fault}</span>
                    {j.assigned_to&&<span>👤 {j.assigned_to}</span>}
                    {j.estimated_time&&<span>⏱ {j.estimated_time}</span>}
                    {j.parts_used&&<span>🔩 {j.parts_used}</span>}
                    <span style={{color:j.priority==='High'||j.priority==='Urgent'?'#f87171':j.priority==='Medium'?'#fbbf24':'#4ade80'}}>● {j.priority}</span>
                  </div>
                  <div className='ticket-actions'>
                    {j.status==='Queued'&&<button className='btn-sm yellow' onClick={()=>updateJobStatus(j.id,'In Progress')}>Start</button>}
                    {j.status==='In Progress'&&<button className='btn-sm green' onClick={()=>updateJobStatus(j.id,'Completed')}>Complete</button>}
                    {j.status!=='On Hold'&&j.status!=='Completed'&&<button className='btn-sm gray' onClick={()=>updateJobStatus(j.id,'On Hold')}>Hold</button>}
                    <button className='btn-sm red' onClick={()=>deleteJob(j.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab==='reports'&&(
        <div className='page'>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
            <button className='btn-primary' onClick={loadReports}>🔄 Refresh Reports</button>
          </div>
          {revenueReport&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
              <div className='analytics-card'><div className='analytics-label'>Total Revenue</div><div className='analytics-value' style={{color:'#4ade80'}}>€{revenueReport.total_revenue}</div><div className='analytics-sub'>Paid invoices</div></div>
              <div className='analytics-card'><div className='analytics-label'>Pending Revenue</div><div className='analytics-value' style={{color:'#fbbf24'}}>€{revenueReport.pending_revenue}</div><div className='analytics-sub'>Draft + Sent</div></div>
              <div className='analytics-card'><div className='analytics-label'>Overdue</div><div className='analytics-value' style={{color:'#f87171'}}>€{revenueReport.overdue_revenue}</div><div className='analytics-sub'>Overdue invoices</div></div>
            </div>
          )}
          <div className='panels'>
            {revenueReport&&(
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>📊 Invoice Breakdown</span></div>
                <div className='panel-body'>
                  <div className='bar-chart'>
                    {revenueReport.by_status?.map((s:any)=>{
                      const max = Math.max(...(revenueReport.by_status||[]).map((x:any)=>x.count),1);
                      return <div key={s.status} className='bar-row'>
                        <span className='bar-label'>{s.status}</span>
                        <div className='bar-bg'><div className='bar-fill' style={{width:(s.count/max*100)+'%'}}/></div>
                        <span className='bar-val'>{s.count}</span>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
            )}
            {ticketReport&&(
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>🎫 Ticket Report</span></div>
                <div className='panel-body'>
                  <div style={{marginBottom:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:7,padding:'10px 12px'}}><div style={{fontSize:10,color:'#475569',textTransform:'uppercase'}}>Total Tickets</div><div style={{fontSize:22,fontWeight:700,color:'#c084fc'}}>{ticketReport.total_tickets}</div></div>
                  </div>
                  <div className='bar-chart'>
                    {ticketReport.top_devices?.map((d:any)=>{
                      const max = Math.max(...(ticketReport.top_devices||[]).map((x:any)=>x.count),1);
                      return <div key={d.device} className='bar-row'>
                        <span className='bar-label'>{d.device||'Unknown'}</span>
                        <div className='bar-bg'><div className='bar-fill' style={{width:(d.count/max*100)+'%'}}/></div>
                        <span className='bar-val'>{d.count}</span>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
            )}
            {inventoryReport&&(
              <div className='panel'>
                <div className='panel-head'><span className='panel-title'>📦 Inventory Report</span></div>
                <div className='panel-body'>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    <div style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:7,padding:'10px 12px'}}><div style={{fontSize:10,color:'#475569',textTransform:'uppercase'}}>Stock Value</div><div style={{fontSize:18,fontWeight:700,color:'#4ade80'}}>€{inventoryReport.stock_value}</div></div>
                    <div style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:7,padding:'10px 12px'}}><div style={{fontSize:10,color:'#475569',textTransform:'uppercase'}}>Low Stock</div><div style={{fontSize:18,fontWeight:700,color:inventoryReport.low_stock?.length>0?'#f87171':'#4ade80'}}>{inventoryReport.low_stock?.length||0}</div></div>
                  </div>
                  {inventoryReport.low_stock?.length>0&&(
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {inventoryReport.low_stock.map((i:any)=>(
                        <div key={i.name} style={{background:'#450a0a',borderRadius:6,padding:'6px 10px',display:'flex',justifyContent:'space-between'}}>
                          <span style={{color:'#f87171',fontSize:12,fontWeight:600}}>{i.name}</span>
                          <span style={{color:'#fca5a5',fontSize:12}}>{i.quantity}/{i.min} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!revenueReport&&!ticketReport&&!inventoryReport&&(
              <div className='panel panel-full'><div className='panel-body'><div className='empty-msg' style={{padding:40}}>Click Refresh Reports to load data.</div></div></div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}`
);

writeFileSync("./src/App.tsx", src, "utf8");
console.log("All feature tabs added OK");
