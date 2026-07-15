import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';
import { getUsers, createUser, updateUser, setUserStatus, deleteUser } from '../api/users.api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import UserForm from '../components/forms/UserForm';

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    getUsers().then(setUsers).catch(() => setError('Failed to load users'));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateUser(editing.id, payload);
      showToast('User updated');
    } else {
      await createUser(payload);
      showToast('User created');
    }
    setModalOpen(false);
    load();
  };

  const handleDisable = async () => {
    await setUserStatus(disableTarget.id, false);
    showToast('User disabled');
    setDisableTarget(null);
    load();
  };

  const handleEnable = async (user) => {
    try {
      await setUserStatus(user.id, true);
      showToast('User enabled');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to enable user', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id);
      showToast('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UsersIcon}
        title="Users"
        subtitle="Manage staff and admin accounts"
        action={<Button onClick={openCreate}><Plus size={16} /> Add User</Button>}
      />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Username</th>
              <th className="px-4 py-2 font-medium">Full Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 text-foreground">{u.username}</td>
                <td className="px-4 py-2 text-foreground">{u.fullName}</td>
                <td className="px-4 py-2 text-muted">{u.role}</td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => openEdit(u)} className="mr-3 text-amber-500 hover:underline">Edit</button>
                  {u.isActive ? (
                    <button onClick={() => setDisableTarget(u)} className="mr-3 text-red-600 dark:text-red-400 hover:underline">Disable</button>
                  ) : (
                    <button onClick={() => handleEnable(u)} className="mr-3 text-emerald-600 dark:text-emerald-400 hover:underline">Enable</button>
                  )}
                  <button onClick={() => setDeleteTarget(u)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={UsersIcon} message="No users found" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit User' : 'Add User'} onClose={() => setModalOpen(false)}>
        <UserForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!disableTarget}
        message={`Disable "${disableTarget?.fullName}"? They will no longer be able to log in.`}
        onConfirm={handleDisable}
        onCancel={() => setDisableTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        message={`Permanently delete "${deleteTarget?.fullName}"? This cannot be undone. Users with existing stock movements or invoices cannot be deleted — disable them instead.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
