const { useState, useEffect } = React;

const API = window.location.origin;

function Navbar({ setPage }) {
  return (
    <nav className="navbar container">
      <div className="logo">🛡️ URLGuard <span>AI</span></div>
      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#modules">Modules</a></li>
        <li><a href="#workflow">Workflow</a></li>
      </ul>
      <div className="auth-buttons">
        <button className="btn btn-outline" onClick={() => setPage('login')}>Login</button>
        <button className="btn btn-primary" onClick={() => setPage('signup')}>Get Started</button>
      </div>
    </nav>
  );
}

function Landing({ setPage }) {
  return (
    <>
      <header className="hero-header">
        <Navbar setPage={setPage} />
        <section className="hero container" id="home">
          <div className="hero-content">
            <p className="eyebrow">AI-Powered URL Attack Intelligence</p>
            <h1>Detect, classify, and investigate URL-based cyber attacks in real time.</h1>
            <p>Supports SQLi, XSS, traversal, SSRF, LFI/RFI, command injection, XXE, brute-force and more.</p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => setPage('dashboard')}>Open Dashboard</button>
              <a className="btn btn-ghost" href="#modules">View Modules</a>
            </div>
          </div>
          <div className="hero-card">
            <h3>Required Modules</h3>
            <ul>
              <li>PCAP/IPDR ingestion</li>
              <li>URL attack detection</li>
              <li>Attempt vs successful attack classifier</li>
              <li>Query by attack type/IP/range</li>
              <li>CSV/JSON export</li>
            </ul>
          </div>
        </section>
      </header>

      <main>
        <section className="section container" id="about">
          <h2>Project Mission</h2>
          <p>Build a practical SOC platform that ingests HTTP telemetry and identifies URL-based threats with a strong visualization layer.</p>
        </section>
        <section className="section container" id="modules">
          <h2>Detection Coverage</h2>
          <div className="grid cards-3">
            <article className="card"><h3>SQL Injection</h3><p>Detect payload variants and tampered patterns.</p></article>
            <article className="card"><h3>XSS</h3><p>Identify reflected and stored vectors.</p></article>
            <article className="card"><h3>Traversal</h3><p>Flag path and file system escape attempts.</p></article>
            <article className="card"><h3>SSRF/LFI/RFI</h3><p>Detect server-side file/resource misuse.</p></article>
            <article className="card"><h3>Command Injection</h3><p>Catch shell payload chaining and escapes.</p></article>
            <article className="card"><h3>Brute Force/HPP</h3><p>Track credential stuffing and parameter abuse.</p></article>
          </div>
        </section>
      </main>
    </>
  );
}

function Login({ setPage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.message || 'Login failed');
    localStorage.setItem('urlguard_user', JSON.stringify(data.user));
    setPage('dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div>
          <button className="back-link back-btn" onClick={() => setPage('landing')}>← Back to Home</button>
          <h1>Welcome back</h1>
          <p>Sign in to access attack telemetry and investigations.</p>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {msg ? <p className="error">{msg}</p> : null}
          <button className="btn btn-primary">Login</button>
          <p className="small">Don&apos;t have an account? <button type="button" className="link-btn" onClick={() => setPage('signup')}>Sign up</button></p>
        </form>
      </div>
    </div>
  );
}

function Signup({ setPage }) {
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setOk('');
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization, email, password })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.message || 'Signup failed');
    setOk('Account created successfully. Please login.');
    setTimeout(() => setPage('login'), 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div>
          <button className="back-link back-btn" onClick={() => setPage('landing')}>← Back to Home</button>
          <h1>Create your workspace</h1>
          <p>Start detecting URL attacks with secure user access.</p>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <label>Organization<input value={organization} onChange={(e) => setOrganization(e.target.value)} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {msg ? <p className="error">{msg}</p> : null}
          {ok ? <p className="success">{ok}</p> : null}
          <button className="btn btn-primary">Create Account</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ setPage }) {
  const [users, setUsers] = useState(0);
  useEffect(() => {
    fetch(`${API}/api/users`).then((r) => r.json()).then((d) => setUsers(d.totalUsers || 0)).catch(() => {});
  }, []);

  return (
    <>
      <header className="dash-top">
        <div className="container dash-nav">
          <div className="logo">🛡️ URLGuard <span>AI</span></div>
          <nav>
            <button className="btn btn-outline" onClick={() => setPage('landing')}>Landing</button>
            <button className="btn btn-outline" onClick={() => { localStorage.removeItem('urlguard_user'); setPage('login'); }}>Logout</button>
          </nav>
        </div>
      </header>
      <main className="container section">
        <h1>Threat Dashboard</h1>
        <p className="muted">High-level live security telemetry and user stats.</p>
        <section className="grid cards-4">
          <article className="card metric"><h3>12,480</h3><p>Total Requests</p></article>
          <article className="card metric"><h3>1,392</h3><p>Attack Attempts</p></article>
          <article className="card metric"><h3>186</h3><p>Confirmed Success</p></article>
          <article className="card metric"><h3>{users}</h3><p>Registered Users</p></article>
        </section>
      </main>
    </>
  );
}

function App() {
  const [page, setPage] = useState('landing');

  useEffect(() => {
    if (localStorage.getItem('urlguard_user')) setPage('dashboard');
  }, []);

  if (page === 'login') return <Login setPage={setPage} />;
  if (page === 'signup') return <Signup setPage={setPage} />;
  if (page === 'dashboard') return <Dashboard setPage={setPage} />;
  return <Landing setPage={setPage} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
