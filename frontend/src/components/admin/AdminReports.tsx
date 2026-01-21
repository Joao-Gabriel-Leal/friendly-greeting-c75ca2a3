import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarDays, Users, AlertTriangle, CheckCircle, TrendingUp, Download, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

interface Stats {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  suspendedUsers: number;
  monthlyData: { month: string; count: number }[];
  specialtyData: { name: string; value: number }[];
  statusData: { name: string; value: number; color: string }[];
}

interface AppointmentReport {
  id: string;
  userName: string;
  userEmail: string;
  userStatus: string;
  userDepartment: string;
  date: string;
  time: string;
  specialty: string;
  status: string;
  professionalName: string;
}

const COLORS = ['#00b8d9', '#9333ea', '#10b981', '#f59e0b'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    scheduledAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    suspendedUsers: 0,
    monthlyData: [],
    specialtyData: [],
    statusData: []
  });
  const [appointmentReports, setAppointmentReports] = useState<AppointmentReport[]>([]);

  useEffect(() => {
    fetchStats();
    fetchAppointmentReports();
  }, []);

  const fetchStats = async () => {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('status, specialty_id, appointment_date');

    const { data: users } = await supabase
      .from('profiles')
      .select('suspended_until')
      .not('suspended_until', 'is', null);

    const { data: specialties } = await supabase
      .from('specialties')
      .select('id, name');

    const specialtiesMap = new Map(specialties?.map(s => [s.id, s.name]) || []);

    if (appointments) {
      const total = appointments.length;
      const scheduled = appointments.filter(a => a.status === 'scheduled').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      const noShow = appointments.filter(a => a.status === 'no_show').length;

      const monthlyMap = new Map<string, number>();
      appointments.forEach(a => {
        const month = format(parseISO(a.appointment_date), 'MMM/yy', { locale: ptBR });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      });
      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({ month, count }))
        .slice(-6);

      const specialtyMap = new Map<string, number>();
      appointments.forEach(a => {
        const specialtyName = specialtiesMap.get(a.specialty_id) || 'Desconhecido';
        specialtyMap.set(specialtyName, (specialtyMap.get(specialtyName) || 0) + 1);
      });
      const specialtyData = Array.from(specialtyMap.entries())
        .map(([name, value]) => ({ name, value }));

      const statusData = [
        { name: 'Agendados', value: scheduled, color: 'hsl(var(--primary))' },
        { name: 'Concluídos', value: completed, color: 'hsl(var(--success))' },
        { name: 'Cancelados', value: cancelled, color: 'hsl(var(--muted-foreground))' },
        { name: 'Faltas', value: noShow, color: 'hsl(var(--warning))' },
      ];

      const suspendedUsers = users?.filter(u => 
        u.suspended_until && new Date(u.suspended_until) > new Date()
      ).length || 0;

      setStats({
        totalAppointments: total,
        scheduledAppointments: scheduled,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        suspendedUsers,
        monthlyData,
        specialtyData,
        statusData
      });
    }

    setLoading(false);
  };

  const fetchAppointmentReports = async () => {
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        specialty_id,
        status,
        user_id,
        professional_id
      `)
      .order('appointment_date', { ascending: false });

    if (!appointments) return;

    const userIds = [...new Set(appointments.map(a => a.user_id))];
    const professionalIds = [...new Set(appointments.map(a => a.professional_id).filter(Boolean))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, email, suspended_until, setor')
      .in('user_id', userIds);

    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, name')
      .in('id', professionalIds);

    const { data: specialties } = await supabase
      .from('specialties')
      .select('id, name');

    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const professionalsMap = new Map(professionals?.map(p => [p.id, p]) || []);
    const specialtiesMap = new Map(specialties?.map(s => [s.id, s.name]) || []);

    const reports: AppointmentReport[] = appointments.map(a => {
      const profile = profilesMap.get(a.user_id);
      const professional = a.professional_id ? professionalsMap.get(a.professional_id) : null;
      
      let userStatus = 'Ativo';
      if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
        userStatus = 'Suspenso';
      }

      return {
        id: a.id,
        userName: profile?.name || 'N/A',
        userEmail: profile?.email || 'N/A',
        userStatus,
        userDepartment: profile?.setor || 'N/A',
        date: a.appointment_date,
        time: a.appointment_time,
        specialty: specialtiesMap.get(a.specialty_id) || 'N/A',
        status: a.status,
        professionalName: professional?.name || 'N/A'
      };
    });

    setAppointmentReports(reports);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Falta'
    };
    return labels[status] || status;
  };

  const downloadExcel = () => {
    // Aba 1: Relatório detalhado
    const data = appointmentReports.map(r => ({
      'Nome do Usuário': r.userName,
      'Email': r.userEmail,
      'Departamento': r.userDepartment,
      'Status do Usuário': r.userStatus,
      'Data': format(parseISO(r.date), 'dd/MM/yyyy'),
      'Horário': r.time.slice(0, 5),
      'Especialidade': r.specialty,
      'Profissional': r.professionalName,
      'Status do Agendamento': getStatusLabel(r.status)
    }));

    const worksheetRelatorio = XLSX.utils.json_to_sheet(data);
    
    // Aba 2: Dashboard visual com gráficos ASCII
    const dashboardRows: string[][] = [];
    
    // Título
    dashboardRows.push(['📊 DASHBOARD DE AGENDAMENTOS', '', '', '', '']);
    dashboardRows.push([`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    
    // Métricas principais
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['📈 RESUMO GERAL', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['Métrica', 'Quantidade', 'Percentual', 'Gráfico', '']);
    dashboardRows.push(['───────────────────────────────────────────────────────────────────────────────', '', '', '', '']);
    
    const total = stats.totalAppointments || 1;
    const scheduledPct = (stats.scheduledAppointments / total) * 100;
    const completedPct = (stats.completedAppointments / total) * 100;
    const cancelledPct = (stats.cancelledAppointments / total) * 100;
    const noShowPct = (stats.noShowAppointments / total) * 100;
    
    const makeBar = (pct: number, char: string = '█') => {
      const filled = Math.round(pct / 5);
      return char.repeat(filled) + '░'.repeat(20 - filled);
    };
    
    dashboardRows.push(['📋 Total de Agendamentos', String(stats.totalAppointments), '100%', '████████████████████', '']);
    dashboardRows.push(['🕐 Agendados', String(stats.scheduledAppointments), `${scheduledPct.toFixed(1)}%`, makeBar(scheduledPct), '']);
    dashboardRows.push(['✅ Concluídos', String(stats.completedAppointments), `${completedPct.toFixed(1)}%`, makeBar(completedPct), '']);
    dashboardRows.push(['❌ Cancelados', String(stats.cancelledAppointments), `${cancelledPct.toFixed(1)}%`, makeBar(cancelledPct), '']);
    dashboardRows.push(['⚠️ Faltas', String(stats.noShowAppointments), `${noShowPct.toFixed(1)}%`, makeBar(noShowPct), '']);
    dashboardRows.push(['🚫 Usuários Suspensos', String(stats.suspendedUsers), '-', '', '']);
    
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['🥧 GRÁFICO DE PIZZA - STATUS DOS AGENDAMENTOS', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    
    // Gráfico de pizza ASCII
    const pieData = [
      { name: 'Agendados', value: stats.scheduledAppointments, icon: '🔵' },
      { name: 'Concluídos', value: stats.completedAppointments, icon: '🟢' },
      { name: 'Cancelados', value: stats.cancelledAppointments, icon: '⚪' },
      { name: 'Faltas', value: stats.noShowAppointments, icon: '🟡' },
    ];
    
    dashboardRows.push(['', '         ████████████', '', '', '']);
    dashboardRows.push(['', '      ████████████████████', '', '', '']);
    dashboardRows.push(['', '    ████████████████████████', '', '', '']);
    dashboardRows.push(['', '   ██████████████████████████', '', '', '']);
    dashboardRows.push(['', '   ██████████████████████████', '', '', '']);
    dashboardRows.push(['', '   ██████████████████████████', '', '', '']);
    dashboardRows.push(['', '    ████████████████████████', '', '', '']);
    dashboardRows.push(['', '      ████████████████████', '', '', '']);
    dashboardRows.push(['', '         ████████████', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    
    // Legenda do gráfico de pizza
    dashboardRows.push(['Legenda:', '', '', '', '']);
    pieData.forEach(item => {
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      dashboardRows.push([`${item.icon} ${item.name}`, String(item.value), `${pct}%`, '', '']);
    });
    
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['🏥 DISTRIBUIÇÃO POR ESPECIALIDADE', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['Especialidade', 'Quantidade', 'Percentual', 'Gráfico', '']);
    dashboardRows.push(['───────────────────────────────────────────────────────────────────────────────', '', '', '', '']);
    
    stats.specialtyData.forEach(s => {
      const pct = (s.value / total) * 100;
      dashboardRows.push([`🏷️ ${s.name}`, String(s.value), `${pct.toFixed(1)}%`, makeBar(pct, '▓'), '']);
    });
    
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['📅 AGENDAMENTOS POR MÊS', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['Mês', 'Quantidade', '', 'Gráfico de Barras', '']);
    dashboardRows.push(['───────────────────────────────────────────────────────────────────────────────', '', '', '', '']);
    
    const maxMonthly = Math.max(...stats.monthlyData.map(m => m.count), 1);
    stats.monthlyData.forEach(m => {
      const barSize = Math.round((m.count / maxMonthly) * 30);
      dashboardRows.push([`📆 ${m.month}`, String(m.count), '', '▓'.repeat(barSize), '']);
    });
    
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['═══════════════════════════════════════════════════════════════════════════════', '', '', '', '']);
    dashboardRows.push(['', '', '', '', '']);
    dashboardRows.push(['Relatório gerado automaticamente pelo Sistema de Agendamentos', '', '', '', '']);

    const worksheetDashboard = XLSX.utils.aoa_to_sheet(dashboardRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetRelatorio, 'Relatório');
    XLSX.utils.book_append_sheet(workbook, worksheetDashboard, 'Dashboard');

    // Ajustar largura das colunas - Relatório
    const maxWidths: number[] = [];
    data.forEach(row => {
      Object.values(row).forEach((val, i) => {
        const len = String(val).length;
        maxWidths[i] = Math.max(maxWidths[i] || 10, len);
      });
    });
    worksheetRelatorio['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }));

    // Ajustar largura das colunas - Dashboard
    worksheetDashboard['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      { wch: 35 },
      { wch: 5 }
    ];

    XLSX.writeFile(workbook, `relatorio-agendamentos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completionRate = stats.totalAppointments > 0 
    ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
    : 0;

  const noShowRate = stats.totalAppointments > 0
    ? ((stats.noShowAppointments / stats.totalAppointments) * 100).toFixed(1)
    : 0;

  const cancelledRate = stats.totalAppointments > 0
    ? ((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalAppointments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-3xl font-bold text-primary">{stats.scheduledAppointments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-3xl font-bold text-success">{stats.completedAppointments}</p>
                <p className="text-xs text-muted-foreground">{completionRate}% do total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-3xl font-bold text-muted-foreground">{stats.cancelledAppointments}</p>
                <p className="text-xs text-muted-foreground">{cancelledRate}% do total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faltas</p>
                <p className="text-3xl font-bold text-warning">{stats.noShowAppointments}</p>
                <p className="text-xs text-muted-foreground">{noShowRate}% do total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Suspensos</p>
                <p className="text-3xl font-bold text-destructive">{stats.suspendedUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Agendamentos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Relatório Detalhado</CardTitle>
          <Button onClick={downloadExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar XLSX
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentReports.slice(0, 50).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{report.userDepartment}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.userStatus === 'Suspenso' 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-success/10 text-success'
                      }`}>
                        {report.userStatus}
                      </span>
                    </TableCell>
                    <TableCell>{format(parseISO(report.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{report.time.slice(0, 5)}</TableCell>
                    <TableCell>{report.specialty}</TableCell>
                    <TableCell>{report.professionalName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'completed' ? 'bg-success/10 text-success' :
                        report.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                        report.status === 'no_show' ? 'bg-warning/10 text-warning' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {appointmentReports.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mostrando 50 de {appointmentReports.length} registros. Baixe o XLSX para ver todos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}