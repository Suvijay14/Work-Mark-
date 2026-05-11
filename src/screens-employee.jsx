import React from "react";
import { formatINR, formatTime, GpsBar, resolveWorkDay, StatCard, TODAY, ToastCtx } from "./components";

function distanceMeters(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const q1 = Math.sin(dLat / 2) ** 2;
  const q2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(q1 + q2), Math.sqrt(1 - q1 - q2));
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [err, setErr] = React.useState("");

  const submit = (e) => {
    e?.preventDefault();
    if (email === "admin@workmark.in" && pwd === "demo123") return onLogin("admin");
    if (email === "priya@workmark.in" && pwd === "demo123") return onLogin("employee");
    setErr("Invalid credentials. Try a demo login below.");
  };

  const quick = (role) => {
    if (role === "admin") {
      setEmail("admin@workmark.in");
      setPwd("demo123");
      setTimeout(() => onLogin("admin"), 120);
    } else {
      setEmail("priya@workmark.in");
      setPwd("demo123");
      setTimeout(() => onLogin("employee"), 120);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <span className="work">Work</span>
          <span className="mark">Mark</span>
        </div>
        <div className="login-sub">Attendance · Payroll · v2.4</div>
        <form onSubmit={submit}>
          <label className="field-label">Email</label>
          <input className="input" type="email" placeholder="you@workmark.in" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }} />
          <label className="field-label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} style={{ marginBottom: 18 }} />
          {err && <div style={{ background: "rgba(255,69,69,0.1)", color: "var(--danger)", padding: "10px 12px", borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: "DM Mono, monospace" }}>{err}</div>}
          <button type="submit" className="btn btn-primary btn-full" style={{ padding: "13px 18px", fontSize: 14 }}>
            Sign In
          </button>
        </form>
        <div className="demo-creds">
          <div style={{ marginBottom: 6, color: "var(--muted)" }}>// DEMO CREDENTIALS — TAP TO USE</div>
          <div className="row" onClick={() => quick("employee")}>
            <span>
              <span className="role">EMPLOYEE</span> · priya@workmark.in
            </span>
            <span>demo123</span>
          </div>
          <div className="row" onClick={() => quick("admin")}>
            <span>
              <span className="role">ADMIN</span> · admin@workmark.in
            </span>
            <span>demo123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmployeeDashboard({ officeLocation, onLogLocation, calendarRules, holidays }) {
  const { push } = React.useContext(ToastCtx);
  const [gps, setGps] = React.useState("loading");
  const [gpsDistance, setGpsDistance] = React.useState(0);
  const [coords, setCoords] = React.useState(null);
  const [clockedIn, setClockedIn] = React.useState(false);
  const [startedAt, setStartedAt] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [shake, setShake] = React.useState(false);
  const [leaveDate, setLeaveDate] = React.useState("2026-05-20");
  const [leaveType, setLeaveType] = React.useState("casual");
  const todayRule = resolveWorkDay(TODAY.day, calendarRules, holidays);
  const isOffDay = todayRule.status === "off" || todayRule.status === "holiday";

  React.useEffect(() => {
    let mounted = true;
    const checkGps = async () => {
      setGps("loading");
      try {
        const pos = await getBrowserPosition();
        if (!mounted) return;
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = Math.round(distanceMeters(c.lat, c.lng, officeLocation.lat, officeLocation.lng));
        setCoords(c);
        setGpsDistance(dist);
        setGps(dist <= officeLocation.radius ? "ok" : "fail");
      } catch (err) {
        if (!mounted) return;
        setGps("fail");
        push("Location permission denied or unavailable", "error");
      }
    };
    checkGps();
    return () => {
      mounted = false;
    };
  }, [officeLocation.lat, officeLocation.lng, officeLocation.radius, push]);

  React.useEffect(() => {
    if (!clockedIn || !startedAt) return undefined;
    const i = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, [clockedIn, startedAt]);

  const onClock = async () => {
    if (isOffDay) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      push(`Today is ${todayRule.status.toUpperCase()} — ${todayRule.reason}`, "error");
      return;
    }
    if (!clockedIn) {
      let currentCoords = coords;
      let currentDistance = gpsDistance;
      try {
        const pos = await getBrowserPosition();
        currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        currentDistance = Math.round(distanceMeters(currentCoords.lat, currentCoords.lng, officeLocation.lat, officeLocation.lng));
        setCoords(currentCoords);
        setGpsDistance(currentDistance);
        setGps(currentDistance <= officeLocation.radius ? "ok" : "fail");
      } catch (err) {
        setGps("fail");
      }
      if (!currentCoords || currentDistance > officeLocation.radius) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        push(`GPS verification failed — must be within ${officeLocation.radius}m`, "error");
        return;
      }
      setStartedAt(Date.now());
      setClockedIn(true);
      setElapsed(0);
      onLogLocation?.({
        by: "employee",
        action: "clock-in",
        timestamp: new Date().toISOString(),
        lat: Number(currentCoords.lat.toFixed(6)),
        lng: Number(currentCoords.lng.toFixed(6)),
        distance: currentDistance,
      });
      push(`Clocked in · ${currentDistance}m from office`, "success");
      return;
    }
    setClockedIn(false);
    push(`Clocked out · ${formatTime(elapsed)} recorded`, "success");
  };

  const toggleGps = () => {
    if (gps === "ok") setGps("fail");
    else setGps("ok");
  };

  const submitLeave = (e) => {
    e.preventDefault();
    push(`Leave request submitted for ${leaveDate}`, "success");
  };

  const present = 9;
  const wfh = 2;
  const leaves = 1;
  const workingDaysInMonth = 22;
  const baseSalary = 75000;
  const perDay = baseSalary / workingDaysInMonth;
  const estSalary = present * perDay + wfh * perDay * 0.5;
  const hoursWorked = elapsed / 3600;
  const target = 8;
  const progressPct = Math.min(100, (hoursWorked / target) * 100);
  const timerCls = clockedIn ? (hoursWorked >= target ? "done" : "warn") : "";

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
        <div className="col-stack">
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <GpsBar status={gps} distance={gpsDistance} />
            </div>
            <div className={`timer-display ${timerCls}`}>{formatTime(elapsed)}</div>
            <div className="timer-label">{clockedIn ? (hoursWorked >= target ? "Target reached · session active" : "Session active — server time locked") : "Session not started"}</div>
            <button className={`clock-btn ${clockedIn ? "stop" : "start"}${shake ? " shake" : ""}`} onClick={onClock} disabled={isOffDay}>
              {clockedIn ? "⏹  End Work" : isOffDay ? `${todayRule.status.toUpperCase()} DAY` : "▶  Start Work"}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Request Leave</h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                1 / 2 USED THIS MONTH
              </span>
            </div>
            <form onSubmit={submitLeave} className="inline-row">
              <div>
                <label className="field-label">Date</label>
                <input className="input" type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Type</label>
                <select className="select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="wfh">Work From Home</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                Submit Request
              </button>
            </form>
          </div>
        </div>

        <div className="col-stack">
          <div className="grid-stats-4" style={{ marginBottom: 0 }}>
            <StatCard label="Days Present" value={present} sub={`of ${workingDaysInMonth} working days`} />
            <StatCard label="Est. Salary" value={formatINR(estSalary)} sub="May 2026 · projected" accent />
            <StatCard label="WFH Days" value={wfh} sub="50% pay rate" />
            <StatCard label="Leaves Used" value={leaves} sub="1 paid / 0 unpaid" />
          </div>
          <EmployeeWorkCalendar calendarRules={calendarRules} holidays={holidays} compact />
        </div>
      </div>
    </div>
  );
}

export function EmployeeWorkCalendar({ calendarRules, holidays, compact = false }) {
  const firstDow = new Date(TODAY.year, TODAY.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ empty: true, key: `e-${i}` });
  for (let day = 1; day <= 31; day += 1) {
    const resolved = resolveWorkDay(day, calendarRules, holidays);
    cells.push({ key: `d-${day}`, day, status: resolved.status, reason: resolved.reason });
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Work Schedule · May 2026</h3>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {compact ? "SYNCED FROM ADMIN" : "EMPLOYEE VIEW"}
        </span>
      </div>
      <div className="cal-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`h-${i}`} className="cal-head">
            {d}
          </div>
        ))}
        {cells.map((c) =>
          c.empty ? (
            <div key={c.key} className="cal-cell empty"></div>
          ) : (
            <div key={c.key} className={`cal-cell ${c.status}${c.day === TODAY.day ? " today" : ""}`}>
              <span className="day-num">{c.day}</span>
              <span className="tt">{c.reason}</span>
            </div>
          ),
        )}
      </div>
      {!compact && (
        <div className="cal-legend">
          <div className="legend-item"><span className="legend-swatch" style={{ background: "rgba(71,255,178,0.18)" }}></span>Working</div>
          <div className="legend-item"><span className="legend-swatch" style={{ background: "rgba(255,69,69,0.16)" }}></span>Off</div>
          <div className="legend-item"><span className="legend-swatch" style={{ background: "var(--surface3)" }}></span>Holiday</div>
          <div className="legend-item"><span className="legend-swatch" style={{ background: "rgba(232,255,71,0.16)" }}></span>Custom</div>
        </div>
      )}
    </div>
  );
}
