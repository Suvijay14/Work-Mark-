// ============== LOGIN SCREEN ==============
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [err, setErr] = React.useState('');

  const submit = (e) => {
    e && e.preventDefault();
    if (email === 'admin@workmark.in' && pwd === 'demo123') return onLogin('admin');
    if (email === 'priya@workmark.in' && pwd === 'demo123') return onLogin('employee');
    setErr('Invalid credentials. Try a demo login below.');
  };

  const quick = (role) => {
    if (role === 'admin') { setEmail('admin@workmark.in'); setPwd('demo123'); setTimeout(() => onLogin('admin'), 120); }
    else { setEmail('priya@workmark.in'); setPwd('demo123'); setTimeout(() => onLogin('employee'), 120); }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo"><span className="work">Work</span><span className="mark">Mark</span></div>
        <div className="login-sub">Attendance · Payroll · v2.4</div>
        <form onSubmit={submit}>
          <label className="field-label">Email</label>
          <input className="input" type="email" placeholder="you@workmark.in"
            value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 14 }} />
          <label className="field-label">Password</label>
          <input className="input" type="password" placeholder="••••••••"
            value={pwd} onChange={e => setPwd(e.target.value)} style={{ marginBottom: 18 }} />
          {err && (
            <div style={{ background: 'rgba(255,69,69,0.1)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: 'DM Mono, monospace' }}>
              {err}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '13px 18px', fontSize: 14 }}>Sign In</button>
        </form>
        <div className="demo-creds">
          <div style={{ marginBottom: 6, color: 'var(--muted)' }}>// DEMO CREDENTIALS — TAP TO USE</div>
          <div className="row" onClick={() => quick('employee')}>
            <span><span className="role">EMPLOYEE</span> · priya@workmark.in</span>
            <span>demo123</span>
          </div>
          <div className="row" onClick={() => quick('admin')}>
            <span><span className="role">ADMIN</span> · admin@workmark.in</span>
            <span>demo123</span>
          </div>
        </div>
        <div className="gps-note">⚲  Location access required to clock in</div>
      </div>
    </div>
  );
}

// ============== EMPLOYEE DASHBOARD ==============
function EmployeeDashboard() {
  const { push } = React.useContext(ToastCtx);
  const [gps, setGps] = React.useState('loading'); // loading | ok | fail
  const [gpsDistance, setGpsDistance] = React.useState(0);
  const [clockedIn, setClockedIn] = React.useState(false);
  const [startedAt, setStartedAt] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [shake, setShake] = React.useState(false);
  const [leaveDate, setLeaveDate] = React.useState('2026-05-20');
  const [leaveType, setLeaveType] = React.useState('casual');

  const isSunday = TODAY.day && new Date(2026, 4, TODAY.day).getDay() === 0;

  // GPS check on load
  React.useEffect(() => {
    const t = setTimeout(() => {
      setGps('ok');
      setGpsDistance(42);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  // Timer
  React.useEffect(() => {
    if (!clockedIn) return;
    const i = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, [clockedIn, startedAt]);

  const onClock = () => {
    if (isSunday) {
      setShake(true); setTimeout(() => setShake(false), 500);
      push('Today is Sunday — office closed', 'error'); return;
    }
    if (!clockedIn) {
      if (gps !== 'ok') {
        setShake(true); setTimeout(() => setShake(false), 500);
        push('GPS check failed — you must be within range', 'error'); return;
      }
      setStartedAt(Date.now());
      setClockedIn(true);
      setElapsed(0);
      push('Clocked in at office · session locked', 'success');
    } else {
      setClockedIn(false);
      push(`Clocked out · ${formatTime(elapsed)} recorded`, 'success');
    }
  };

  // GPS toggle (for demo)
  const toggleGps = () => {
    if (gps === 'ok') { setGps('fail'); setGpsDistance(340); }
    else if (gps === 'fail') { setGps('loading'); setTimeout(() => { setGps('ok'); setGpsDistance(42); }, 1200); }
  };

  const submitLeave = (e) => {
    e.preventDefault();
    push(`Leave request submitted for ${leaveDate}`, 'success');
  };

  // Stats — pretend 9 days present, 2 WFH, 1 leave so far in May
  const present = 9, wfh = 2, leaves = 1;
  const workingDaysInMonth = 22;
  const baseSalary = 75000;
  const perDay = baseSalary / workingDaysInMonth;
  const estSalary = present * perDay + wfh * perDay * 0.5;

  const hoursWorked = elapsed / 3600;
  const target = 8;
  const progressPct = Math.min(100, (hoursWorked / target) * 100);
  const timerCls = clockedIn ? (hoursWorked >= target ? 'done' : 'warn') : '';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, Priya.</h1>
          <div className="page-sub">Mon · 11 May 2026 · 09:14 IST</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={toggleGps} title="Demo: toggle GPS state">
          ◉ Simulate GPS
        </button>
      </div>

      <div className="grid-2">
        {/* LEFT: Clock-in panel */}
        <div className="col-stack">
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <GpsBar status={gps} distance={gpsDistance} />
            </div>
            <div className={`timer-display ${timerCls}`}>{formatTime(elapsed)}</div>
            <div className="timer-label">
              {clockedIn
                ? (hoursWorked >= target ? 'Target reached · session active' : 'Session active — server time locked')
                : 'Session not started'}
            </div>
            <button
              className={`clock-btn ${clockedIn ? 'stop' : 'start'}${shake ? ' shake' : ''}`}
              onClick={onClock}
              disabled={isSunday}>
              {clockedIn ? '⏹  End Work' : (isSunday ? 'Today is Sunday — office closed' : '▶  Start Work')}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>11 MAY 2026</span>
            </div>
            <div className="today-info">
              <div className="item">
                <div className="k">Clocked In</div>
                <div className={`v ${clockedIn ? '' : 'dim'}`}>
                  {clockedIn ? new Date(startedAt).toTimeString().slice(0, 5) + ' IST' : '—:—'}
                </div>
              </div>
              <div className="item">
                <div className="k">Target Out</div>
                <div className={`v ${clockedIn ? '' : 'dim'}`}>
                  {clockedIn ? new Date(startedAt + 8 * 3600 * 1000).toTimeString().slice(0, 5) + ' IST' : '—:—'}
                </div>
              </div>
              <div className="item">
                <div className="k">GPS Status</div>
                <div className={`v ${gps === 'ok' ? 'ok' : 'dim'}`}>{gps === 'ok' ? '✓ Office' : gps === 'fail' ? '✗ Out of range' : 'Checking...'}</div>
              </div>
            </div>
            <div className="progress-wrap">
              <div className="progress-meta">
                <span>Daily Hours</span>
                <span>{hoursWorked.toFixed(2)}h / {target}h</span>
              </div>
              <div className={`progress ${hoursWorked >= target ? 'green' : 'yellow'}`}>
                <div style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Request Leave</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>1 / 2 USED THIS MONTH</span>
            </div>
            <form onSubmit={submitLeave} className="inline-row">
              <div>
                <label className="field-label">Date</label>
                <input className="input" type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Type</label>
                <select className="select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="wfh">Work From Home</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>Submit Request</button>
            </form>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', letterSpacing: 0.5 }}>
              // Second leave onwards may incur penalty per company policy
            </div>
          </div>
        </div>

        {/* RIGHT: Stats + Calendar */}
        <div className="col-stack">
          <div className="grid-stats-4" style={{ marginBottom: 0 }}>
            <StatCard label="Days Present" value={present} sub={`of ${workingDaysInMonth} working days`} />
            <StatCard label="Est. Salary" value={formatINR(estSalary)} sub="May 2026 · projected" accent />
            <StatCard label="WFH Days" value={wfh} sub="50% pay rate" />
            <StatCard label="Leaves Used" value={leaves} sub="1 paid / 0 unpaid" />
          </div>
          <AttendanceCalendar empIdx={0} />
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
window.EmployeeDashboard = EmployeeDashboard;
