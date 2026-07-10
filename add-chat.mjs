import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("./src/App.tsx", "utf8");

// 1. Add 'ai_chat' to Tab type
src = src.replace(
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar';`,
  `type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'inventory' | 'analytics' | 'calendar' | 'ai_chat';`
);

// 2. Add chat state after appointment state
src = src.replace(
  `  // Save helpers`,
  `  // AI Chat state
  const [chatMessages, setChatMessages] = useState<{role:'user'|'assistant';content:string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatDevice, setChatDevice] = useState('');
  const [chatFault, setChatFault] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function sendChatMessage() {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user' as const, content: chatInput };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post(\`\${API}/ai/chat\`, {
        message: chatInput,
        device: chatDevice,
        fault: chatFault,
        history: chatMessages.slice(-10)
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'AI service unavailable. Check your GROQ_API_KEY in Railway.' }]);
    }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  // Save helpers`
);

// 3. Add AI Chat tab button after Analytics tab
src = src.replace(
  `        <button className={'tab'+(tab==='analytics'?' active':'')} onClick={()=>setTab('analytics')}>Analytics</button>`,
  `        <button className={'tab'+(tab==='analytics'?' active':'')} onClick={()=>setTab('analytics')}>Analytics</button>
        <button className={'tab'+(tab==='ai_chat'?' active':'')} onClick={()=>setTab('ai_chat')}>🤖 AI Assistant</button>`
);

// 4. Add AI Chat panel before closing tag
src = src.replace(
  `      {/* ── ANALYTICS ── */}`,
  `      {/* ── AI CHAT ── */}
      {tab==='ai_chat'&&(
        <div className='page'>
          <div style={{background:'#111827',border:'1px solid #1e2d40',borderRadius:10,padding:20,display:'flex',flexDirection:'column',gap:12,maxWidth:800}}>
            <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9'}}>🤖 NNIT AI Repair Assistant</div>
            <p style={{fontSize:12,color:'#64748b'}}>Powered by Groq · llama-3.3-70b-versatile — Ask anything about electronics repair, faults, parts, or costs.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div className='form-field'><label className='form-label'>Device (optional)</label><input className='form-input' placeholder='e.g. Samsung Galaxy S23' value={chatDevice} onChange={e=>setChatDevice(e.target.value)}/></div>
              <div className='form-field'><label className='form-label'>Fault (optional)</label><input className='form-input' placeholder='e.g. Cracked screen' value={chatFault} onChange={e=>setChatFault(e.target.value)}/></div>
            </div>
            <div style={{background:'#0d1525',border:'1px solid #1a2740',borderRadius:8,padding:16,minHeight:320,maxHeight:480,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
              {chatMessages.length===0&&<div style={{color:'#475569',fontSize:13,textAlign:'center',marginTop:60}}>👋 Hi! Ask me anything about electronics repair.</div>}
              {chatMessages.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:10,background:m.role==='user'?'#1e3a5f':'#1e293b',color:m.role==='user'?'#60a5fa':'#e2e8f0',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{fontSize:10,color:'#475569',marginBottom:4}}>🤖 NNIT AI</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading&&<div style={{display:'flex',justifyContent:'flex-start'}}><div style={{background:'#1e293b',padding:'10px 14px',borderRadius:10,fontSize:13,color:'#475569'}}>🤖 Thinking...</div></div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <input className='form-input' style={{flex:1}} placeholder='Ask about repair, fault diagnosis, parts, costs...' value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChatMessage()}/>
              <button className='btn-primary' onClick={sendChatMessage} disabled={chatLoading} style={{opacity:chatLoading?0.6:1}}>Send</button>
              <button className='btn-sm gray' onClick={()=>setChatMessages([])}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}`
);

writeFileSync("./src/App.tsx", src, "utf8");
console.log("AI Chat tab added OK");
