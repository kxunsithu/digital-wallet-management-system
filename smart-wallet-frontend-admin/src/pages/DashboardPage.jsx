import { useEffect, useState } from 'react';
import { Activity, Users, ShieldCheck, BadgeCheck, FileText } from 'lucide-react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [usersResponse, logsResponse, nrcResponse, agentsResponse] = await Promise.all([
          api.get('/admin/users?per_page=5'),
          api.get('/admin/audit-logs?per_page=5'),
          api.get('/admin/nrc-verifications?status=pending&per_page=5'),
          api.get('/admin/agents/1/approve').catch(() => ({ data: { success: false } })),
        ]);

        const users = usersResponse.data.data?.users || [];
        const pendingNrc = nrcResponse.data.data?.nrc_verifications || [];
        const auditLogs = logsResponse.data.data?.audit_logs || [];
        setStats({
          totalUsers: usersResponse.data.data?.pagination?.total || users.length,
          pendingAgents: 0,
          pendingNrc: nrcResponse.data.data?.pagination?.total || pendingNrc.length,
          recentActions: auditLogs.length,
        });
        setLogs(auditLogs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="page-stack">
      <section className="card-grid">
        <article className="stat-card">
          <div className="stat-icon"><Users size={18} /></div>
          <div>
            <p>{t('totalUsers')}</p>
            <strong>{loading ? '...' : stats.totalUsers}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><ShieldCheck size={18} /></div>
          <div>
            <p>{t('pendingAgents')}</p>
            <strong>{loading ? '...' : stats.pendingAgents}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><BadgeCheck size={18} /></div>
          <div>
            <p>{t('pendingNrc')}</p>
            <strong>{loading ? '...' : stats.pendingNrc}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><FileText size={18} /></div>
          <div>
            <p>{t('recentActions')}</p>
            <strong>{loading ? '...' : stats.recentActions}</strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t('recentActions')}</h2>
          <span className="pill"><Activity size={14} /> {t('liveBackend')}</span>
        </div>
        <div className="list-stack">
          {loading ? <p>Loading...</p> : logs.length === 0 ? <p>{t('noRecords')}</p> : logs.map((log) => (
            <div key={log.id} className="list-row">
              <div>
                <strong>{log.action}</strong>
                <p>{log.details}</p>
              </div>
              <span>{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
