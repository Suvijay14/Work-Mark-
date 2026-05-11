import React from "react";

export const ALL_DEMO_EMPLOYEES = [
  { id: "e1", name: "Priya Sharma", role: "Senior Developer", salary: 75000, avatar: "#E8FF47", initials: "PS" },
  { id: "e2", name: "Arjun Mehta", role: "Product Designer", salary: 68000, avatar: "#47FFB2", initials: "AM" },
  { id: "e3", name: "Sneha Reddy", role: "Operations Lead", salary: 82000, avatar: "#FF6B35", initials: "SR" },
  { id: "e4", name: "Rahul Iyer", role: "Backend Developer", salary: 70000, avatar: "#7B61FF", initials: "RI" },
  { id: "e5", name: "Ananya Gupta", role: "QA Engineer", salary: 55000, avatar: "#FF47A8", initials: "AG" },
  { id: "e6", name: "Vikram Singh", role: "DevOps", salary: 78000, avatar: "#47C7FF", initials: "VS" },
  { id: "e7", name: "Kavya Nair", role: "Marketing", salary: 52000, avatar: "#FFD447", initials: "KN" },
  { id: "e8", name: "Rohan Bhatt", role: "Frontend Developer", salary: 65000, avatar: "#47FFB2", initials: "RB" },
  { id: "e9", name: "Meera Pillai", role: "HR Manager", salary: 72000, avatar: "#E8FF47", initials: "MP" },
  { id: "e10", name: "Karthik Rao", role: "Sales Lead", salary: 80000, avatar: "#FF6B35", initials: "KR" },
  { id: "e11", name: "Divya Krishnan", role: "Accountant", salary: 58000, avatar: "#7B61FF", initials: "DK" },
  { id: "e12", name: "Ishaan Joshi", role: "Intern", salary: 25000, avatar: "#FF47A8", initials: "IJ" },
];

export const INITIAL_EMPLOYEES = [ALL_DEMO_EMPLOYEES[0]];
export const TODAY = { year: 2026, month: 4, day: 11 };
export const MONTH_NAME = "May 2026";
export const DAYS_IN_MONTH = 31;
export const DEFAULT_CALENDAR_RULES = {
  saturdayMode: "off",
  overrides: {},
};
export const HOLIDAYS = [
  { date: "2026-05-01", reason: "Labour Day" },
  { date: "2026-05-25", reason: "Buddha Purnima" },
];

export function genStatusForDay(empIdx, day) {
  const date = new Date(2026, 4, day);
  const dow = date.getDay();
  if (dow === 0) return "sunday";
  const dateStr = `2026-05-${String(day).padStart(2, "0")}`;
  if (HOLIDAYS.find((h) => h.date === dateStr)) return "holiday";
  if (day > TODAY.day) return "future";
  const seed = (empIdx * 31 + day * 17) % 100;
  if (seed < 70) return "present";
  if (seed < 85) return "wfh";
  if (seed < 93) return "leave";
  return "absent";
}

export function formatINR(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function dateKeyForDay(day) {
  return `${TODAY.year}-${pad(TODAY.month + 1)}-${pad(day)}`;
}

export function resolveWorkDay(day, calendarRules, holidays) {
  const key = dateKeyForDay(day);
  const override = calendarRules?.overrides?.[key];
  if (override) {
    return { status: override.status, reason: override.reason || "Manual override" };
  }
  const holiday = holidays.find((h) => h.date === key);
  if (holiday) return { status: "holiday", reason: holiday.reason };
  const dow = new Date(TODAY.year, TODAY.month, day).getDay();
  if (dow === 0) return { status: "off", reason: "Sunday" };
  if (dow === 6) {
    return calendarRules?.saturdayMode === "working"
      ? { status: "working", reason: "Saturday working day" }
      : { status: "off", reason: "Saturday off" };
  }
  return { status: "working", reason: "Regular working day" };
}

export function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const ToastCtx = React.createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((msg, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span className="toast-dot"></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span className="dot"></span>
      <span>
        <span className="work">Work</span>
        <span className="mark">Mark</span>
      </span>
    </div>
  );
}

export function TopNav({ view, onNav, role, onLogout, userName }) {
  const tabs =
    role === "admin"
      ? [
          { id: "admin-dashboard", label: "Admin Dashboard" },
          { id: "admin-work-calendar", label: "Work Calendar" },
          { id: "employee-dashboard", label: "Employee View" },
          { id: "employee-calendar", label: "Employee Calendar" },
          { id: "admin-settings", label: "Settings" },
        ]
      : [
          { id: "employee-dashboard", label: "My Dashboard" },
          { id: "employee-calendar", label: "Work Schedule" },
        ];
  const initials = userName ? userName.split(" ").map((s) => s[0]).slice(0, 2).join("") : "?";

  return (
    <nav className="topnav">
      <Logo />
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={view === t.id || (t.id === "admin-dashboard" && view === "admin-employee") ? "active" : ""}
            onClick={() => onNav(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Live · IST</span>
        </div>
        <div className="avatar" title={userName} onClick={onLogout} style={{ cursor: "pointer" }}>
          {initials}
        </div>
      </div>
    </nav>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const labels = {
    present: "Present",
    wfh: "WFH",
    absent: "Absent",
    leave: "Leave",
    pending: "Pending",
    holiday: "Holiday",
    sunday: "Sunday",
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function GpsBar({ status, distance }) {
  if (status === "loading") {
    return (
      <div className="gps-bar loading">
        <span className="gps-dot"></span>
        <span>Checking your location...</span>
        <span className="meta">GPS · ACQUIRING</span>
      </div>
    );
  }
  if (status === "ok") {
    return (
      <div className="gps-bar ok">
        <span className="gps-dot"></span>
        <span>You are {distance}m from office · Within range</span>
        <span className="meta">12.9716°N, 77.5946°E</span>
      </div>
    );
  }
  return (
    <div className="gps-bar fail">
      <span className="gps-dot"></span>
      <span>You are {distance}m from office · Out of range</span>
      <span className="meta">12.9852°N, 77.6201°E</span>
    </div>
  );
}

export function AttendanceCalendar({ empIdx = 0 }) {
  const firstDow = new Date(2026, 4, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ empty: true, key: `e-${i}` });
  for (let d = 1; d <= DAYS_IN_MONTH; d += 1) {
    const status = genStatusForDay(empIdx, d);
    const isToday = d === TODAY.day;
    cells.push({ key: `d-${d}`, day: d, status, isToday });
  }
  const tooltipText = (c) => {
    if (c.status === "present") return `Present · 8h ${10 + (c.day % 45)}m`;
    if (c.status === "wfh") return "WFH · 6h 30m (50% pay)";
    if (c.status === "leave") return "Casual Leave";
    if (c.status === "absent") return "Absent · unpaid";
    if (c.status === "sunday") return "Sunday · closed";
    if (c.status === "holiday") return "Public holiday";
    if (c.status === "future") return "Upcoming";
    return "";
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Attendance — {MONTH_NAME}</h3>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>
          RECORDED
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
            <div key={c.key} className={`cal-cell ${c.status}${c.isToday ? " today" : ""}`}>
              <span className="day-num">{c.day}</span>
              {tooltipText(c) && <span className="tt">{tooltipText(c)}</span>}
            </div>
          ),
        )}
      </div>
      <div className="cal-legend">
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "rgba(71,255,178,0.5)" }}></span>Present
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "rgba(232,255,71,0.5)" }}></span>WFH
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "rgba(255,107,53,0.5)" }}></span>Leave
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "rgba(255,69,69,0.5)" }}></span>Absent
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "var(--surface3)" }}></span>Holiday
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: "var(--surface)" }}></span>Sunday
        </div>
      </div>
    </div>
  );
}
