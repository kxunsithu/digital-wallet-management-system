import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users?per_page=20');
      setUsers(data.data?.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const term = search.toLowerCase();
    return [user.full_name, user.phone_number, user.status].join(' ').toLowerCase().includes(term);
  }), [search, users]);

  const updateStatus = async (userId, status) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      await fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t('users')}</h2>
          <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search')} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>{t('status')}</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5">Loading...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan="5">{t('noRecords')}</td></tr> : filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name || '—'}</td>
                  <td>{user.phone_number}</td>
                  <td>{user.status}</td>
                  <td>{user.role || 'customer'}</td>
                  <td>
                    <select defaultValue={user.status} onChange={(event) => updateStatus(user.id, event.target.value)}>
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="suspended">suspended</option>
                      <option value="blocked">blocked</option>
                    </select>
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
