import React from "react";
import { DEFAULT_CALENDAR_RULES, HOLIDAYS, INITIAL_EMPLOYEES, TopNav } from "./components";
import { AdminDashboard, AdminEmployeeDetail, AdminSettings, AdminWorkCalendar } from "./screens-admin";
import { EmployeeDashboard, EmployeeWorkCalendar, LoginScreen } from "./screens-employee";

export default function App() {
  const [auth, setAuth] = React.useState(null);
  const [view, setView] = React.useState("employee-dashboard");
  const [empId, setEmpId] = React.useState(null);
  const [employees, setEmployees] = React.useState(INITIAL_EMPLOYEES);
  const [officeLocation, setOfficeLocation] = React.useState({
    lat: 12.9716,
    lng: 77.5946,
    radius: 150,
    address: "Bengaluru Office",
  });
  const [locationLogs, setLocationLogs] = React.useState([]);
  const [calendarRules, setCalendarRules] = React.useState(DEFAULT_CALENDAR_RULES);
  const [holidays, setHolidays] = React.useState(HOLIDAYS);

  const onLogin = (role) => {
    setAuth(role);
    setView(role === "admin" ? "admin-dashboard" : "employee-dashboard");
  };

  const onLogout = () => {
    setAuth(null);
    setView("employee-dashboard");
    setEmpId(null);
  };

  if (!auth) return <LoginScreen onLogin={onLogin} />;

  const userName = auth === "admin" ? "Rajesh Kumar" : "Priya Sharma";

  return (
    <div className="app-shell">
      <TopNav view={view} onNav={setView} role={auth} userName={userName} onLogout={onLogout} />
      {view === "employee-dashboard" && (
        <EmployeeDashboard
          officeLocation={officeLocation}
          onLogLocation={(entry) => setLocationLogs((prev) => [entry, ...prev].slice(0, 50))}
          calendarRules={calendarRules}
          holidays={holidays}
        />
      )}
      {view === "employee-calendar" && (
        <EmployeeWorkCalendar
          calendarRules={calendarRules}
          holidays={holidays}
        />
      )}
      {view === "admin-dashboard" && <AdminDashboard employees={employees} setEmployees={setEmployees} onOpenEmployee={(id) => { setEmpId(id); setView("admin-employee"); }} />}
      {view === "admin-work-calendar" && (
        <AdminWorkCalendar
          calendarRules={calendarRules}
          setCalendarRules={setCalendarRules}
          holidays={holidays}
        />
      )}
      {view === "admin-employee" && <AdminEmployeeDetail employees={employees} empId={empId} onBack={() => setView("admin-dashboard")} />}
      {view === "admin-settings" && (
        <AdminSettings
          officeLocation={officeLocation}
          setOfficeLocation={setOfficeLocation}
          locationLogs={locationLogs}
          onLogLocation={(entry) => setLocationLogs((prev) => [entry, ...prev].slice(0, 50))}
          holidays={holidays}
          setHolidays={setHolidays}
        />
      )}
    </div>
  );
}
