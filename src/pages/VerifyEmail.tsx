import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerifyWithToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerifyWithToken = async (tokenToVerify: string) => {
    setLoading(true);
    setStatus('loading');
    setMessage('Verificando tu dirección de correo electrónico...');

    try {
      const res = await api.post('/auth/verify-email', { token: tokenToVerify });
      setStatus('success');
      setMessage(res.data.message || '¡Tu correo electrónico ha sido verificado con éxito!');
      if (user) {
        updateUser({ emailVerified: true });
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(
        err.response?.data?.message ||
        'El enlace de verificación no es válido o ya ha expirado. Puedes solicitar uno nuevo desde tu perfil.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setLoading(true);
    setStatus('loading');
    try {
      const res = await api.post('/auth/verify-email', {
        code: manualCode.trim(),
        verificationToken: tokenFromUrl || undefined,
      });
      setStatus('success');
      setMessage(res.data.message || '¡Tu correo electrónico ha sido verificado con éxito!');
      if (user) {
        updateUser({ emailVerified: true });
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Código de verificación incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="ml-card" style={{ padding: '2.5rem 2rem', textAlign: 'center', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        {status === 'loading' && (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff', color: '#009ee3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              Verificando correo
            </h2>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              {message}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle2 size={38} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              ¡Correo Verificado!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              {message}
            </p>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem', marginBottom: '1.75rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={24} color="#16a34a" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                Tu cuenta ahora está completamente protegida y lista para recibir todas las notificaciones y recordatorios.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/profile" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                Ir a mi Perfil
              </Link>
              <Link to="/" className="btn btn-light" style={{ padding: '0.75rem 1.5rem' }}>
                Explorar Turnos <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertCircle size={38} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              No pudimos verificar tu correo
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              {message}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/profile" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                Ir a mi Perfil para reenviar
              </Link>
              <Link to="/" className="btn btn-light" style={{ padding: '0.75rem 1.5rem' }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        )}

        {status === 'idle' && !tokenFromUrl && (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff', color: '#009ee3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Mail size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              Verificación de correo
            </h2>
            <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Si recibiste un código de verificación de 6 dígitos en tu correo, ingrésalo aquí:
            </p>

            <form onSubmit={handleManualCodeSubmit} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej: 123456"
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px', fontWeight: 700 }}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
                disabled={loading || manualCode.length < 6}
              >
                {loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
            </form>

            <Link to="/profile" className="text-muted" style={{ fontSize: '0.875rem' }}>
              ← Volver a mi perfil
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
