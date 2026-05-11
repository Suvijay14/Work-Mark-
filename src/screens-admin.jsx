import React from "react";
import { ALL_DEMO_EMPLOYEES, dateKeyForDay, formatINR, genStatusForDay, MONTH_NAME, pad, resolveWorkDay, StatCard, StatusBadge, TODAY, ToastCtx } from "./components";

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function AdminDashboard({ employees, setEmployees, onOpenEmployee }) {
  const { push } = React.useContext(ToastCtx);
  const [pending, setPending] = React.useState([
    { id: "p1", name: "Arjun Mehta", date: "13 May 2026", type: "Casual Leave", isExtra: false },
    { id: "p2", name: "Ananya Gupta", date: "15 May 2026", type: "Sick Leave", isExtra: false },
  ]);
  const [newName, setNewName] = React.useState("");
  const [newRole, setNewRole] = React.useState("");
  const [newSalary, setNewSalary] = React.useState("");

  const decide = (id, accept) => {
    setPending((p) => p.filter((x) => x.id !== id));
    const item = pending.find((x) => x.id === id);
    if (item) push(`${accept ? "Approved" : "Rejected"} · ${item.name}`, accept ? "success" : "error");
  };

  const today = employees.map((e, i) => {
    const s = genStatusForDay(i, TODAY.day);
    const checkInH = 8 + (i % 3);
    const checkInM = 5 + ((i * 13) % 50);
    const hoursWorked = s === "present" ? (1 + i * 0.3).toFixed(2) : s === "wfh" ? (0.8 + i * 0.2).toFixed(2) : "0.00";
    const location = s === "present" ? "Office" : s === "wfh" ? "Home" : "—";
    return { ...e, status: s, checkIn: s === "absent" || s === "leave" ? null : `${pad(checkInH)}:${pad(checkInM)}`, hoursWorked, location };
  });

  const addAllDemoUsers = () => {
    setEmployees(ALL_DEMO_EMPLOYEES);
    push("All demo users added", "success");
  };

  const addNewUser = (e) => {
    e.preventDefault();
    const salaryNum = Number(newSalary);
    if (!newName.trim() || !newRole.trim() || !Number.isFinite(salaryNum) || salaryNum <= 0) {
      push("Please enter valid name, role, and salary", "error");
      return;
    }
    const initials = newName.trim().split(" ").filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") || "NU";
    const colors = ["#E8FF47", "#47FFB2", "#FF6B35", "#7B61FF", "#FF47A8", "#47C7FF", "#FFD447"];
    const next = { id: `e${Date.now()}`, name: newName.trim(), role: newRole.trim(), salary: salaryNum, avatar: colors[employees.length % colors.length], initials };
    setEmployees((prev) => [...prev, next]);
    setNewName("");
    setNewRole("");
    setNewSalary("");
    push(`User added · ${next.name}`, "success");
  };

  const deleteUser = (id) => {
    setEmployees((prev) => {
      if (prev.length <= 1) {
        push("At least one employee is required", "error");
        return prev;
      }
      const target = prev.find((x) => x.id === id);
      if (target) push(`User deleted · ${target.name}`, "success");
      return prev.filter((x) => x.id !== id);
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <div className="page-sub">{employees.length} EMPLOYEES · MAY 2026 · DAY 11 / 22</div>
        </div>
      </div>

      <div className="grid-stats-4">
        <StatCard label="Present Today" value={today.filter((t) => t.status === "present").length} sub="checked in via GPS" />
        <StatCard label="WFH Today" value={today.filter((t) => t.status === "wfh").length} sub="50% pay rate" />
        <StatCard label="Absent / Leave" value={today.filter((t) => t.status === "absent" || t.status === "leave").length} sub="includes pending" />
        <StatCard label="Pending Requests" value={pending.length} sub="awaiting decision" accent />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Live Attendance · 11 May</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--accent2)", letterSpacing: 1 }}>
              ● LIVE
            </span>
          </div>
          {today.map((e) => (
            <div key={e.id} className="emp-row" onClick={() => onOpenEmployee(e.id)} style={{ cursor: "pointer" }}>
              <div className="emp-avatar" style={{ background: e.avatar }}>
                {e.initials}
              </div>
              <div className="emp-info">
                <div className="emp-name">{e.name}</div>
                <div className="emp-meta">{e.checkIn ? `IN ${e.checkIn} · ${e.location}` : "NOT CHECKED IN"}</div>
              </div>
              <div className="emp-hours">{e.hoursWorked}h</div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pending Requests</h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {pending.length} ITEMS
              </span>
            </div>
            {pending.map((p) => (
              <div key={p.id} className="pending-row">
                <div className="pending-info">
                  <div className="date">{p.date}</div>
                  <div>
                    {p.name} · <span style={{ color: "var(--muted)" }}>{p.type}</span>
                  </div>
                </div>
                {p.isExtra && <input className="input penalty-input" placeholder="₹ penalty" />}
                <div className="pending-actions">
                  <button className="btn btn-success btn-sm" onClick={() => decide(p.id, true)}>
                    ✓ Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => decide(p.id, false)}>
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Management</h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {employees.length} USERS
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button className="btn btn-ghost" onClick={addAllDemoUsers}>
                + Add All Demo Users
              </button>
            </div>
            <form onSubmit={addNewUser} className="inline-row" style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr auto" }}>
              <div>
                <label className="field-label">Name</label>
                <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Neha Singh" />
              </div>
              <div>
                <label className="field-label">Role</label>
                <input className="input" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. QA Engineer" />
              </div>
              <div>
                <label className="field-label">Salary</label>
                <input className="input" type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} placeholder="50000" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                + Add User
              </button>
            </form>
            <div className="divider"></div>
            {employees.map((u) => (
              <div key={u.id} className="emp-row">
                <div className="emp-avatar" style={{ background: u.avatar }}>
                  {u.initials}
                </div>
                <div className="emp-info">
                  <div className="emp-name">{u.name}</div>
                  <div className="emp-meta">
                    {u.role} · {formatINR(u.salary)}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminEmployeeDetail({ employees, empId, onBack }) {
  const emp = employees.find((e) => e.id === empId) || employees[0];
  if (!emp) return null;
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <div className="card">
        <div className="page-title" style={{ marginBottom: 10 }}>
          {emp.name}
        </div>
        <div className="page-sub">
          {emp.role} · BASE {formatINR(emp.salary)}/MO · ID {emp.id.toUpperCase()}
        </div>
        <div style={{ marginTop: 14 }}>
          <StatusBadge status="present" />
        </div>
      </div>
    </div>
  );
}

export function AdminWorkCalendar({ calendarRules, setCalendarRules, holidays }) {
  const { push } = React.useContext(ToastCtx);
  const [selectedDay, setSelectedDay] = React.useState(TODAY.day);
  const [reason, setReason] = React.useState("");

  const applySelected = (status) => {
    const key = dateKeyForDay(selectedDay);
    setCalendarRules((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [key]: { status, reason: reason.trim() || `Marked as ${status}` },
      },
    }));
    push(`Updated ${key} as ${status.toUpperCase()}`, "success");
  };

  const clearSelectedOverride = () => {
    const key = dateKeyForDay(selectedDay);
    setCalendarRules((prev) => {
      const next = { ...prev.overrides };
      delete next[key];
      return { ...prev, overrides: next };
    });
    setReason("");
    push("Custom override removed", "success");
  };

  const setSaturdayMode = (mode) => {
    setCalendarRules((prev) => ({ ...prev, saturdayMode: mode }));
    push(`All Saturdays set to ${mode}`, "success");
  };

  const firstDow = new Date(TODAY.year, TODAY.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ empty: true, key: `e-${i}` });
  for (let day = 1; day <= 31; day += 1) {
    const resolved = resolveWorkDay(day, calendarRules, holidays);
    cells.push({ key: `d-${day}`, day, status: resolved.status });
  }

  return (
    <div className="page">
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">May 2026 · Tap Any Day</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              EDITABLE
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
                <button key={c.key} className={`cal-cell ${c.status}${c.day === selectedDay ? " today" : ""}`} onClick={() => setSelectedDay(c.day)}>
                  <span className="day-num">{c.day}</span>
                </button>
              ),
            )}
          </div>
        </div>
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Day Editor</h3>
            </div>
            <div className="page-title" style={{ fontSize: 32 }}>
              {new Date(TODAY.year, TODAY.month, selectedDay).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}
            </div>
            <div style={{ marginTop: 10 }}>
              <label className="field-label">Reason (optional)</label>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Team offsite / maintenance day" />
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <button className="btn btn-success" onClick={() => applySelected("working")}>✓ Mark as Working</button>
              <button className="btn btn-danger" onClick={() => applySelected("off")}>✗ Mark as Off</button>
              <button className="btn btn-ghost" onClick={() => applySelected("custom")}>◇ Mark as Custom</button>
              <button className="btn btn-ghost" onClick={clearSelectedOverride}>Reset to Default</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => setSaturdayMode("off")} style={{ marginBottom: 8 }}>
              All Saturdays → Off (5-day week)
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setSaturdayMode("working")}>
              All Saturdays → Working (6-day week)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSettings({ officeLocation, setOfficeLocation, locationLogs, onLogLocation, holidays, setHolidays }) {
  const { push } = React.useContext(ToastCtx);
  const [lat, setLat] = React.useState(String(officeLocation.lat));
  const [lng, setLng] = React.useState(String(officeLocation.lng));
  const [radius, setRadius] = React.useState(String(officeLocation.radius));
  const [address, setAddress] = React.useState(officeLocation.address || "");
  const [hDate, setHDate] = React.useState("2026-06-15");
  const [hReason, setHReason] = React.useState("");

  const useMyLoc = async () => {
    try {
      const pos = await getBrowserPosition();
      const latVal = pos.coords.latitude.toFixed(6);
      const lngVal = pos.coords.longitude.toFixed(6);
      setLat(latVal);
      setLng(lngVal);
      onLogLocation?.({
        by: "admin",
        action: "capture-office-location",
        timestamp: new Date().toISOString(),
        lat: Number(latVal),
        lng: Number(lngVal),
        distance: 0,
      });
      push("Current location captured", "success");
    } catch (err) {
      push("Unable to capture location. Grant browser location permission.", "error");
    }
  };

  const saveLoc = () => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(radiusNum) || radiusNum <= 0) {
      push("Enter valid latitude, longitude, and radius", "error");
      return;
    }
    setOfficeLocation({
      lat: latNum,
      lng: lngNum,
      radius: radiusNum,
      address: address.trim() || "Office Location",
    });
    push("Office location updated — employee GPS checks now use this", "success");
  };

  const setByAddress = async () => {
    if (!address.trim()) {
      push("Enter office address first", "error");
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address.trim())}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        push("Address not found. Try a more specific address.", "error");
        return;
      }
      const latNum = Number(data[0].lat);
      const lngNum = Number(data[0].lon);
      setLat(latNum.toFixed(6));
      setLng(lngNum.toFixed(6));
      push("Address resolved to coordinates. Save to apply.", "success");
    } catch (err) {
      push("Address lookup failed. Check internet and try again.", "error");
    }
  };

  const declareHoliday = (e) => {
    e.preventDefault();
    if (!hReason.trim()) {
      push("Reason required", "error");
      return;
    }
    const d = new Date(hDate);
    const fmt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setHolidays((prev) => [...prev.filter((x) => x.date !== fmt), { date: fmt, reason: hReason.trim() }]);
    setHReason("");
    push("Holiday declared", "success");
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
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Office GPS Location</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--accent2)", letterSpacing: 1 }}>
              ● ACTIVE
            </span>
          </div>
          <div className="map-preview" style={{ marginBottom: 16 }}>
            <div className="map-coords">
              LAT: <span>{lat}</span> · LNG: <span>{lng}</span>
            </div>
            <div className="map-radius" style={{ width: Math.max(80, Number(radius) * 1.2), height: Math.max(80, Number(radius) * 1.2) }}></div>
            <div className="map-pin"></div>
            <div className="map-scale">RADIUS {radius}M</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label className="field-label">Latitude</label>
              <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Longitude</label>
              <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Radius (m)</label>
              <input className="input" value={radius} onChange={(e) => setRadius(e.target.value)} type="number" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
            <input className="input" placeholder="Office address (e.g. MG Road, Bengaluru)" value={address} onChange={(e) => setAddress(e.target.value)} />
            <button className="btn btn-ghost" onClick={setByAddress}>
              Set By Address
            </button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={useMyLoc}>
              ◉ Use My Location
            </button>
            <button className="btn btn-primary" onClick={saveLoc}>
              Save Location
            </button>
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "DM Mono, monospace", fontSize: 11, color: "var(--muted)", letterSpacing: 0.3 }}>
            // Employees must clock in within {radius}m of this point. GPS and timestamp are captured on clock-in.
          </div>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Salary Configuration</h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                READ-ONLY
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label className="field-label">Working Days / mo</label>
                <input className="input" value="26" disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="field-label">Hours / day</label>
                <input className="input" value="8" disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="field-label">WFH Rate</label>
                <input className="input" value="50%" disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Declare Holiday</h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {holidays.length} TOTAL
              </span>
            </div>
            <form onSubmit={declareHoliday}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 10, marginBottom: 16 }}>
                <div>
                  <label className="field-label">Date</label>
                  <input className="input" type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Reason</label>
                  <input className="input" placeholder="e.g. Diwali" value={hReason} onChange={(e) => setHReason(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: "end", height: 42 }}>
                  + Declare
                </button>
              </div>
            </form>
            <div className="divider"></div>
            {holidays.map((h, i) => (
              <div key={i} className="holiday-list-item">
                <div>
                  <div className="date">{h.date}</div>
                  <div style={{ marginTop: 2 }}>{h.reason}</div>
                </div>
                <span className="badge badge-holiday">Holiday</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="card-header">
          <h3 className="card-title">Recent GPS Check-ins</h3>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {locationLogs.length} ENTRIES
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>By</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            {locationLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="num">
                  No location logs yet. Employee clock-ins will appear here.
                </td>
              </tr>
            ) : (
              locationLogs.map((l, i) => (
                <tr key={`${l.timestamp}-${i}`}>
                  <td className="num">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="num">{l.by}</td>
                  <td className="num">{l.lat}</td>
                  <td className="num">{l.lng}</td>
                  <td className="num">{l.distance}m</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
