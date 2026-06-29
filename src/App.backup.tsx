import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

export default function App() {
  const [home, setHome]           = useState<any>(null);
  const [scan, setScan]           = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [storage, setStorage]     = useState<any>(null);
  const [images, setImages]       = useState<any[]>([]);
  const [file, setFile]           = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [analysis, setAnalysis]   = useState<any>(null);
  const [reports, setReports]     = useState<any[]>([]);
  const [phone, setPhone]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [h, sc, dx, st, im, ph, rp] = await Promise.all([
        axios.get(`${API}/`),
        axios.get(`${API}/ai/device-scan`),
        axios.get(`${API}/ai/ai-diagnosis`),
        axios.get(`${API}/ai/storage`),
        axios.get(`${API}/ai/images`),
        axios.get(`${API}/ai/android-phone`),
        axios.get(`${API}/ai/report-history`),
      ]);
      setHome(h.data);
      setScan(sc.data);
      setDiagnosis(dx.data);
      setStorage(st.data);
      setImages(im.data);
      setPhone(ph.data);
      setReports(rp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile() {
    if (!file) { alert('Choose a file first'); return; }
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API}/ai/upload-file`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(res.data);
      loadData();
    } catch { alert('Upload failed'); }
  }

  async function analyzeFile(filename: string) {
    try {
      const res = await axios.get(`${API}/ai/smart-analyze/${encodeURIComponent(filename)}`);
      setAnalysis(res.data);
    } catch { alert('Analysis failed'); }
  }

  async function generateReport() {
    if (!analysis?.filename) { alert('Analyze a file first.'); return; }
    try {
      const res = await axios.get(`${API}/ai/repair-report/${encodeURIComponent(analysis.filename)}`);
      setAnalysis({ ...analysis, report: res.data });
    } catch { alert('Failed to generate repair report.'); }
  }

  async function viewReport(reportName: string) {
    try {
      const res = await axios.get(`${API}/ai/view-report/${encodeURIComponent(reportName)}`);
      setAnalysis({ report: res.data });
    } catch { alert('Failed to load report.'); }
  }

  function copyResult() {
    if (!analysis) return;
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    alert('Copied to clipboard.');
  }

  useEffect(() => { loadData(); }, []);

  const phoneOk = phone?.connection?.includes('device');

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #0b0f1a;
          color: #e2e8f0;
          min-height: 100vh;
        }

        /* ── TOPBAR ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background: #111827;
          border-bottom: 1px solid #1e2d40;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .topbar-logo {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .topbar-name {
          font-size: 15px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.3px;
        }
        .topbar-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
        }
        .topbar-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #22c55e;
        }
        .topbar-status::before {
          content: '';
          width: 7px; height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .btn-refresh {
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-refresh:hover { background: #273549; color: #e2e8f0; }

        /* ── LAYOUT ── */
        .dashboard {
          display: grid;
          grid-template-columns: 280px 1fr;
          grid-template-rows: auto;
          gap: 0;
          min-height: calc(100vh - 57px);
        }

        /* ── SIDEBAR ── */
        .sidebar {
          background: #111827;
          border-right: 1px solid #1e2d40;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-section { display: flex; flex-direction: column; gap: 4px; }
        .sidebar-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #475569;
          padding: 4px 8px;
          margin-bottom: 2px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 7px 8px;
          border-radius: 6px;
          gap: 8px;
        }
        .info-row:hover { background: #1a2332; }
        .info-key {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .info-val {
          font-size: 11px;
          color: #cbd5e1;
          text-align: right;
          word-break: break-all;
          max-width: 160px;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge-green  { background: #14532d; color: #4ade80; }
        .badge-red    { background: #450a0a; color: #f87171; }
        .badge-blue   { background: #1e3a5f; color: #60a5fa; }
        .badge-yellow { background: #422006; color: #fbbf24; }

        .divider {
          height: 1px;
          background: #1e2d40;
          margin: 4px 0;
        }

        /* ── MAIN ── */
        .main {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        /* ── STAT ROW ── */
        .stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .stat-card {
          background: #111827;
          border: 1px solid #1e2d40;
          border-radius: 10px;
          padding: 16px;
        }
        .stat-label { font-size: 11px; color: #64748b; margin-bottom: 6px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #f1f5f9; }
        .stat-sub   { font-size: 11px; color: #475569; margin-top: 3px; }

        /* ── PANELS ── */
        .panels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .panel {
          background: #111827;
          border: 1px solid #1e2d40;
          border-radius: 10px;
          overflow: hidden;
        }
        .panel-full { grid-column: 1 / -1; }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #1e2d40;
        }
        .panel-title {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-body { padding: 16px; }

        /* ── TABLE ── */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .data-table th {
          text-align: left;
          color: #475569;
          font-weight: 600;
          padding: 6px 10px;
          border-bottom: 1px solid #1e2d40;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .data-table td {
          padding: 9px 10px;
          color: #cbd5e1;
          border-bottom: 1px solid #0f1724;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #131f30; }

        /* ── FILE LIST ── */
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 7px;
          margin-bottom: 4px;
          background: #0d1525;
          border: 1px solid #1a2740;
          gap: 8px;
        }
        .file-name {
          font-size: 12px;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .btn-sm {
          background: #1e3a5f;
          border: none;
          color: #60a5fa;
          padding: 5px 12px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .btn-sm:hover { background: #1d4ed8; color: #fff; }
        .btn-sm.green { background: #14532d; color: #4ade80; }
        .btn-sm.green:hover { background: #166534; }
        .btn-sm.purple { background: #2e1065; color: #c084fc; }
        .btn-sm.purple:hover { background: #3b0764; }

        /* ── UPLOAD ── */
        .upload-zone {
          border: 2px dashed #1e3a5f;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .upload-zone:hover { border-color: #3b82f6; }
        .upload-zone input[type=file] { display: none; }
        .upload-zone label {
          cursor: pointer;
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-bottom: 10px;
        }
        .upload-zone label:hover { color: #94a3b8; }
        .upload-filename {
          font-size: 12px;
          color: #60a5fa;
          margin-bottom: 10px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
          color: #fff;
          padding: 8px 20px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.85; }

        /* ── ANALYSIS ── */
        .analysis-empty {
          text-align: center;
          padding: 32px;
          color: #475569;
          font-size: 13px;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .analysis-field {
          background: #0d1525;
          border: 1px solid #1a2740;
          border-radius: 7px;
          padding: 10px 12px;
        }
        .analysis-field-label {
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }
        .analysis-field-value {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .fault-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }
        .fault-item {
          background: #450a0a;
          color: #f87171;
          border-radius: 5px;
          padding: 6px 10px;
          font-size: 12px;
        }
        .step-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }
        .step-num {
          background: #1e3a5f;
          color: #60a5fa;
          border-radius: 4px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .report-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        .report-field {
          background: #0d1525;
          border: 1px solid #1a2740;
          border-radius: 7px;
          padding: 10px 12px;
        }
        .report-field-label {
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }
        .report-field-value {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .action-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .diag-bar-bg {
          background: #1e2d40;
          border-radius: 4px;
          height: 6px;
          overflow: hidden;
          flex: 1;
        }
        .diag-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }
        .diag-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .diag-label { font-size: 11px; color: #64748b; width: 80px; flex-shrink: 0; }
        .diag-pct   { font-size: 11px; color: #94a3b8; width: 36px; text-align: right; flex-shrink: 0; }

        .empty-msg { font-size: 12px; color: #475569; padding: 12px 0; text-align: center; }

        @media (max-width: 900px) {
          .dashboard { grid-template-columns: 1fr; }
          .stat-row  { grid-template-columns: repeat(2, 1fr); }
          .panels    { grid-template-columns: 1fr; }
          .analysis-grid { grid-template-columns: 1fr; }
          .report-grid   { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className='topbar'>
        <div className='topbar-brand'>
          <div className='topbar-logo'>🔬</div>
          <div>
            <div className='topbar-name'>NNIT AI Electronics Doctor Pro</div>
            <div className='topbar-sub'>Network Nice IT (NNIT) · v{home?.version ?? '1.0.0'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className='topbar-status'>{home?.status ?? 'running'}</div>
          <button className='btn-refresh' onClick={loadData}>
            {loading ? '⏳ Loading…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      <div className='dashboard'>

        {/* ── SIDEBAR ── */}
        <aside className='sidebar'>

          <div className='sidebar-section'>
            <div className='sidebar-label'>Computer</div>
            <div className='info-row'><span className='info-key'>Host</span><span className='info-val'>{scan?.computer ?? '—'}</span></div>
            <div className='info-row'><span className='info-key'>OS</span><span className='info-val'>{scan?.operating_system ?? '—'}</span></div>
            <div className='info-row'><span className='info-key'>CPU</span><span className='info-val'>{scan?.processor ?? '—'}</span></div>
            <div className='info-row'><span className='info-key'>RAM</span><span className='info-val'>{scan?.memory ?? '—'}</span></div>
            <div className='info-row'><span className='info-key'>Battery</span><span className='info-val'>{scan?.battery ?? '—'}</span></div>
          </div>

          <div className='divider' />

          <div className='sidebar-section'>
            <div className='sidebar-label'>Android Phone</div>
            <div className='info-row'>
              <span className='info-key'>ADB</span>
              <span className='info-val'>
                <span className={'badge ' + (phoneOk ? 'badge-green' : 'badge-red')}>
                  {phoneOk ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>
            <div className='info-row'><span className='info-key'>Brand</span>
              <span className='info-val'>
                {phone?.brand?.startsWith('Command') ? <span style={{color:'#475569'}}>ADB error</span> : (phone?.brand ?? '—')}
              </span>
            </div>
            <div className='info-row'><span className='info-key'>Model</span>
              <span className='info-val'>
                {phone?.model?.startsWith('Command') ? <span style={{color:'#475569'}}>ADB error</span> : (phone?.model ?? '—')}
              </span>
            </div>
            <div className='info-row'><span className='info-key'>Android</span>
              <span className='info-val'>
                {phone?.android_version?.startsWith('Command') ? <span style={{color:'#475569'}}>ADB error</span> : (phone?.android_version ?? '—')}
              </span>
            </div>
            <div className='info-row'><span className='info-key'>Battery</span><span className='info-val'>{phone?.battery ?? 'Unknown'}%</span></div>
            <div className='info-row'><span className='info-key'>Temp</span><span className='info-val'>{phone?.temperature ?? 'Unknown'}</span></div>
            <div className='info-row'><span className='info-key'>Voltage</span><span className='info-val'>{phone?.voltage ?? 'Unknown'} mV</span></div>
          </div>

          <div className='divider' />

          <div className='sidebar-section'>
            <div className='sidebar-label'>System</div>
            <div className='info-row'><span className='info-key'>API</span><span className='info-val'>{home?.api ?? '/docs'}</span></div>
            <div className='info-row'><span className='info-key'>Status</span><span className='info-val'><span className='badge badge-green'>{home?.status ?? 'running'}</span></span></div>
          </div>

        </aside>

        {/* ── MAIN ── */}
        <main className='main'>

          {/* Stat row */}
          <div className='stat-row'>
            <div className='stat-card'>
              <div className='stat-label'>CPU Usage</div>
              <div className='stat-value' style={{color: parseFloat(diagnosis?.cpu_usage) > 80 ? '#f87171' : '#4ade80'}}>
                {diagnosis?.cpu_usage ?? '—'}
              </div>
              <div className='stat-sub'>Real-time</div>
            </div>
            <div className='stat-card'>
              <div className='stat-label'>RAM Usage</div>
              <div className='stat-value' style={{color: parseFloat(diagnosis?.ram_usage) > 80 ? '#f87171' : '#60a5fa'}}>
                {diagnosis?.ram_usage ?? '—'}
              </div>
              <div className='stat-sub'>Real-time</div>
            </div>
            <div className='stat-card'>
              <div className='stat-label'>Faults Detected</div>
              <div className='stat-value' style={{color: (diagnosis?.faults?.length ?? 0) > 0 ? '#fbbf24' : '#4ade80'}}>
                {diagnosis?.faults?.length ?? 0}
              </div>
              <div className='stat-sub'>{(diagnosis?.faults?.length ?? 0) > 0 ? 'Action needed' : 'All clear'}</div>
            </div>
            <div className='stat-card'>
              <div className='stat-label'>Files Uploaded</div>
              <div className='stat-value' style={{color:'#c084fc'}}>{images.length}</div>
              <div className='stat-sub'>{reports.length} reports saved</div>
            </div>
          </div>

          {/* Panels row 1 */}
          <div className='panels'>

            {/* AI Diagnosis */}
            <div className='panel'>
              <div className='panel-head'>
                <span className='panel-title'>🤖 AI Diagnosis</span>
                {(diagnosis?.faults?.length ?? 0) > 0 &&
                  <span className='badge badge-yellow'>{diagnosis.faults.length} fault{diagnosis.faults.length > 1 ? 's' : ''}</span>
                }
              </div>
              <div className='panel-body'>
                {diagnosis ? (
                  <>
                    <div className='diag-row'>
                      <span className='diag-label'>CPU</span>
                      <div className='diag-bar-bg'>
                        <div className='diag-bar-fill' style={{
                          width: diagnosis.cpu_usage ?? '0%',
                          background: parseFloat(diagnosis.cpu_usage) > 80 ? '#ef4444' : '#3b82f6'
                        }} />
                      </div>
                      <span className='diag-pct'>{diagnosis.cpu_usage}</span>
                    </div>
                    <div className='diag-row'>
                      <span className='diag-label'>RAM</span>
                      <div className='diag-bar-bg'>
                        <div className='diag-bar-fill' style={{
                          width: diagnosis.ram_usage ?? '0%',
                          background: parseFloat(diagnosis.ram_usage) > 80 ? '#ef4444' : '#8b5cf6'
                        }} />
                      </div>
                      <span className='diag-pct'>{diagnosis.ram_usage}</span>
                    </div>
                    {diagnosis.faults?.length > 0 && (
                      <div className='fault-list'>
                        {diagnosis.faults.map((f: string, i: number) => (
                          <div key={i} className='fault-item'>⚠ {f}</div>
                        ))}
                      </div>
                    )}
                    {diagnosis.recommendations?.length > 0 && (
                      <div className='step-list' style={{marginTop:'12px'}}>
                        {diagnosis.recommendations.map((r: string, i: number) => (
                          <div key={i} className='step-item'>
                            <div className='step-num'>{i + 1}</div>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : <div className='empty-msg'>Loading diagnosis…</div>}
              </div>
            </div>

            {/* Storage */}
            <div className='panel'>
              <div className='panel-head'>
                <span className='panel-title'>💾 Storage</span>
              </div>
              <div className='panel-body' style={{padding:0}}>
                {storage?.length > 0 ? (
                  <table className='data-table'>
                    <thead>
                      <tr>
                        <th>Drive</th>
                        <th>Total</th>
                        <th>Used</th>
                        <th>Free</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storage.map((d: any, i: number) => (
                        <tr key={i}>
                          <td><span className='badge badge-blue'>{d.drive}</span></td>
                          <td>{d.total}</td>
                          <td>{d.used}</td>
                          <td style={{color:'#4ade80'}}>{d.free}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className='empty-msg'>No storage data</div>}
              </div>
            </div>

            {/* Upload */}
            <div className='panel'>
              <div className='panel-head'>
                <span className='panel-title'>📤 Upload File</span>
              </div>
              <div className='panel-body'>
                <div className='upload-zone'>
                  <input type='file' id='file-input' onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor='file-input'>
                    📁 Click to choose an image or video
                  </label>
                  {file && <div className='upload-filename'>{file.name}</div>}
                  <button className='btn-primary' onClick={uploadFile}>📤 Upload</button>
                </div>
                {uploadResult && (
                  <div style={{marginTop:'10px', padding:'8px 12px', background:'#14532d', borderRadius:'6px', fontSize:'12px', color:'#4ade80'}}>
                    ✅ {uploadResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            <div className='panel'>
              <div className='panel-head'>
                <span className='panel-title'>📁 Uploaded Files</span>
                <span className='badge badge-blue'>{images.length}</span>
              </div>
              <div className='panel-body'>
                {images.length === 0
                  ? <div className='empty-msg'>No files uploaded yet</div>
                  : images.map((img: any, i: number) => (
                    <div key={i} className='file-item'>
                      <span className='file-name'>{img.filename ?? img}</span>
                      <button className='btn-sm' onClick={() => analyzeFile(img.filename ?? img)}>
                        Analyze
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>

          </div>

          {/* Analysis panel - full width */}
          <div className='panels'>
            <div className='panel panel-full'>
              <div className='panel-head'>
                <span className='panel-title'>🧠 AI Analysis Result</span>
                {analysis && (
                  <div className='action-bar' style={{margin:0}}>
                    <button className='btn-sm purple' onClick={copyResult}>📋 Copy JSON</button>
                    <button className='btn-sm green' onClick={generateReport}>📄 Generate Report</button>
                  </div>
                )}
              </div>
              <div className='panel-body'>
                {!analysis ? (
                  <div className='analysis-empty'>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>🔍</div>
                    Select a file above and click <strong>Analyze</strong> to get started.
                  </div>
                ) : (
                  <>
                    <div className='analysis-grid'>
                      <div className='analysis-field'>
                        <div className='analysis-field-label'>File</div>
                        <div className='analysis-field-value'>{analysis.filename ?? '—'}</div>
                      </div>
                      <div className='analysis-field'>
                        <div className='analysis-field-label'>Type</div>
                        <div className='analysis-field-value'>{analysis.type ?? '—'}</div>
                      </div>
                      <div className='analysis-field'>
                        <div className='analysis-field-label'>Device</div>
                        <div className='analysis-field-value'>{analysis.device ?? '—'}</div>
                      </div>
                      <div className='analysis-field'>
                        <div className='analysis-field-label'>Confidence</div>
                        <div className='analysis-field-value'>{analysis.confidence != null ? analysis.confidence + '%' : '—'}</div>
                      </div>
                    </div>

                    {analysis.faults?.length > 0 && (
                      <>
                        <div style={{fontSize:'11px',color:'#475569',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Faults</div>
                        <div className='fault-list' style={{marginBottom:'14px'}}>
                          {analysis.faults.map((f: string, i: number) => (
                            <div key={i} className='fault-item'>⚠ {f}</div>
                          ))}
                        </div>
                      </>
                    )}

                    {analysis.repair_steps?.length > 0 && (
                      <>
                        <div style={{fontSize:'11px',color:'#475569',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Repair Steps</div>
                        <div className='step-list' style={{marginBottom:'14px'}}>
                          {analysis.repair_steps.map((s: string, i: number) => (
                            <div key={i} className='step-item'>
                              <div className='step-num'>{i + 1}</div>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Repair report section */}
                    {analysis.report && (
                      <>
                        <div style={{fontSize:'11px',color:'#475569',margin:'16px 0 8px',textTransform:'uppercase',letterSpacing:'0.8px',borderTop:'1px solid #1e2d40',paddingTop:'16px'}}>
                          📄 Repair Report · {analysis.report.report_id}
                        </div>
                        <div className='report-grid'>
                          <div className='report-field'>
                            <div className='report-field-label'>Device</div>
                            <div className='report-field-value'>{analysis.report.device ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Fault</div>
                            <div className='report-field-value'>{analysis.report.diagnosis?.fault ?? 'No fault data'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Confidence</div>
                            <div className='report-field-value'>{analysis.report.diagnosis?.confidence ?? 0}%</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Severity</div>
                            <div className='report-field-value'>{analysis.report.diagnosis?.severity ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Est. Cost</div>
                            <div className='report-field-value' style={{color:'#4ade80'}}>{analysis.report.estimated_cost ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Repair Time</div>
                            <div className='report-field-value'>{analysis.report.estimated_repair_time ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Technician</div>
                            <div className='report-field-value'>{analysis.report.technician ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Date</div>
                            <div className='report-field-value'>{analysis.report.date ?? '—'}</div>
                          </div>
                          <div className='report-field'>
                            <div className='report-field-label'>Status</div>
                            <div className='report-field-value'>
                              <span className='badge badge-green'>{analysis.report.status ?? '—'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Report History - full width */}
          <div className='panels'>
            <div className='panel panel-full'>
              <div className='panel-head'>
                <span className='panel-title'>📜 Report History</span>
                <span className='badge badge-blue'>{reports.length}</span>
              </div>
              <div className='panel-body'>
                {reports.length === 0
                  ? <div className='empty-msg'>No reports saved yet</div>
                  : (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'8px'}}>
                      {reports.map((r: any, i: number) => (
                        <div key={i} className='file-item'>
                          <span className='file-name'>{r.name ?? r}</span>
                          <button className='btn-sm' onClick={() => viewReport(r.name ?? r)}>View</button>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
