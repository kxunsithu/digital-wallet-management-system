import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function AgentsPage() {
  const { t } = useLanguage();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users?role=agent&per_page=20');
      setAgents((data.data?.users || []).filter((user) => user.agent_profile));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const approveAgent = async (agentId) => {
    try {
      await api.patch(`/admin/agents/${agentId}/approve`);
      await loadAgents();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t('agents')}</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Code</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Loading...</td></tr> : agents.length === 0 ? <tr><td colSpan="4">{t('noRecords')}</td></tr> : agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.full_name || agent.phone_number}</td>
                  <td>{agent.agent_profile?.agent_code || '—'}</td>
                  <td>{agent.agent_profile?.status || 'pending'}</td>
                  <td>
                    <button className="primary-button small" onClick={() => approveAgent(agent.agent_profile.id)}>
                      {t('approve')}
                    </button>
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
