import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ConditionalThemeToggle } from '@/components/ConditionalThemeToggle';
import { 
  Calendar, 
  LogOut, 
  Users, 
  UserCog, 
  CalendarDays, 
  Ban, 
  CalendarCheck,
  BarChart3,
  Menu,
  X,
  Settings,
  CalendarPlus,
  FileUp
} from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminProfessionals from './AdminProfessionals';
import AdminAppointments from './AdminAppointments';
import AdminBlockedDays from './AdminBlockedDays';
import AdminAvailableDays from './AdminAvailableDays';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminMyBooking from './AdminMyBooking';
import AdminImportUsers from './AdminImportUsers';

type AdminTab = 'appointments' | 'users' | 'professionals' | 'blocked' | 'available' | 'reports' | 'settings' | 'mybooking' | 'import';

interface AdminDashboardProps {
  showSettings?: boolean;
  roleLabel?: string;
}

export default function AdminDashboard({ showSettings = false, roleLabel = 'Admin' }: AdminDashboardProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(roleLabel === 'Desenvolvedor' ? 'appointments' : 'mybooking');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Developer doesn't need booking (uses separate personal account)
  const isDeveloper = roleLabel === 'Desenvolvedor';
  
  const baseTabs = isDeveloper ? [
    { id: 'appointments' as AdminTab, label: 'Agendamentos', icon: CalendarDays },
    { id: 'users' as AdminTab, label: 'Usuários', icon: Users },
    { id: 'professionals' as AdminTab, label: 'Profissionais', icon: UserCog },
    { id: 'import' as AdminTab, label: 'Importar Usuários', icon: FileUp },
    { id: 'available' as AdminTab, label: 'Disponibilidade', icon: CalendarCheck },
    { id: 'blocked' as AdminTab, label: 'Dias Bloqueados', icon: Ban },
    { id: 'reports' as AdminTab, label: 'Relatórios', icon: BarChart3 },
  ] : [
    { id: 'mybooking' as AdminTab, label: 'Meu Agendamento', icon: CalendarPlus },
    { id: 'appointments' as AdminTab, label: 'Agendamentos', icon: CalendarDays },
    { id: 'users' as AdminTab, label: 'Usuários', icon: Users },
    { id: 'professionals' as AdminTab, label: 'Profissionais', icon: UserCog },
    { id: 'import' as AdminTab, label: 'Importar Usuários', icon: FileUp },
    { id: 'available' as AdminTab, label: 'Disponibilidade', icon: CalendarCheck },
    { id: 'blocked' as AdminTab, label: 'Dias Bloqueados', icon: Ban },
    { id: 'reports' as AdminTab, label: 'Relatórios', icon: BarChart3 },
  ];

  // Only add settings tab if showSettings is true (developer role)
  const tabs = showSettings 
    ? [...baseTabs, { id: 'settings' as AdminTab, label: 'Configurações', icon: Settings }]
    : baseTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'mybooking':
        return <AdminMyBooking />;
      case 'appointments':
        return <AdminAppointments />;
      case 'users':
        return <AdminUsers />;
      case 'professionals':
        return <AdminProfessionals />;
      case 'import':
        return <AdminImportUsers />;
      case 'blocked':
        return <AdminBlockedDays />;
      case 'available':
        return <AdminAvailableDays />;
      case 'reports':
        return <AdminReports />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <img 
                  src="/anadem-icon.png" 
                  alt="Anadem" 
                  className="h-8 w-8"
                />
              </div>
              <div>
                <span className="font-semibold text-sidebar-foreground block">{roleLabel}</span>
                <span className="text-xs text-sidebar-foreground/80">{profile?.name}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-secondary/50'}
                `}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-secondary/50"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ConditionalThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
