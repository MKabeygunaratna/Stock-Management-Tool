import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import PageHeader from "./PageHeader";
import Button from "./Button";
import EmptyState from "./EmptyState";

export default function NameCrudPage({ title, icon, api }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    api
      .list()
      .then(setItems)
      .catch(() => setError(`Failed to load ${title.toLowerCase()}`));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      if (editing) {
        await api.update(editing.id, { name });
        showToast(`${title.slice(0, -1)} updated`);
      } else {
        await api.create({ name });
        showToast(`${title.slice(0, -1)} created`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save");
    }
  };

  const handleDelete = async () => {
    await api.remove(deleteTarget.id);
    showToast(`${title.slice(0, -1)} deleted`);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        icon={icon}
        title={title}
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add {title.slice(0, -1)}
            </Button>
          )
        }
      />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-2xl border border-border bg-card/95 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              {isAdmin && <th className="px-4 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40"
              >
                <td className="px-4 py-2 text-foreground">
                  {item.name}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="mr-3 text-amber-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 2 : 1}>
                  <EmptyState
                    icon={icon}
                    message={`No ${title.toLowerCase()} yet — add your first ${title.slice(0, -1).toLowerCase()} to get started.`}
                    action={isAdmin && (
                      <Button onClick={openCreate}><Plus size={16} /> Add {title.slice(0, -1)}</Button>
                    )}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <Modal
        open={modalOpen}
        title={
          editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`
        }
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        confirmLabel={`Delete ${title.slice(0, -1)}`}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
