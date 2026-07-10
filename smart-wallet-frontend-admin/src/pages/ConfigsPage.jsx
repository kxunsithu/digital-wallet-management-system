import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function ConfigsPage() {
  const { t } = useLanguage();
  const [customerConfigs, setCustomerConfigs] = useState([]);
  const [agentConfigs, setAgentConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const [customerRes, agentRes] = await Promise.all([
          api.get('/admin/customer-level-configs'),
          api.get('/admin/agent-level-configs'),
        ]);
        setCustomerConfigs(customerRes.data.data || []);
        setAgentConfigs(agentRes.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  const updateConfig = async (endpoint, id, payload) => {
    try {
      await api.patch(`${endpoint}/${id}`, payload);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header"><h2>{t('configs')}</h2></div>
        {loading ? <p>Loading...</p> : (
          <div className="config-grid">
            <div>
              <h3>Customer level policies</h3>
              {customerConfigs.map((config) => (
                <div key={config.id} className="config-card">
                  <strong>{config.level}</strong>
                  <label>Daily transfer limit<input defaultValue={config.daily_transfer_limit} onBlur={(event) => updateConfig('/admin/customer-level-configs', config.id, { daily_transfer_limit: Number(event.target.value) })} /></label>
                  <label>Max wallet balance<input defaultValue={config.max_wallet_balance} onBlur={(event) => updateConfig('/admin/customer-level-configs', config.id, { max_wallet_balance: Number(event.target.value) })} /></label>
                  <label>Requires KYC<input type="checkbox" defaultChecked={Boolean(config.requires_kyc)} onChange={(event) => updateConfig('/admin/customer-level-configs', config.id, { requires_kyc: event.target.checked })} /></label>
                </div>
              ))}
            </div>
            <div>
              <h3>Agent level policies</h3>
              {agentConfigs.map((config) => (
                <div key={config.id} className="config-card">
                  <strong>{config.level}</strong>
                  <label>Daily cash limit<input defaultValue={config.daily_cash_limit} onBlur={(event) => updateConfig('/admin/agent-level-configs', config.id, { daily_cash_limit: Number(event.target.value) })} /></label>
                  <label>Commission rate<input defaultValue={config.default_commission_rate} onBlur={(event) => updateConfig('/admin/agent-level-configs', config.id, { default_commission_rate: Number(event.target.value) })} /></label>
                  <label>Can recruit sub-agent<input type="checkbox" defaultChecked={Boolean(config.can_recruit_sub_agent)} onChange={(event) => updateConfig('/admin/agent-level-configs', config.id, { can_recruit_sub_agent: event.target.checked })} /></label>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
