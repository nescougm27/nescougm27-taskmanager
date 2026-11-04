'use client';
import { useEffect, useState } from 'react';
import { Plus, Users, Pencil, Trash2, Loader2, ShieldCheck, Check } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { memberSchema, type MemberRecord } from '@/lib/schema';
import { useWorkspace } from './providers';
import { Avatar, Badge, Confirmation, EmptyState } from './shared';
import { Button } from './ui/button';
import { Field } from './record-editor';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
type MemberValues = z.input<typeof memberSchema>;
export function MemberManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { demo, notify, user } = useWorkspace();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<MemberRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<MemberRecord | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '', email: '', role: 'member', status: 'active' },
  });
  async function load() {
    if (demo) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/members');
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      setMembers(result.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (open) {
      void load();
      setEditing(undefined);
      setDeleting(null);
    }
  }, [open]);
  function edit(member: MemberRecord | null) {
    setEditing(member);
    form.reset(member || { name: '', email: '', role: 'member', status: 'active' });
    setDeleting(null);
    setError('');
  }
  async function submit(values: MemberValues) {
    setPending(true);
    setError('');
    try {
      if (demo) {
        const record = {
          ...values,
          id: editing?.id || crypto.randomUUID(),
          joined_at: editing?.joined_at || new Date().toISOString(),
          version: 'demo',
        };
        setMembers((old) =>
          editing ? old.map((m) => (m.id === editing.id ? record : m)) : [...old, record],
        );
        notify('Demo member updated · resets on reload.');
      } else {
        const res = await fetch(`/api/members${editing ? `/${editing.id}` : ''}`, {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, version: editing?.version }),
        });
        const result = await res.json();
        if (!res.ok) throw Error(result.error);
        await load();
        notify('Member access updated.');
      }
      setEditing(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="members-dialog">
        <DialogTitle>The people building together.</DialogTitle>
        <DialogDescription>
          Manage committee access. Only active Google accounts listed here can sign in.
        </DialogDescription>
        {demo && (
          <div className="inline-notice">
            Sample member management. Changes stay in this demo session.
          </div>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {editing !== undefined ? (
          <form className="member-form" onSubmit={form.handleSubmit(submit)} noValidate>
            <div className="form-grid">
              <Field label="Member name" required error={form.formState.errors.name?.message}>
                <input {...form.register('name')} />
              </Field>
              <Field
                label="Verified Google email"
                required
                error={form.formState.errors.email?.message}
              >
                <input type="email" {...form.register('email')} />
              </Field>
              <Field label="Role">
                <select {...form.register('role')}>
                  <option value="admin">Admin · full access</option>
                  <option value="member">Member · assigned work</option>
                  <option value="viewer">Viewer · read only</option>
                </select>
              </Field>
              <Field label="Access status">
                <select {...form.register('status')}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </Field>
            </div>
            <div className="inline-notice">
              Suspending or removing a member revokes access on their next protected request, even
              with an existing session.
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="spin" size={15} /> : <Check size={15} />}Save member
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="members-toolbar">
              <Badge tone="green">{members.length} members</Badge>
              <Button size="sm" onClick={() => edit(null)}>
                <Plus size={14} />
                Add member
              </Button>
            </div>
            {loading ? (
              <p className="muted">Loading members…</p>
            ) : members.length ? (
              <div className="member-list">
                {members.map((m) => (
                  <div key={m.id} className="member-row">
                    <Avatar name={m.name} />
                    <div>
                      <strong>{m.name}</strong>
                      <span>{m.email}</span>
                    </div>
                    <Badge tone={m.status === 'active' ? 'green' : 'amber'}>
                      {m.role} · {m.status}
                    </Badge>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${m.name}`}
                      onClick={() => edit(m)}
                    >
                      <Pencil size={14} />
                    </button>
                    {m.email !== user.email && (
                      <button
                        className="icon-button delete-record"
                        aria-label={`Remove ${m.name}`}
                        onClick={() => setDeleting(m)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Add your committee"
                description="Create member entries using their exact Google account email addresses."
              />
            )}
            {deleting && (
              <Confirmation
                title={`Remove ${deleting.name}?`}
                description="Their access to this workspace will be revoked."
                pending={pending}
                onCancel={() => setDeleting(null)}
                onConfirm={async () => {
                  setPending(true);
                  setError('');
                  try {
                    if (demo) setMembers((old) => old.filter((m) => m.id !== deleting.id));
                    else {
                      const res = await fetch(`/api/members/${deleting.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ version: deleting.version }),
                      });
                      const result = await res.json();
                      if (!res.ok) throw Error(result.error);
                      await load();
                    }
                    setDeleting(null);
                    notify(demo ? 'Removed from demo session.' : 'Member access removed.');
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setPending(false);
                  }
                }}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
