import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const allowedAdminPhone = import.meta.env.VITE_SEEDED_ADMIN_PHONE || '+959944074981';

  const [phase, setPhase] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pin, setPin] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetFeedback = () => {
    setError('');
    setSuccess('');
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);
    // Enforce admin-only login from the frontend: only the seeded admin phone is allowed
    if (phoneNumber !== allowedAdminPhone) {
      setError(`Admin console restricted to ${allowedAdminPhone}`);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.post('/auth/request-otp', { phone_number: phoneNumber });
      setPendingPhone(data.data.phone_number || phoneNumber);
      setSuccess(data.message || 'OTP sent.');
      setPhase('otp');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to request OTP.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone_number: pendingPhone, otp_code: otpCode });
      if (data.data.requires_pin_verification || data.data.requires_pin_creation) {
        setUserId(data.data.user_id);
        setSuccess(data.message || 'OTP verified.');
        setPhase('pin');
      } else {
        setError('The backend did not request a PIN step.');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'OTP verification failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-pin', {
        user_id: userId,
        pin,
        device_id: 'web-admin',
        device_name: 'Admin Console',
      });
      if (data.data.user.role !== 'admin') {
        setError('This account is not an admin account.');
        setLoading(false);
        return;
      }
      login(data.data.user, data.data.token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'PIN verification failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="eyebrow">{t('liveBackend')}</p>
          <h1>{t('loginTitle')}</h1>
          <p>{t('loginSubtitle')}</p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: 6 }}>Admin phone: {allowedAdminPhone}</p>
        </div>

        {phase === 'phone' && (
          <form onSubmit={requestOtp} className="stack">
            <label className="field-label">
              <span>{t('phoneNumber')}</span>
              <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+959..." required />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? '...' : t('requestOtp')}
            </button>
          </form>
        )}

        {phase === 'otp' && (
          <form onSubmit={verifyOtp} className="stack">
            <label className="field-label">
              <span>{t('otpCode')}</span>
              <input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="123456" required />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? '...' : t('verifyOtp')}
            </button>
          </form>
        )}

        {phase === 'pin' && (
          <form onSubmit={verifyPin} className="stack">
            <label className="field-label">
              <span>{t('pin')}</span>
              <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••" required />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? '...' : t('verifyPin')}
            </button>
          </form>
        )}

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}
      </div>
    </div>
  );
}
