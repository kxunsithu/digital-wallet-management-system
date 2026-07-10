import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function AuditPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/audit-logs?per_page=20');
        setLogs(data.data?.audit_logs || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header"><h2>{t('audit')}</h2></div>
        <div className="list-stack">
          {loading ? <p>Loading...</p> : logs.length === 0 ? <p>{t('noRecords')}</p> : logs.map((log) => (
            <div key={log.id} className="list-row">
              <div>
                <strong>{log.action}</strong>
                <p>{log.details}</p>
              </div>
              <span>{log.user?.full_name || 'System'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
