'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { googleLogin, emailLogin, emailSignup, getNovels } from '../services/api';
import './Navbar.css';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, loginWithToken }) {
  const [tab, setTab]           = useState('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    setError(''); setSuccess('');
    if (!CLIENT_ID) return;

    function init() {
      if (!window.google || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large', shape: 'rectangular',
          width: 300, text: tab === 'signup' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
        });
      } catch (e) { console.error('Google init error', e); }
    }

    if (window.google) { setTimeout(init, 80); }
    else {
      let n = 0;
      const iv = setInterval(() => {
        n++;
        if (window.google) { clearInterval(iv); setTimeout(init, 80); }
        if (n > 25) clearInterval(iv);
      }, 200);
      return () => clearInterval(iv);
    }
  }, [tab]);

  async function handleGoogleCredential(response) {
    if (!response?.credential) { setError('No credential received. Try again.'); return; }
    setGoogleLoading(true); setError('');
    try {
      const data = await googleLogin(response.credential);
      loginWithToken(data.token, data.user);
      onClose();
    } catch (err) { setError(err.message || 'Google sign-in failed.'); }
    setGoogleLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (tab === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        const data = await emailSignup(name.trim(), email.trim(), password);
        setSuccess('Account created! Signing you in...');
        setTimeout(() => { loginWithToken(data.token, data.user); onClose(); }, 900);
      } else {
        const data = await emailLogin(email.trim(), password);
        loginWithToken(data.token, data.user);
        onClose();
      }
    } catch (err) { setError(err.message || 'Authentication failed.'); }
    setLoading(false);
  }

  function switchTab(t) {
    setTab(t); setError(''); setSuccess('');
    setName(''); setEmail(''); setPassword('');
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="login-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--accent-orange)"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent-purple)" strokeWidth="1.5"/>
          </svg>
          <span style={{fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)'}}>
            iden<span style={{color:'var(--accent-orange)'}}>webstudio</span>
          </span>
        </div>
        <h2 className="login-title">{tab === 'signin' ? 'Welcome back' : 'Create account'}</h2>
        <p className="login-subtitle">
          {tab === 'signin' ? 'Sign in to bookmark novels and track your progress.' : 'Join idenwebstudio and start reading today.'}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <div className="auth-field">
              <label>Username</label>
              <input type="text" placeholder="Your display name" value={name} onChange={e => setName(e.target.value)} required autoComplete="username"/>
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={tab === 'signup' ? 6 : 1}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                {showPass
                  ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          {error   && <div className="auth-error">⚠ {error}</div>}
          {success && <div className="auth-success">✓ {success}</div>}
          <button type="submit" className="auth-submit-btn" disabled={loading || googleLoading}>
            {loading ? <span className="btn-loading"><span className="btn-spinner"/>Please wait...</span> : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="auth-switch">
          {tab === 'signin'
            ? <>Don't have an account? <button onClick={() => switchTab('signup')}>Sign Up</button></>
            : <>Already have an account? <button onClick={() => switchTab('signin')}>Sign In</button></>
          }
        </div>
        <div className="auth-divider"><span>or</span></div>
        <div className="auth-google-wrap">
          {googleLoading
            ? <div className="login-loading"><div className="login-spinner"/><span>Connecting to Google...</span></div>
            : <div ref={googleBtnRef} style={{minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center', width:'100%'}}/>
          }
          {!CLIENT_ID && <div className="login-env-warning">Google Sign-In not configured</div>}
        </div>
        <p className="login-footer-note">By continuing you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────────
function SearchBar({ onNavigate }) {
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);
  const inputRef    = useRef(null);
  const router      = useRouter();

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false); setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val); setActiveIdx(-1);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getNovels({ search: val.trim(), limit: 7 });
        setSuggestions(res.novels || []);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 280);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSuggestions([]); setFocused(false);
    router.push('/browse?q=' + encodeURIComponent(query.trim()));
    setQuery(''); onNavigate?.();
  }

  function handleSelect(novel) {
    setSuggestions([]); setFocused(false); setQuery('');
    router.push(novel.slug ? '/novel/s/' + novel.slug : '/novel/' + novel._id);
    onNavigate?.();
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    else if (e.key === 'Escape') { setSuggestions([]); setFocused(false); }
  }

  function highlightMatch(text, q) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark className="suggestion-highlight">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  }

  const showDropdown = focused && query.trim().length > 0 && (loading || suggestions.length > 0);

  return (
    <div className="search-autocomplete-wrap" ref={wrapRef}>
      <form className="navbar-search" onSubmit={handleSubmit}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef} type="text" placeholder="Search novels..."
          value={query} onChange={handleChange}
          onFocus={() => setFocused(true)} onKeyDown={handleKeyDown} autoComplete="off"
        />
        {query && (
          <button type="button" className="search-clear-btn" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </form>
      {showDropdown && (
        <div className="search-dropdown">
          {loading && suggestions.length === 0 && <div className="search-dropdown-loading"><div className="search-spinner"/>Searching…</div>}
          {!loading && suggestions.length === 0 && query.trim() && <div className="search-dropdown-empty">No results for "{query}"</div>}
          {suggestions.map((n, i) => (
            <button key={n._id} className={`search-suggestion${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => handleSelect(n)} onMouseEnter={() => setActiveIdx(i)}>
              <img src={n.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=40&h=56&fit=crop'} alt="" className="suggestion-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=40&h=56&fit=crop'; }}/>
              <div className="suggestion-info">
                <div className="suggestion-title">{highlightMatch(n.title, query)}</div>
                <div className="suggestion-meta">
                  {n.chapterCount > 0 && <span className="suggestion-ch">Ch.{n.chapterCount}</span>}
                  {(n.genres || []).slice(0, 2).map(g => <span key={g} className="suggestion-genre">{g}</span>)}
                </div>
              </div>
              <span className={`suggestion-status badge badge-${n.status}`}>{n.status}</span>
            </button>
          ))}
          {suggestions.length > 0 && (
            <button className="search-see-all" onMouseDown={handleSubmit}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              See all results for "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, loginWithToken, logout } = useAuth();
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [mobileSearchOpen, setMobileSearch] = useState(false);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const [showAuth, setShowAuth]             = useState(false);

  return (
    <>
      {/* Google Identity script */}
      <script src="https://accounts.google.com/gsi/client" async defer/>
      <nav className="navbar">
        <div className="navbar-inner container">
          <Link href="/" className="navbar-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--accent-orange)"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent-purple)" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <span className="logo-text">iden<span className="logo-accent">webstudio</span></span>
          </Link>

          <div className="navbar-links">
            <Link href="/"         className="nav-link">Home</Link>
            <Link href="/browse"   className="nav-link">Browse</Link>
            <Link href="/genres"   className="nav-link">Genres</Link>
            <Link href="/rankings" className="nav-link">Rankings</Link>
            <Link href="/updates"  className="nav-link">Updates</Link>
          </div>

          <SearchBar onNavigate={() => setMobileOpen(false)} />

          <div className="navbar-actions">
            <a href="https://ko-fi.com/idenwebstudio" target="_blank" rel="noopener noreferrer" className="kofi-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.623.782-.623.782s-.01 7.537-.01 11.306c0 3.704 2.498 4.557 4.722 4.557h9.975c3.5 0 6.12-2.13 6.12-5.553 0-1.768-.917-3.22-2.108-4.142z"/></svg>
              <span>Support</span>
            </a>

            {user ? (
              <div className="user-menu-wrap">
                <button className="user-avatar-btn" onClick={() => setUserMenuOpen(o => !o)}>
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="user-avatar-img" referrerPolicy="no-referrer"/>
                    : <div className="user-avatar-placeholder">{user.name?.[0]?.toUpperCase()}</div>
                  }
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{user.name}</div>
                      <div className="dropdown-user-email">{user.email}</div>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--accent-purple)', marginTop:'2px', textTransform:'uppercase'}}>{user.role}</div>
                    </div>
                    <div className="dropdown-divider"/>
                    {user.role === 'admin' && (
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                    )}
                    <div className="dropdown-divider"/>
                    <button className="dropdown-logout" onClick={() => { logout(); setUserMenuOpen(false); }}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="sign-in-btn" onClick={() => setShowAuth(true)}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Sign In
              </button>
            )}

            <button className="mobile-search-btn" onClick={() => { setMobileSearch(o => !o); setMobileOpen(false); }}>
              {mobileSearchOpen
                ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              }
            </button>
            <button className="mobile-menu-btn" onClick={() => { setMobileOpen(o => !o); setMobileSearch(false); }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="mobile-search-bar">
            <div className="container"><SearchBar onNavigate={() => setMobileSearch(false)} /></div>
          </div>
        )}

        {mobileOpen && (
          <div className="mobile-menu">
            <div className="container">
              <SearchBar onNavigate={() => setMobileOpen(false)} />
              <Link href="/"         className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/browse"   className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Browse</Link>
              <Link href="/genres"   className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Genres</Link>
              <Link href="/rankings" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Rankings</Link>
              <Link href="/updates"  className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Updates</Link>
              {user?.role === 'admin' && (
                <Link href="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} loginWithToken={loginWithToken} />}
    </>
  );
}
