// ============== ADMIN DASHBOARD ==============
function AdminDashboard({ employees, setEmployees, onOpenEmployee }) {
  const { push } = React.useContext(ToastCtx);
  const [pending, setPending] = React.useState([
    { id: 'p1', empId: 'e2', name: 'Arjun Mehta', date: '13 May 2026', type: 'Casual Leave', isExtra: false },
    { id: 'p2', empId: 'e5', name: 'Ananya Gupta', date: '15 May 2026', type: 'Sick Leave', isExtra: false },
    { id: 'p3', empId: 'e7', name: 'Kavya Nair', date: '18-19 May 2026', type: 'Casual Leave (2nd)', isExtra: true },
    { id: 'p4', empId: 'e10', name: 'Karthik Rao', date: '21 May 2026', type: 'WFH Request', isExtra: false },
  ]);
  const [fading, setFading] = React.useState({});
  const [penalties, setPenalties] = React.useState({});
  const [newName, setNewName] = React.useState('');
  const [newRole, setNewRole] = React.useState('');
  const [newSalary, setNewSalary] = React.useState('');

  const decide = (id, accept) => {
    setFading(f => ({ ...f, [id]: true }));
    setTimeout(() => {
      setPending(p => p.filter(x => x.id !== id));
      const item = pending.find(x => x.id === id);
      push(`${accept ? 'Approved' : 'Rejected'} · ${item.name}`, accept ? 'success' : 'error');
    }, 400);
  };

  // Live attendance — derived from employee list with today's status
  const today = employees.map((e, i) => {
    const s = genStatusForDay(i, TODAY.day);
    const checkInH = 8 + (i % 3);
    const checkInM = 5 + ((i * 13) % 50);
    const hoursWorked = s === 'present' ? (1 + i * 0.3).toFixed(2) : s === 'wfh' ? (0.8 + i * 0.2).toFixed(2) : '0.00';
    const location = s === 'present' ? 'Office' : s === 'wfh' ? 'Home' : '—';
    return { ...e, idx: i, status: s, checkIn: s === 'absent' || s === 'leave' ? null : `${pad(checkInH)}:${pad(checkInM)}`, hoursWorked, location };
  });

  const presentCount = today.filter(t => t.status === 'present').length;
  const wfhCount = today.filter(t => t.status === 'wfh').length;
  const absentCount = today.filter(t => t.status === 'absent' || t.status === 'leave').length;

  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const wfhDeduction = 18500;
  const leavePenalties = 2400;

  const addAllDemoUsers = () => {
    setEmployees(ALL_DEMO_EMPLOYEES);
    push('All demo users added', 'success');
  };

  const addNewUser = (e) => {
    e.preventDefault();
    const salaryNum = Number(newSalary);
    if (!newName.trim() || !newRole.trim() || !Number.isFinite(salaryNum) || salaryNum <= 0) {
      push('Please enter valid name, role, and salary', 'error');
      return;
    }
    const initials = newName
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('') || 'NU';
    const colors = ['#E8FF47', '#47FFB2', '#FF6B35', '#7B61FF', '#FF47A8', '#47C7FF', '#FFD447'];
    const id = `e${Date.now()}`;
    const next = { id, name: newName.trim(), role: newRole.trim(), salary: salaryNum, avatar: colors[employees.length % colors.length], initials };
    setEmployees(prev => [...prev, next]);
    setNewName('');
    setNewRole('');
    setNewSalary('');
    push(`User added · ${next.name}`, 'success');
  };

  const deleteUser = (id) => {
    setEmployees(prev => {
      if (prev.length <= 1) {
        push('At least one employee is required', 'error');
        return prev;
      }
      const target = prev.find(x => x.id === id);
      const next = prev.filter(x => x.id !== id);
      if (target) push(`User deleted · ${target.name}`, 'success');
      return next;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <div className="page-sub">{employees.length} EMPLOYEES · MAY 2026 · DAY 11 / 22</div>
        </div>
        <button className="btn btn-primary" onClick={() => push('Holiday declaration panel opened', 'success')}>+ Declare Holiday</button>
      </div>

      <div className="grid-stats-4">
        <StatCard label="Present Today" value={presentCount} sub="checked in via GPS" />
        <StatCard label="WFH Today" value={wfhCount} sub="50% pay rate" />
        <StatCard label="Absent / Leave" value={absentCount} sub="includes pending" />
        <StatCard label="Pending Requests" value={pending.length} sub="awaiting decision" accent />
      </div>

      <div className="grid-2">
        {/* LEFT — Live Attendance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Live Attendance · 11 May</h3>
            <span className="mono" style={{ fontSize: 11, color: 'var(--accent2)', letterSpacing: 1 }}>● LIVE</span>
          </div>
          <div>
            {today.slice(0, 8).map(e => (
              <div key={e.id} className="emp-row" onClick={() => onOpenEmployee(e.id)} style={{ cursor: 'pointer' }}>
                <div className="emp-avatar" style={{ background: e.avatar }}>{e.initials}</div>
                <div className="emp-info">
                  <div className="emp-name">{e.name}</div>
                  <div className="emp-meta">
                    {e.checkIn ? `IN ${e.checkIn} · ${e.location}` : e.status === 'leave' ? 'ON LEAVE' : 'NOT CHECKED IN'}
                  </div>
                </div>
                <div className="emp-hours">{e.hoursWorked}h</div>
                <StatusBadge status={e.status === 'absent' ? 'absent' : e.status} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onOpenEmployee('e1')}>View full detail →</button>
          </div>
        </div>

        {/* RIGHT — stacked: Pending + Payroll */}
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pending Requests</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{pending.length} ITEMS</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>
                — All clear —
              </div>
            ) : pending.map(p => (
              <div key={p.id} className={`pending-row${fading[p.id] ? ' fading' : ''}`}>
                <div className="pending-info">
                  <div className="date">{p.date}</div>
                  <div>{p.name} · <span style={{ color: 'var(--muted)' }}>{p.type}</span></div>
                </div>
                {p.isExtra && (
                  <input
                    className="input penalty-input"
                    placeholder="₹ penalty"
                    value={penalties[p.id] || ''}
                    onChange={e => setPenalties(s => ({ ...s, [p.id]: e.target.value }))}
                  />
                )}
                <div className="pending-actions">
                  <button className="btn btn-success btn-sm" onClick={() => decide(p.id, true)}>✓ Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => decide(p.id, false)}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Salary Run · May 2026</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>PROJECTED</span>
            </div>
            <div className="salary-line">
              <span className="lbl">Base Payroll <span className="small">12 employees · gross</span></span>
              <span className="val">{formatINR(totalPayroll)}</span>
            </div>
            <div className="salary-line deduct">
              <span className="lbl">WFH Deductions <span className="small">50% rate · 14 WFH days</span></span>
              <span className="val">− {formatINR(wfhDeduction)}</span>
            </div>
            <div className="salary-line deduct">
              <span className="lbl">Leave Penalties <span className="small">3 extra leaves taken</span></span>
              <span className="val">− {formatINR(leavePenalties)}</span>
            </div>
            <div className="salary-line earn">
              <span className="lbl">Additional Bonuses</span>
              <span className="val">+ ₹0</span>
            </div>
            <div className="salary-line total">
              <span className="lbl">Net Payout</span>
              <span className="val">{formatINR(totalPayroll - wfhDeduction - leavePenalties)}</span>
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop: 12 }}>↓ Export Payroll CSV</button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Management</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{employees.length} USERS</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button className="btn btn-ghost" onClick={addAllDemoUsers}>+ Add All Demo Users</button>
            </div>
            <form onSubmit={addNewUser} className="inline-row" style={{ gridTemplateColumns: '1.2fr 1fr 0.8fr auto' }}>
              <div>
                <label className="field-label">Name</label>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Neha Singh" />
              </div>
              <div>
                <label className="field-label">Role</label>
                <input className="input" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. QA Engineer" />
              </div>
              <div>
                <label className="field-label">Salary</label>
                <input className="input" type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)} placeholder="50000" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>+ Add User</button>
            </form>
            <div className="divider"></div>
            {employees.map(u => (
              <div key={u.id} className="emp-row">
                <div className="emp-avatar" style={{ background: u.avatar }}>{u.initials}</div>
                <div className="emp-info">
                  <div className="emp-name">{u.name}</div>
                  <div className="emp-meta">{u.role} · {formatINR(u.salary)}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== ADMIN EMPLOYEE DETAIL ==============
function AdminEmployeeDetail({ employees, empId, onBack }) {
  const emp = employees.find(e => e.id === empId) || employees[0];
  const empIdx = employees.indexOf(emp);
  const [month, setMonth] = React.useState('may-2026');

  // Build attendance log — last 11 days
  const log = [];
  for (let d = 1; d <= TODAY.day; d++) {
    const status = genStatusForDay(empIdx, d);
    if (status === 'sunday' || status === 'holiday') continue;
    const checkInH = 8 + ((empIdx + d) % 3);
    const checkInM = 5 + (((empIdx + 1) * d * 7) % 50);
    const checkOutH = 17 + ((empIdx + d) % 2);
    const checkOutM = 12 + ((d * 11) % 45);
    const hours = (checkOutH - checkInH) + (checkOutM - checkInM) / 60;
    log.push({
      date: `${pad(d)} May`,
      checkIn: status === 'present' || status === 'wfh' ? `${pad(checkInH)}:${pad(checkInM)}` : '—',
      checkOut: status === 'present' || status === 'wfh' ? `${pad(checkOutH)}:${pad(checkOutM)}` : '—',
      hours: status === 'present' || status === 'wfh' ? hours.toFixed(2) : '0.00',
      gps: status === 'present' ? 'office' : status === 'wfh' ? 'home' : 'none',
      status,
    });
  }

  const present = log.filter(l => l.status === 'present').length;
  const wfh = log.filter(l => l.status === 'wfh').length;
  const leaves = log.filter(l => l.status === 'leave').length;
  const absent = log.filter(l => l.status === 'absent').length;

  const workingDays = 22;
  const perDay = emp.salary / workingDays;
  const presentPay = present * perDay;
  const wfhPay = wfh * perDay * 0.5;
  const paidLeavePay = Math.min(leaves, 1) * perDay;
  const holidayPay = 2 * perDay;
  const extraLeavePenalty = Math.max(0, leaves - 1) * 500;
  const finalPay = presentPay + wfhPay + paidLeavePay + holidayPay - extraLeavePenalty;

  // GPS audit
  const gpsLog = log.filter(l => l.status === 'present').slice(0, 6).map((l, i) => ({
    date: l.date,
    lat: (12.9716 + (i * 0.0003)).toFixed(6),
    lng: (77.5946 + (i * 0.0002)).toFixed(6),
    distance: 28 + (i * 7) + '',
  }));

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>← Back to Dashboard</button>
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="emp-avatar" style={{ background: emp.avatar, width: 56, height: 56, fontSize: 18 }}>{emp.initials}</div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{emp.name}</h1>
            <div className="page-sub">{emp.role} · BASE {formatINR(emp.salary)}/MO · ID {emp.id.toUpperCase()}</div>
          </div>
        </div>
        <select className="select" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 200 }}>
          <option value="may-2026">May 2026</option>
          <option value="apr-2026">April 2026</option>
          <option value="mar-2026">March 2026</option>
        </select>
      </div>

      <div className="grid-stats-4">
        <StatCard label="Present Days" value={present} sub={`of ${workingDays} working days`} />
        <StatCard label="WFH Days" value={wfh} sub="at 50% pay rate" />
        <StatCard label="Paid Leave" value={leaves} sub={extraLeavePenalty > 0 ? `${leaves - 1} extra · penalty applied` : 'within allowance'} />
        <StatCard label="Final Payout" value={formatINR(finalPay)} sub="May 2026 · net" accent />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Attendance Log · {MONTH_NAME}</h3>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{log.length} ENTRIES</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>GPS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={i}>
                    <td className="num">{l.date}</td>
                    <td className="num">{l.checkIn}</td>
                    <td className="num">{l.checkOut}</td>
                    <td className="num">{l.hours}h</td>
                    <td>
                      {l.gps === 'office' && <span style={{ color: 'var(--accent2)', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>✓ Office</span>}
                      {l.gps === 'home' && <span style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>⌂ Home</span>}
                      {l.gps === 'none' && <span style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>—</span>}
                    </td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Salary Breakdown</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{MONTH_NAME.toUpperCase()}</span>
            </div>
            <div className="salary-line earn">
              <span className="lbl">Present <span className="small">{present} days × {formatINR(perDay)}</span></span>
              <span className="val">+ {formatINR(presentPay)}</span>
            </div>
            <div className="salary-line earn">
              <span className="lbl">WFH <span className="small">{wfh} days × {formatINR(perDay * 0.5)} (50%)</span></span>
              <span className="val">+ {formatINR(wfhPay)}</span>
            </div>
            <div className="salary-line earn">
              <span className="lbl">Paid Leave <span className="small">{Math.min(leaves, 1)} day allowance</span></span>
              <span className="val">+ {formatINR(paidLeavePay)}</span>
            </div>
            <div className="salary-line earn">
              <span className="lbl">Public Holidays <span className="small">2 days (Labour Day, Buddha Purnima)</span></span>
              <span className="val">+ {formatINR(holidayPay)}</span>
            </div>
            {extraLeavePenalty > 0 && (
              <div className="salary-line deduct">
                <span className="lbl">Extra Leave Penalty <span className="small">{leaves - 1} extra leave × ₹500</span></span>
                <span className="val">− {formatINR(extraLeavePenalty)}</span>
              </div>
            )}
            <div className="salary-line total">
              <span className="lbl">Net Payout</span>
              <span className="val">{formatINR(finalPay)}</span>
            </div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 14 }}>↓ Download Salary Slip</button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">GPS Audit Log</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>TAMPER-PROOF</span>
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', marginBottom: 10, letterSpacing: 0.3 }}>
              // Server-side location record · dispute resolution
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lat</th>
                  <th>Lng</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {gpsLog.map((g, i) => (
                  <tr key={i}>
                    <td className="num">{g.date}</td>
                    <td className="num">{g.lat}</td>
                    <td className="num">{g.lng}</td>
                    <td className="num">{g.distance}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== ADMIN SETTINGS ==============
function AdminSettings() {
  const { push } = React.useContext(ToastCtx);
  const [lat, setLat] = React.useState('12.971600');
  const [lng, setLng] = React.useState('77.594600');
  const [radius, setRadius] = React.useState('150');
  const [hDate, setHDate] = React.useState('2026-06-15');
  const [hReason, setHReason] = React.useState('');
  const [holidays, setHolidays] = React.useState([
    { date: '01 May 2026', reason: 'Labour Day', past: true },
    { date: '25 May 2026', reason: 'Buddha Purnima', past: false },
    { date: '15 Aug 2026', reason: 'Independence Day', past: false },
    { date: '02 Oct 2026', reason: 'Gandhi Jayanti', past: false },
  ]);

  const useMyLoc = () => {
    push('Location captured · 12.9716°N, 77.5946°E', 'success');
  };
  const saveLoc = () => {
    push('Office location updated · all employees notified', 'success');
  };
  const declareHoliday = (e) => {
    e.preventDefault();
    if (!hReason) { push('Reason required', 'error'); return; }
    const d = new Date(hDate);
    const fmt = `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`;
    setHolidays([...holidays, { date: fmt, reason: hReason, past: false }]);
    setHReason('');
    push('Holiday declared · payroll updated', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">OFFICE CONFIG · PAYROLL · HOLIDAYS</div>
        </div>
      </div>

      <div className="grid-2">
        {/* LEFT — Office GPS */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Office GPS Location</h3>
            <span className="mono" style={{ fontSize: 11, color: 'var(--accent2)', letterSpacing: 1 }}>● ACTIVE</span>
          </div>
          <div className="map-preview" style={{ marginBottom: 16 }}>
            <div className="map-coords">
              LAT: <span>{lat}</span> · LNG: <span>{lng}</span>
            </div>
            <div className="map-radius" style={{ width: parseInt(radius) * 1.2, height: parseInt(radius) * 1.2 }}></div>
            <div className="map-pin"></div>
            <div className="map-scale">RADIUS {radius}M</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label className="field-label">Latitude</label>
              <input className="input" value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Longitude</label>
              <input className="input" value={lng} onChange={e => setLng(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Radius (m)</label>
              <input className="input" value={radius} onChange={e => setRadius(e.target.value)} type="number" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={useMyLoc}>◉ Use My Location</button>
            <button className="btn btn-primary" onClick={saveLoc}>Save Location</button>
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: 0.3 }}>
            // Employees must clock in within {radius}m of this point. GPS is verified server-side before timestamp is recorded.
          </div>
        </div>

        <div className="col-stack">
          {/* Salary Config */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Salary Configuration</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>READ-ONLY</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label className="field-label">Working Days / mo</label>
                <input className="input" value="26" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="field-label">Hours / day</label>
                <input className="input" value="8" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="field-label">WFH Rate</label>
                <input className="input" value="50%" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div style={{ marginTop: 14, fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: 0.3 }}>
              // Fixed per company policy · contact founder to change
            </div>
          </div>

          {/* Holiday */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Declare Holiday</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{holidays.filter(h => !h.past).length} UPCOMING</span>
            </div>
            <form onSubmit={declareHoliday}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 10, marginBottom: 16 }}>
                <div>
                  <label className="field-label">Date</label>
                  <input className="input" type="date" value={hDate} onChange={e => setHDate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Reason</label>
                  <input className="input" placeholder="e.g. Diwali" value={hReason} onChange={e => setHReason(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'end', height: 42 }}>+ Declare</button>
              </div>
            </form>
            <div className="divider"></div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Declared Holidays · 2026
            </div>
            {holidays.map((h, i) => (
              <div key={i} className="holiday-list-item">
                <div>
                  <div className="date">{h.date}</div>
                  <div style={{ marginTop: 2 }}>{h.reason}</div>
                </div>
                <span className={`badge ${h.past ? 'badge-pending' : 'badge-holiday'}`}>{h.past ? 'Past' : 'Upcoming'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
window.AdminEmployeeDetail = AdminEmployeeDetail;
window.AdminSettings = AdminSettings;
