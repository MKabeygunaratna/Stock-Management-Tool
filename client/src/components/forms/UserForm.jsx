import { useState } from 'react';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function UserForm({ initial, onSubmit, onCancel }) {
  const [username, setUsername] = useState(initial?.username || '');
  const [fullName, setFullName] = useState(initial?.fullName || '');
  const [role, setRole] = useState(initial?.role || 'STAFF');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { fullName, role };
      if (!initial) {
        payload.username = username;
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div>
        <label className={labelClass}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          required
          disabled={!!initial}
        />
      </div>

      <div>
        <label className={labelClass}>Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>
          {initial ? 'New Password (leave blank to keep current)' : 'Password'}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required={!initial}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}
