import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const MainLayout = ({ theme, cycleTheme, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-background p-2 transition-all duration-500">
      
      {/* FIXED SIDEBAR */}
      <aside className="w-16 border flex flex-col items-center py-6 shrink-0 bg-card rounded-l-xl text-card-foreground">
        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-black text-[10px] mb-10 rounded-sm">POS</div>
        <nav className="flex flex-col gap-8 flex-1 text-muted-foreground">
          <button 
            onClick={() => navigate('/dashboard')} 
            className={`text-xl ${location.pathname.includes('/dashboard') ? 'text-foreground' : ''}`}
          >◫</button>
          <button 
            onClick={() => navigate('/inventory')} 
            className={`text-xl ${location.pathname.includes('/inventory') ? 'text-foreground' : ''}`}
          >📦</button>
          <button 
            onClick={() => navigate('/voucher-generation')} 
            className={`text-xl ${location.pathname.includes('/voucher-generation') ? 'text-foreground' : ''}`}
          >🎁</button> {/* NEW BUTTON */}
          <button 
            onClick={() => navigate('/vouchers')} 
            className={`text-xl ${location.pathname.includes('/vouchers') ? 'text-foreground' : ''}`}
          >🧾</button>
          <button 
            onClick={() => navigate('/customers')} 
            className={`text-xl ${location.pathname.includes('/customers') ? 'text-foreground' : ''}`}
          >👥</button>
          <button onClick={cycleTheme} className="text-xl">☀️</button>
        </nav>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} className="text-destructive/60 text-[10px] font-bold">EXIT</button>
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-card border-y rounded-r-xl text-foreground">
        <header className="h-14 border-b px-8 flex justify-between items-center shrink-0 bg-background/50">
          <h1 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground">
            {location.pathname.replace('/', '')}_View
          </h1>
          <span className="text-[9px] font-bold text-muted-foreground tracking-widest">{user?.username}</span>
        </header>

        {/* This is where Dashboard or Inventory will be "called" */}
        <div className="flex-1 overflow-y-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default MainLayout;