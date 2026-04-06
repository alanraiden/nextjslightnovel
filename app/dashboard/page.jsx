'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNovels, createNovel, updateNovel, deleteNovel, getChapters, getChapterForEdit, createChapter, updateChapter, deleteChapter, bulkImportChapters } from '@/services/api';
import PageLayout from '@/components/PageLayout';
import './Dashboard.css';

const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Harem','Historical','Horror','Isekai','Josei','Martial Arts','Mecha','Mystery','Psychological','Romance','School Life','Sci-Fi','Slice of Life','Sports','Supernatural','System','Tragedy','Wuxia','Xianxia','Xuanhuan'];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function NovelForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    status:      initial?.status      || 'ongoing',
    genres:      initial?.genres      || [],
    tags:        initial?.tags?.join(', ') || '',
    isOriginal:  initial?.isOriginal  || false,
  });
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(initial?.cover || '');

  function toggleGenre(g) {
    setForm(f => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g] }));
  }
  function handleCover(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }
  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title',       form.title);
    fd.append('description', form.description);
    fd.append('status',      form.status);
    fd.append('genres',      JSON.stringify(form.genres));
    fd.append('tags',        JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
    fd.append('isOriginal',  form.isOriginal ? 'true' : 'false');
    if (coverFile) fd.append('cover', coverFile);
    onSave(fd);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group" style={{flex:1}}>
          <label>Novel Title *</label>
          <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Enter novel title" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Description *</label>
        <textarea required rows={5} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Write a compelling description..." />
      </div>
      <div className="form-group">
        <label>Genres</label>
        <div className="genre-picker">
          {GENRES.map(g => (
            <button type="button" key={g} className={`genre-pick-btn ${form.genres.includes(g) ? 'selected' : ''}`} onClick={() => toggleGenre(g)}>{g}</button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Tags <span style={{color:'var(--text-muted)', fontWeight:400}}>(comma separated)</span></label>
        <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="e.g. Cultivation, Strong MC, Revenge" />
      </div>
      <div className="form-group">
        <label>Novel Badges</label>
        <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', padding:'12px 14px', background:'var(--bg-dark)', border: form.isOriginal ? '1px solid #f59e0b' : '1px solid var(--border)', borderRadius:'8px', transition:'border-color 0.2s', userSelect:'none'}}>
          <input type="checkbox" checked={form.isOriginal} onChange={e => setForm(f => ({...f, isOriginal: e.target.checked}))} style={{width:'16px', height:'16px', accentColor:'#f59e0b', cursor:'pointer'}} />
          <div>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', fontSize:'0.6rem', fontWeight:700, fontFamily:'var(--font-mono)', letterSpacing:'0.1em', padding:'2px 6px', borderRadius:'4px'}}>ORIGINAL</span>
              <span style={{fontWeight:600, fontSize:'0.88rem'}}>Mark as Original</span>
            </div>
            <div style={{fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'3px'}}>Shows a gold "ORIGINAL" badge — for novels written by idenwebstudio</div>
          </div>
        </label>
      </div>
      <div className="form-group">
        <label>Cover Image (Cloudinary)</label>
        <div className="cloudinary-upload-area" onClick={() => document.getElementById('cover-input').click()}>
          {coverPreview
            ? <img src={coverPreview} alt="Cover preview" style={{height:'120px', borderRadius:'8px', objectFit:'cover'}} />
            : <>
                <div className="cloudinary-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div className="cloudinary-text">
                  <strong>Click to upload cover</strong>
                  <span>JPG, PNG, WebP — stored on Cloudinary</span>
                </div>
              </>
          }
        </div>
        <input id="cover-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleCover} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (initial ? 'Save Changes' : 'Publish Novel')}
        </button>
      </div>
    </form>
  );
}

function ChapterForm({ novelId, initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ number: initial?.number || '', title: initial?.title || '', content: initial?.content || '' });

  useEffect(() => {
    if (initial) setForm({ number: initial.number || '', title: initial.title || '', content: initial.content || '' });
  }, [initial?._id, initial?.content]);

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form className="upload-form" onSubmit={e => { e.preventDefault(); onSave({ number: Number(form.number), title: form.title, content: form.content }); }}>
      <div className="form-row">
        <div className="form-group">
          <label>Chapter Number *</label>
          <input required type="number" min="1" value={form.number} onChange={e => setForm(f => ({...f, number: e.target.value}))} placeholder="e.g. 1" disabled={!!initial} />
        </div>
        <div className="form-group" style={{flex:1}}>
          <label>Chapter Title *</label>
          <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Into the Void" />
        </div>
      </div>
      <div className="form-group">
        <label>Content *</label>
        <textarea required rows={20} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Write your chapter content here..." />
        <div className="form-hint">{wordCount.toLocaleString()} words</div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (initial ? 'Save Chapter' : 'Publish Chapter')}
        </button>
      </div>
    </form>
  );
}

function CsvImporter({ novel, onDone }) {
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState([]);
  const [parseError, setParseError] = useState('');
  const [skipDups, setSkipDups]     = useState(true);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);

  function parseCSV(text) {
    const rows = []; let i = 0;
    while (i < text.length) {
      const row = [];
      while (i < text.length) {
        if (text[i] === '"') {
          i++; let field = '';
          while (i < text.length) {
            if (text[i] === '"' && text[i+1] === '"') { field += '"'; i += 2; }
            else if (text[i] === '"') { i++; break; }
            else { field += text[i++]; }
          }
          row.push(field);
        } else {
          let field = '';
          while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') field += text[i++];
          row.push(field.trim());
        }
        if (i < text.length && text[i] === ',') i++; else break;
      }
      while (i < text.length && (text[i] === '\n' || text[i] === '\r')) i++;
      if (row.some(f => f.length > 0)) rows.push(row);
    }
    return rows;
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setParseError('');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length < 2) { setParseError('CSV has no data rows.'); return; }
        const headers = rows[0].map(h => h.toLowerCase().trim());
        const chNum    = headers.indexOf('chapter number') !== -1 ? headers.indexOf('chapter number') : headers.indexOf('chapter');
        const titleI   = headers.indexOf('title');
        const contentI = headers.indexOf('content');
        if (chNum === -1 || titleI === -1 || contentI === -1) {
          setParseError(`Missing columns. Found: [${rows[0].join(', ')}]. Need: "Chapter Number", "Title", "Content"`);
          return;
        }
        const parsed = rows.slice(1).map(r => ({ number: Number(r[chNum]), title: r[titleI], content: r[contentI] }))
          .filter(r => r.number > 0 && r.title && r.content);
        setPreview(parsed);
      } catch (err) { setParseError('Parse error: ' + err.message); }
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true); setResult(null);
    try { const res = await bulkImportChapters(novel._id, preview, skipDups); setResult(res); onDone(); }
    catch (e) { setResult({ message: 'Error: ' + e.message, created: 0, skipped: 0, errors: [] }); }
    setLoading(false);
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'18px'}}>
      <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'20px'}}>
        <div style={{fontFamily:'var(--font-display)', fontWeight:600, marginBottom:'8px', fontSize:'0.95rem'}}>📋 CSV Format Required</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--text-muted)', background:'var(--bg-dark)', padding:'10px 14px', borderRadius:'6px', lineHeight:'1.7'}}>
          Novel,Chapter Number,Title,Content<br/>
          My Novel,1,Chapter 1 - The Beginning,"Full chapter text here..."
        </div>
        <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'8px'}}>
          Columns needed: <strong>Chapter Number</strong>, <strong>Title</strong>, <strong>Content</strong>
        </div>
      </div>

      <div style={{border:'2px dashed var(--border)', borderRadius:'10px', padding:'32px', textAlign:'center', cursor:'pointer'}}
        onClick={() => document.getElementById('csv-upload-input').click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile({ target: { files: [f] } }); }}>
        <div style={{fontSize:'2rem', marginBottom:'8px'}}>📂</div>
        <div style={{fontWeight:600, marginBottom:'4px'}}>{file ? file.name : 'Drop CSV here or click to browse'}</div>
        <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Supports .csv files from the scraper</div>
        <input id="csv-upload-input" type="file" accept=".csv" style={{display:'none'}} onChange={handleFile} />
      </div>

      {parseError && <div style={{background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.3)', borderRadius:'8px', padding:'12px 16px', color:'#ff6b6b', fontSize:'0.85rem'}}>⚠️ {parseError}</div>}

      {preview.length > 0 && !parseError && (
        <>
          <div style={{display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
            <div style={{background:'rgba(255,165,0,0.12)', border:'1px solid var(--accent-orange)', borderRadius:'8px', padding:'10px 16px', fontSize:'0.88rem'}}>
              ✅ <strong>{preview.length} chapters</strong> ready to import &nbsp;|&nbsp; Ch.{preview[0]?.number} → Ch.{preview[preview.length-1]?.number}
            </div>
            <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.85rem', cursor:'pointer', userSelect:'none'}}>
              <input type="checkbox" checked={skipDups} onChange={e => setSkipDups(e.target.checked)} />
              Skip duplicate chapter numbers
            </label>
          </div>
          <div style={{maxHeight:'220px', overflowY:'auto', border:'1px solid var(--border)', borderRadius:'8px'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>
              <thead style={{position:'sticky', top:0, background:'var(--bg-card)'}}>
                <tr>
                  {['Ch#','Title','Words'].map(h => <th key={h} style={{padding:'8px 12px', textAlign:'left', borderBottom:'1px solid var(--border)', color:'var(--text-muted)'}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((ch, i) => (
                  <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'6px 12px', color:'var(--accent-orange)'}}>{ch.number}</td>
                    <td style={{padding:'6px 12px'}}>{ch.title.slice(0, 60)}{ch.title.length > 60 ? '…' : ''}</td>
                    <td style={{padding:'6px 12px', color:'var(--text-muted)'}}>{ch.content.split(/\s+/).length.toLocaleString()}</td>
                  </tr>
                ))}
                {preview.length > 50 && <tr><td colSpan={3} style={{padding:'8px 12px', color:'var(--text-muted)', textAlign:'center'}}>… and {preview.length - 50} more</td></tr>}
              </tbody>
            </table>
          </div>
          <button className="btn-primary" onClick={handleImport} disabled={loading} style={{alignSelf:'flex-start', minWidth:'160px'}}>
            {loading ? 'Importing…' : `🚀 Import ${preview.length} Chapters`}
          </button>
        </>
      )}

      {result && (
        <div style={{background: result.created > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(255,80,80,0.1)', border:`1px solid ${result.created > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(255,80,80,0.4)'}`, borderRadius:'8px', padding:'14px 18px'}}>
          <div style={{fontWeight:600, marginBottom:'6px'}}>{result.message}</div>
          {result.errors?.length > 0 && (
            <ul style={{margin:0, paddingLeft:'18px', fontSize:'0.82rem', color:'#ff8888'}}>
              {result.errors.map((e, i) => <li key={i}>Ch.{e.number}: {e.reason}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark style={{background:'rgba(255,165,0,0.35)',color:'inherit',borderRadius:'2px',padding:'0 1px'}}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
}

function ChapterManager({ novel, onBack }) {
  const [chapters, setChapters]       = useState([]);
  const [view, setView]               = useState('list');
  const [editTarget, setEditTarget]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [confirm, setConfirm]         = useState(null);
  const [msg, setMsg]                 = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  useEffect(() => { loadChapters(); }, [novel._id]);

  async function loadChapters() {
    try { setChapters(await getChapters(novel._id)); } catch {}
  }

  async function handleCreate(data) {
    setLoading(true);
    try { await createChapter(novel._id, data); setMsg('Chapter published!'); setView('list'); loadChapters(); }
    catch (e) { setMsg('Error: ' + e.message); }
    setLoading(false);
  }

  async function handleEdit(data) {
    setLoading(true);
    try { await updateChapter(novel._id, editTarget.number, data); setMsg('Chapter updated!'); setView('list'); setEditTarget(null); loadChapters(); }
    catch (e) { setMsg('Error: ' + e.message); }
    setLoading(false);
  }

  async function handleDelete(num) {
    try { await deleteChapter(novel._id, num); setMsg('Chapter deleted.'); setConfirm(null); loadChapters(); }
    catch (e) { setMsg('Error: ' + e.message); }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setLoading(true); setBulkConfirm(false);
    let done = 0, failed = 0;
    for (const num of [...selected].sort((a, b) => a - b)) {
      try { await deleteChapter(novel._id, num); done++; } catch { failed++; }
    }
    setSelected(new Set());
    setMsg(`Deleted ${done} chapter${done !== 1 ? 's' : ''}${failed ? `, ${failed} failed` : ''}.`);
    setLoading(false); loadChapters();
  }

  const visibleChapters = chapters.filter(ch =>
    !chapterSearch || ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) || String(ch.number).includes(chapterSearch)
  );
  const allVisibleSelected = visibleChapters.length > 0 && visibleChapters.every(ch => selected.has(ch.number));

  function toggleAll() {
    if (allVisibleSelected) setSelected(prev => { const s = new Set(prev); visibleChapters.forEach(ch => s.delete(ch.number)); return s; });
    else setSelected(prev => { const s = new Set(prev); visibleChapters.forEach(ch => s.add(ch.number)); return s; });
  }
  function toggleOne(num) { setSelected(prev => { const s = new Set(prev); s.has(num) ? s.delete(num) : s.add(num); return s; }); }

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap'}}>
        <button className="btn-secondary" onClick={onBack}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Novels
        </button>
        <div style={{fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:600}}>{novel.title}</div>
        <div style={{marginLeft:'auto', display:'flex', gap:'8px', flexWrap:'wrap'}}>
          {view === 'list' && (
            <>
              {selected.size > 0 && (
                <button className="btn-secondary" style={{color:'#ff6b6b', borderColor:'rgba(255,80,80,0.4)'}} onClick={() => setBulkConfirm(true)} disabled={loading}>
                  🗑 Delete {selected.size} selected
                </button>
              )}
              <button className="btn-secondary" onClick={() => setView('import')}>📥 Bulk Import CSV</button>
              <button className="btn-primary" onClick={() => setView('new')}>+ New Chapter</button>
            </>
          )}
        </div>
      </div>

      {msg && <div className={`upload-success ${msg.startsWith('Error') ? 'upload-error' : ''}`}>{msg}</div>}

      {view === 'list' && (
        <div className="novels-table">
          {chapters.length > 5 && (
            <div style={{padding:'12px 12px 0', display:'flex', gap:'8px', alignItems:'center'}}>
              <div style={{position:'relative', flex:1}}>
                <svg style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', opacity:0.4}} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Search chapters…" value={chapterSearch} onChange={e => setChapterSearch(e.target.value)}
                  style={{width:'100%', boxSizing:'border-box', paddingLeft:'30px', paddingTop:'7px', paddingBottom:'7px', background:'var(--bg-dark)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', outline:'none'}}/>
                {chapterSearch && <button onClick={() => setChapterSearch('')} style={{position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1rem', lineHeight:1}}>×</button>}
              </div>
              <span style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--text-muted)', whiteSpace:'nowrap'}}>
                {visibleChapters.length} / {chapters.length}
              </span>
            </div>
          )}
          <div className="novels-table-header" style={{gridTemplateColumns:'36px 80px 1fr 120px 100px 120px'}}>
            <span><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} style={{cursor:'pointer'}} /></span>
            <span>No.</span><span>Title</span><span>Date</span><span>Words</span><span>Actions</span>
          </div>
          {chapters.length === 0 && (
            <div style={{padding:'40px', textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem'}}>No chapters yet.</div>
          )}
          {visibleChapters.map(ch => (
            <div key={ch._id} className="novels-table-row" style={{gridTemplateColumns:'36px 80px 1fr 120px 100px 120px', background: selected.has(ch.number) ? 'rgba(139,92,246,0.07)' : ''}}>
              <span><input type="checkbox" checked={selected.has(ch.number)} onChange={() => toggleOne(ch.number)} style={{cursor:'pointer'}} /></span>
              <span className="table-mono" style={{color:'var(--accent-orange)'}}>Ch. {ch.number}</span>
              <span className="novel-table-title">{chapterSearch ? highlightMatch(ch.title, chapterSearch) : ch.title}</span>
              <span className="table-mono">{new Date(ch.createdAt).toLocaleDateString()}</span>
              <span className="table-mono">{(ch.wordCount||0).toLocaleString()}w</span>
              <span style={{display:'flex', gap:'6px'}}>
                <button className="table-action-btn" onClick={async () => {
                  setView('edit'); setEditTarget(ch);
                  try { const full = await getChapterForEdit(novel._id, ch.number); setEditTarget(full); } catch {}
                }}>Edit</button>
                <button className="table-action-btn danger" onClick={() => setConfirm(ch.number)}>Del</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {view === 'import' && (
        <>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
            <div className="dashboard-section-title" style={{margin:0}}>Bulk Import — {novel.title}</div>
            <button className="btn-secondary" style={{marginLeft:'auto'}} onClick={() => setView('list')}>← Back</button>
          </div>
          <CsvImporter novel={novel} onDone={loadChapters} />
        </>
      )}

      {view === 'new' && (
        <>
          <div className="dashboard-section-title">New Chapter</div>
          <ChapterForm novelId={novel._id} onSave={handleCreate} onCancel={() => setView('list')} loading={loading} />
        </>
      )}

      {view === 'edit' && editTarget && (
        <>
          <div className="dashboard-section-title">Edit Chapter {editTarget.number}</div>
          <ChapterForm key={String(editTarget._id) + String(!!editTarget.content)} novelId={novel._id} initial={editTarget} onSave={handleEdit} onCancel={() => { setView('list'); setEditTarget(null); }} loading={loading} />
        </>
      )}

      {confirm !== null && <ConfirmDialog message={`Delete Chapter ${confirm}? Cannot be undone.`} onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
      {bulkConfirm && <ConfirmDialog message={`Delete all ${selected.size} selected chapters? Cannot be undone.`} onConfirm={handleBulkDelete} onCancel={() => setBulkConfirm(false)} />}
    </div>
  );
}

const TABS = ['Overview', 'My Novels', 'Upload Novel', 'Analytics'];

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab]       = useState('Overview');
  const [novels, setNovels]             = useState([]);
  const [novelView, setNovelView]       = useState('list');
  const [editTarget, setEditTarget]     = useState(null);
  const [chapterTarget, setChapterTarget] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState('');
  const [confirm, setConfirm]           = useState(null);
  const [novelSearch, setNovelSearch]   = useState('');
  const [novelFilter, setNovelFilter]   = useState('all');
  const [novelSort, setNovelSort]       = useState('newest');

  useEffect(() => { if (user) loadMyNovels(); }, [user]);

  async function loadMyNovels() {
    if (!user) return;
    try { const data = await getNovels({ authorId: user.id || user._id, limit: 500 }); setNovels(data.novels || []); } catch {}
  }

  if (!token) {
    return (
      <PageLayout>
        <div style={{padding:'80px 0', textAlign:'center', minHeight:'100vh'}}>
          <div style={{fontSize:'3rem', marginBottom:'20px'}}>🔒</div>
          <div style={{fontFamily:'var(--font-display)', fontSize:'1.3rem', marginBottom:'12px'}}>Sign in to access your dashboard</div>
          <div style={{color:'var(--text-muted)', fontSize:'0.88rem'}}>Click the Sign In button in the navbar to continue.</div>
        </div>
      </PageLayout>
    );
  }

  if (chapterTarget) {
    return (
      <PageLayout>
        <div className="dashboard-page">
          <div className="container">
            <ChapterManager novel={chapterTarget} onBack={() => { setChapterTarget(null); loadMyNovels(); }} />
          </div>
        </div>
      </PageLayout>
    );
  }

  async function handleCreateNovel(fd) {
    setLoading(true);
    try { await createNovel(fd); setMsg('Novel published!'); setActiveTab('My Novels'); loadMyNovels(); }
    catch (e) { setMsg('Error: ' + e.message); }
    setLoading(false);
  }

  async function handleEditNovel(fd) {
    setLoading(true);
    try { await updateNovel(editTarget._id, fd); setMsg('Novel updated!'); setNovelView('list'); setEditTarget(null); loadMyNovels(); }
    catch (e) { setMsg('Error: ' + e.message); }
    setLoading(false);
  }

  async function handleDeleteNovel(id) {
    try { await deleteNovel(id); setMsg('Novel deleted.'); setConfirm(null); loadMyNovels(); }
    catch (e) { setMsg('Error: ' + e.message); }
  }

  const totalChapters = novels.reduce((a, n) => a + (n.chapterCount || 0), 0);
  const totalViews    = novels.reduce((a, n) => a + (n.views || 0), 0);
  const avgRating     = novels.length ? (novels.reduce((a, n) => a + n.rating, 0) / novels.length).toFixed(1) : '0.0';

  const filteredNovels = novels
    .filter(n => {
      const matchSearch = !novelSearch || n.title.toLowerCase().includes(novelSearch.toLowerCase()) || (n.author||'').toLowerCase().includes(novelSearch.toLowerCase()) || (n.genres||[]).some(g => g.toLowerCase().includes(novelSearch.toLowerCase()));
      const matchStatus = novelFilter === 'all' || n.status === novelFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (novelSort === 'title')    return a.title.localeCompare(b.title);
      if (novelSort === 'chapters') return (b.chapterCount||0) - (a.chapterCount||0);
      if (novelSort === 'views')    return (b.views||0) - (a.views||0);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return (
    <PageLayout>
      <div className="dashboard-page">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">idenwebstudio Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back, <strong style={{color:'var(--accent-orange)'}}>{user.name}</strong></p>
            </div>
            <a href="https://ko-fi.com/idenwebstudio" target="_blank" rel="noopener noreferrer" className="kofi-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.623.782-.623.782s-.01 7.537-.01 11.306c0 3.704 2.498 4.557 4.722 4.557h9.975c3.5 0 6.12-2.13 6.12-5.553 0-1.768-.917-3.22-2.108-4.142z"/></svg>
              Support on Ko-fi
            </a>
          </div>

          <div className="dashboard-tabs">
            {TABS.map(t => (
              <button key={t} className={'dashboard-tab' + (activeTab === t ? ' active' : '')} onClick={() => { setActiveTab(t); setNovelView('list'); setMsg(''); }}>{t}</button>
            ))}
          </div>

          {msg && <div className={`upload-success${msg.startsWith('Error') ? ' upload-error' : ''}`} style={{marginBottom:'20px'}}>{msg.startsWith('Error') ? '❌ ' : '✅ '}{msg}</div>}

          {activeTab === 'Overview' && (
            <div className="dashboard-content">
              <div className="stats-grid">
                {[
                  { label:'My Novels',     value: novels.length,                                             icon:'📚', color:'var(--accent-purple)' },
                  { label:'Total Chapters',value: totalChapters.toLocaleString(),                            icon:'📄', color:'var(--accent-orange)' },
                  { label:'Total Views',   value: totalViews >= 1000 ? (totalViews/1000).toFixed(1)+'K' : totalViews, icon:'👁', color:'var(--accent-blue)' },
                  { label:'Avg Rating',    value: avgRating,                                                 icon:'⭐', color:'var(--accent-gold)' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-icon" style={{color:s.color}}>{s.icon}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="dashboard-section-title">Your Novels</div>
              {novels.length === 0
                ? <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.85rem'}}>
                    No novels yet. <button style={{background:'none',border:'none',color:'var(--accent-orange)',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}} onClick={() => setActiveTab('Upload Novel')}>Upload your first one!</button>
                  </div>
                : novels.slice(0,3).map(n => (
                  <div key={n._id} className="update-item" style={{cursor:'default'}}>
                    <img src={n.cover||'https://via.placeholder.com/46x62/1a1a2e/8b5cf6?text=N'} className="update-cover" alt={n.title} onError={e=>{e.target.src='https://via.placeholder.com/46x62/1a1a2e/8b5cf6?text=N';}}/>
                    <div className="update-info">
                      <div className="update-title">{n.title}</div>
                      <div style={{color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.72rem'}}>{n.chapterCount} chapters · {n.views} views</div>
                    </div>
                    <span className={`badge badge-${n.status}`}>{n.status}</span>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'My Novels' && (
            <div className="dashboard-content">
              {novelView === 'list' && (
                <>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'10px'}}>
                    <div className="dashboard-section-title" style={{marginBottom:0}}>
                      Your Novels ({filteredNovels.length}{filteredNovels.length !== novels.length ? ` of ${novels.length}` : ''})
                    </div>
                    <button className="btn-primary" onClick={() => setActiveTab('Upload Novel')}>+ New Novel</button>
                  </div>
                  <div style={{display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center'}}>
                    <div style={{position:'relative', flex:'1', minWidth:'200px'}}>
                      <svg style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', opacity:0.4}} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      <input type="text" placeholder="Search by title, author, genre…" value={novelSearch} onChange={e => setNovelSearch(e.target.value)}
                        style={{width:'100%', boxSizing:'border-box', paddingLeft:'32px', paddingTop:'8px', paddingBottom:'8px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.85rem', outline:'none'}}/>
                      {novelSearch && <button onClick={() => setNovelSearch('')} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1rem', lineHeight:1}}>×</button>}
                    </div>
                    <select value={novelFilter} onChange={e => setNovelFilter(e.target.value)} style={{padding:'8px 12px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', cursor:'pointer', outline:'none'}}>
                      <option value="all">All Status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                    </select>
                    <select value={novelSort} onChange={e => setNovelSort(e.target.value)} style={{padding:'8px 12px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', cursor:'pointer', outline:'none'}}>
                      <option value="newest">Recently Updated</option><option value="title">Title A–Z</option><option value="chapters">Most Chapters</option><option value="views">Most Views</option>
                    </select>
                  </div>
                  <div className="novels-table">
                    <div className="novels-table-header" style={{gridTemplateColumns:'80px 1fr 90px 90px 100px 160px'}}>
                      <span>Cover</span><span>Title</span><span>Chapters</span><span>Views</span><span>Status</span><span>Actions</span>
                    </div>
                    {filteredNovels.length === 0 && (
                      <div style={{padding:'40px', textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem'}}>
                        {novels.length === 0 ? 'No novels yet.' : `No novels match "${novelSearch}".`}
                        {novels.length > 0 && <button onClick={() => { setNovelSearch(''); setNovelFilter('all'); }} style={{background:'none', border:'none', color:'var(--accent-orange)', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit', marginLeft:'6px'}}>Clear filters</button>}
                      </div>
                    )}
                    {filteredNovels.map(n => (
                      <div key={n._id} className="novels-table-row" style={{gridTemplateColumns:'80px 1fr 90px 90px 100px 160px'}}>
                        <span><img src={n.cover||'https://via.placeholder.com/40x56/1a1a2e/8b5cf6?text=N'} alt="" style={{width:'40px',height:'56px',objectFit:'cover',borderRadius:'4px'}} onError={e=>{e.target.src='https://via.placeholder.com/40x56/1a1a2e/8b5cf6?text=N';}}/></span>
                        <span className="novel-table-title">{novelSearch ? highlightMatch(n.title, novelSearch) : n.title}</span>
                        <span className="table-mono">{n.chapterCount}</span>
                        <span className="table-mono">{n.views >= 1000 ? (n.views/1000).toFixed(1)+'K' : n.views}</span>
                        <span><span className={`badge badge-${n.status}`}>{n.status}</span></span>
                        <span style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                          <button className="table-action-btn" onClick={() => setChapterTarget(n)}>Chapters</button>
                          <button className="table-action-btn" onClick={() => { setEditTarget(n); setNovelView('edit'); }}>Edit</button>
                          <button className="table-action-btn danger" onClick={() => setConfirm(n._id)}>Del</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {novelView === 'edit' && editTarget && (
                <>
                  <div className="dashboard-section-title">Edit Novel</div>
                  <NovelForm initial={editTarget} onSave={handleEditNovel} onCancel={() => { setNovelView('list'); setEditTarget(null); }} loading={loading} />
                </>
              )}
            </div>
          )}

          {activeTab === 'Upload Novel' && (
            <div className="dashboard-content">
              <div className="dashboard-section-title">Publish New Novel</div>
              <div className="upload-info-banner">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Cover images are stored via Cloudinary. Make sure your backend .env is configured.
              </div>
              <NovelForm onSave={handleCreateNovel} onCancel={() => setActiveTab('My Novels')} loading={loading} />
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="dashboard-content">
              <div className="dashboard-section-title">Analytics</div>
              <div className="analytics-placeholder">
                <div style={{fontSize:'3rem', marginBottom:'16px'}}>📊</div>
                <div style={{fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:'8px'}}>Coming Soon</div>
                <div style={{color:'var(--text-muted)', fontSize:'0.85rem', maxWidth:'360px', textAlign:'center', lineHeight:'1.6'}}>
                  Connect your MongoDB database to view real-time chapter views, reader retention, and growth metrics.
                </div>
              </div>
            </div>
          )}

          {confirm && <ConfirmDialog message="Delete this novel and ALL its chapters? Cannot be undone." onConfirm={() => handleDeleteNovel(confirm)} onCancel={() => setConfirm(null)} />}
        </div>
      </div>
    </PageLayout>
  );
}
