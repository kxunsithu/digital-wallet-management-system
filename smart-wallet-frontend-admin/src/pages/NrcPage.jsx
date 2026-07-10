import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function NrcPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/nrc-verifications?status=pending&per_page=20');
      setRecords(data.data?.nrc_verifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const updateStatus = async (id, status, reason = '') => {
    try {
      await api.patch(`/admin/nrc-verifications/${id}`, { status, rejection_reason: reason });
      await loadRecords();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header"><h2>{t('nrc')}</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>NRC</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Loading...</td></tr> : records.length === 0 ? <tr><td colSpan="4">{t('noRecords')}</td></tr> : records.map((record) => (
                <tr key={record.id}>
                  <td>{record.user?.full_name || '—'}</td>
                  <td>{record.nrc_number || '—'}</td>
                  <td>{record.status}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="primary-button small" onClick={() => updateStatus(record.id, 'approved')}>{t('approve')}</button>
                      <button className="ghost-button small" onClick={() => updateStatus(record.id, 'rejected', 'Document quality issue')}>{t('reject')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
