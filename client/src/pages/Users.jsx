import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users.api';
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
    await deleteUser(disableTarget.id);
    showToast('User disabled');
    setDisableTarget(null);
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UsersIcon}
        title="Users"
        subtitle="Manage staff and admin accounts"
        action={<Button onClick={openCreate}><Plus size={16} /> Add User</Button>}
      />

      {error && <p className="text-red-400">{error}</p>}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Username</th>
              <th className="px-4 py-2 font-medium">Full Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40">
                <td className="px-4 py-2 text-zinc-100">{u.username}</td>
                <td className="px-4 py-2 text-zinc-200">{u.fullName}</td>
                <td className="px-4 py-2 text-zinc-300">{u.role}</td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? 'text-emerald-400' : 'text-zinc-600'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => openEdit(u)} className="mr-3 text-amber-500 hover:underline">Edit</button>
                  {u.isActive && (
                    <button onClick={() => setDisableTarget(u)} className="text-red-400 hover:underline">Disable</button>
                  )}
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
    </div>
  );
}
