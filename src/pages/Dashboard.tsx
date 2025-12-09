import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import UserDashboard from '@/components/user/UserDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import ProfessionalDashboard from '@/components/professional/ProfessionalDashboard';
import ForcePasswordChange from '@/components/ForcePasswordChange';

export default function Dashboard() {
  const { user, profile, loading, isAdmin, isProfessional, isDeveloper, isSuspended, suspendedUntil, mustChangePassword, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user must change password
  useEffect(() => {
    if (profile && mustChangePassword) {
      setShowPasswordChange(true);
    }
  }, [profile, mustChangePassword]);

  // Refresh profile on mount to ensure we have latest role
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show password change screen if required
  if (showPasswordChange) {
    return (
      <ForcePasswordChange 
        onPasswordChanged={() => {
          setShowPasswordChange(false);
          refreshProfile();
        }} 
      />
    );
  }

  // Developer has same dashboard as admin but with full settings access
  if (isDeveloper) {
    return <AdminDashboard showSettings={true} roleLabel="Desenvolvedor" />;
  }

  // Admin now has no settings tab
  if (isAdmin) {
    return <AdminDashboard showSettings={false} roleLabel="Admin" />;
  }

  if (isProfessional) {
    return <ProfessionalDashboard />;
  }

  return <UserDashboard isSuspended={isSuspended} suspendedUntil={suspendedUntil} />;
}
