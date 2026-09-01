import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Building2, Calendar, ShieldCheck, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM } from '../utils/timeHelper';

interface User { id: number; name: string; email: string; role: string; phone: string; createdAt: string; }
interface Business { id: number; name: string; address: string; owner?: { name: string }; }
interface Appointment {
  id: number; status: string; date: string; time: string;
  user?: { name: string; email: string };
  business?: { name: string };
  service?: { name: string };
}

const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  client: { label: 'Cliente', badge: 'badge-completed' },
  owner: { label: 'Dueño', badge: 'badge-confirmed' },
  administrator: { label: 'Administrador', badge: 'badge-pending' },
};

const SystemAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'businesses' | 'appointments'>('users');
  const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, totalAppointments: 0, totalAdmins: 0 });

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'administrator') navigate('/');
  }, [user, navigate]);

  // Load stats
  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  // Load data by tab
  useEffect(() => {
    if (activeTab === 'users') {
      api.get('/admin/users').then(res => setUsers(res.data.data ?? [])).catch(err => console.error('users error', err));
    } else if (activeTab === 'businesses') {
      api.get('/businesses?limit=100').then(res => {
        console.log('businesses response:', res.data);
        setBusinesses(res.data.data ?? []);
      }).catch(err => console.error('businesses error', err));
    } else if (activeTab === 'appointments') {
      api.get('/admin/appointments').then(res => setAppointments(res.data.data ?? [])).catch(err => console.error('appointments error', err));
    }
  }, [activeTab]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`✓ Rol actualizado a ${ROLE_LABELS[newRole]?.label}`);
    } catch { showToast('Error al cambiar rol'); }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`¿Eliminar a "${name}" del sistema?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('✓ Usuario eliminado');
    } catch { showToast('Error al eliminar usuario'); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS = [
    { id: 'users', icon: <Users size={15} />, label: 'Gestión de Usuarios' },
    { id: 'businesses', icon: <Building2 size={15} />, label: 'Negocios Registrados' },
    { id: 'appointments', icon: <Calendar size={15} />, label: 'Turnos Globales' },
  ] as const;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 2000, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <ShieldCheck size={20} color="var(--primary-color)" />
            <h1 style={{ color: 'var(--text-title)', fontSize: '1.75rem', fontWeight: 800 }}>Administración del Sistema</h1>
          </div>
          <p className="text-muted text-sm">Gestión global de usuarios, negocios y métricas de la plataforma.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => navigate('/')} style={{ fontSize: '0.85rem' }}>
          ← Volver al Menú
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <Users size={22} />, label: 'Usuarios Registrados', value: stats.totalUsers },
          { icon: <Building2 size={22} />, label: 'Negocios Activos', value: stats.totalBusinesses },
          { icon: <Calendar size={22} />, label: 'Turnos Totales', value: stats.totalAppointments },
          { icon: <ShieldCheck size={22} />, label: 'Administradores', value: stats.totalAdmins },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-icon">{m.icon}</div>
            <div>
              <div className="metric-title">{m.label}</div>
              <div className="metric-value">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav de pestañas */}
      <div className="ml-card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap', background: '#0f172a' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px', border: '1px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-family-base)',
              borderColor: activeTab === tab.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
              background: activeTab === tab.id ? 'var(--status-pending-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ======= USUARIOS ======= */}
      {activeTab === 'users' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-title)' }}>Base de Usuarios</h3>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ maxWidth: '260px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background-app)' }}>
                  {['ID', 'Nombre', 'Email', 'Teléfono', 'Rol Actual', 'Cambiar Rol', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No se encontraron usuarios.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.id}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{u.email}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${ROLE_LABELS[u.role]?.badge || 'badge-completed'}`}>
                        {ROLE_LABELS[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          className="form-control"
                          style={{ paddingRight: '2rem', fontSize: '0.82rem', width: 'auto' }}
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="client">Cliente</option>
                          <option value="owner">Dueño</option>
                          <option value="administrator">Administrador</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button className="btn btn-light-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteUser(u.id, u.name)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======= NEGOCIOS ======= */}
      {activeTab === 'businesses' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.25rem' }}>Negocios Registrados</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background-app)' }}>
                  {['ID', 'Nombre', 'Dirección', 'Dueño', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay negocios registrados.</td></tr>
                ) : businesses.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.id}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{b.address || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{b.owner?.name || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <a href={`/businesses/${b.id}`} className="btn btn-light" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Ver</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======= TURNOS GLOBALES ======= */}
      {activeTab === 'appointments' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.25rem' }}>Listado Maestro de Turnos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background-app)' }}>
                  {['ID', 'Cliente', 'Negocio', 'Servicio', 'Fecha y Hora', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay turnos.</td></tr>
                ) : appointments.map(apt => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>#{apt.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '1px' }}>{apt.user?.name || '—'}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{apt.user?.email}</p>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{apt.business?.name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{apt.service?.name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                      {(() => {
                        try {
                          const datePart = format(new Date(apt.date), 'd MMM yyyy', { locale: es });
                          const timePart = formatTimeToHHMM(apt.time);
                          return `${datePart} – ${timePart}`;
                        } catch { return '—'; }
                      })()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${apt.status === 'CONFIRMED' ? 'badge-confirmed' : apt.status === 'CANCELLED' ? 'badge-cancelled' : apt.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdmin;
