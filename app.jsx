// ============== MAIN APP ROUTER ==============
function App() {
  const [auth, setAuth] = React.useState(null); // null | 'employee' | 'admin'
  const [view, setView] = React.useState('employee-dashboard');
  const [empId, setEmpId] = React.useState(null);
  const [employees, setEmployees] = React.useState(INITIAL_EMPLOYEES);

  const onLogin = (role) => {
    setAuth(role);
    setView(role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
  };
  const onLogout = () => { setAuth(null); setView('employee-dashboard'); setEmpId(null); };

  const openEmployee = (id) => { setEmpId(id); setView('admin-employee'); };

  if (!auth) return <LoginScreen onLogin={onLogin} />;

  const userName = auth === 'admin' ? 'Rajesh Kumar' : 'Priya Sharma';

  return (
    <div className="app-shell">
      <TopNav view={view} onNav={setView} role={auth} userName={userName} onLogout={onLogout} />
      {view === 'employee-dashboard' && <EmployeeDashboard />}
      {view === 'admin-dashboard' && (
        <AdminDashboard
          employees={employees}
          setEmployees={setEmployees}
          onOpenEmployee={openEmployee}
        />
      )}
      {view === 'admin-employee' && (
        <AdminEmployeeDetail
          employees={employees}
          empId={empId}
          onBack={() => setView('admin-dashboard')}
        />
      )}
      {view === 'admin-settings' && <AdminSettings />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider><App /></ToastProvider>
);
