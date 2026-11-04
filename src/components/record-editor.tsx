'use client';
import { Children, cloneElement, isValidElement, useId, useState, type ReactElement } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Link2,
  Check,
  CalendarDays,
  SquareCheckBig,
  Activity,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from './providers';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge, Confirmation } from './shared';
import {
  schemas,
  categories,
  priorities,
  taskStatuses,
  eventCategories,
  parseList,
  type Subtask,
} from '@/lib/schema';
import { memberCanEdit } from '@/lib/permissions';
import { jakartaDate } from '@/lib/utils';
export function Field({
  label,
  error,
  children,
  hint,
  required = false,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {Children.map(children, (child) =>
        isValidElement(child) &&
        typeof child.type === 'string' &&
        ['input', 'select', 'textarea'].includes(child.type)
          ? cloneElement(
              child as ReactElement<{
                id?: string;
                'aria-describedby'?: string;
                'aria-invalid'?: boolean;
              }>,
              { id, 'aria-describedby': describedBy, 'aria-invalid': !!error },
            )
          : child,
      )}
      {error && (
        <span className="field-error" role="alert" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
function localTime(value: string) {
  if (!value) return '';
  try {
    return new Date(value)
      .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })
      .replace(' ', 'T')
      .slice(0, 16);
  } catch {
    return '';
  }
}
export function RecordEditor() {
  const { editor, setEditor } = useWorkspace();
  return (
    <Dialog
      open={!!editor}
      onOpenChange={(open) => {
        if (!open) setEditor(null);
      }}
    >
      <DialogContent className="record-drawer">
        {editor && (
          <EditorForm
            key={`${editor.resource}-${editor.record?.id || 'new'}`}
            onClose={() => setEditor(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function EditorForm({ onClose }: { onClose: () => void }) {
  const { editor, save, remove, user, demo, data, notify } = useWorkspace();
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [submitError, setSubmitError] = useState('');
  const resource = editor!.resource;
  const existing = editor!.record;
  const editable = user.role !== 'viewer' && (!existing || memberCanEdit(user, existing, resource));
  const common = { title: '', description: '' };
  const defaults: Record<string, string> =
    resource === 'tasks'
      ? {
          ...common,
          category: categories[0],
          assignee: demo ? '' : user.email,
          priority: 'Medium',
          status: 'To Do',
          start_date: jakartaDate(),
          due_date: '',
          module: '',
          subtasks_json: '[]',
          notes: '',
          reference_url: '',
        }
      : resource === 'events'
        ? {
            ...common,
            start_datetime: `${jakartaDate()}T19:00:00+07:00`,
            end_datetime: `${jakartaDate()}T20:00:00+07:00`,
            category: 'Committee Meeting',
            location: '',
            responsible: demo ? '' : user.email,
            visibility: 'Internal',
          }
        : {
            ...common,
            type: 'Committee Meeting',
            date: jakartaDate(),
            responsible: demo ? '' : user.email,
            related_tasks_json: '[]',
            notes: '',
            decisions: '',
            follow_ups_json: '[]',
            references_json: '[]',
          };
  const form = useForm<Record<string, string>>({
    defaultValues: { ...defaults, ...existing, ...editor?.defaults },
    resolver: zodResolver(schemas[resource]) as unknown as Resolver<Record<string, string>>,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const watched = watch();
  const subtasks = parseList<Subtask>(watched.subtasks_json);
  const related = parseList(watched.related_tasks_json);
  const label = resource === 'tasks' ? 'task' : resource === 'events' ? 'event' : 'activity';
  const Icon =
    resource === 'tasks' ? SquareCheckBig : resource === 'events' ? CalendarDays : Activity;
  const input = (name: string, label: string, type = 'text', required = false) => (
    <Field key={name} label={label} error={errors[name]?.message} required={required}>
      <input
        type={type}
        {...register(name)}
        aria-invalid={!!errors[name]}
        maxLength={type === 'text' ? 200 : undefined}
      />
    </Field>
  );
  const area = (name: string, label: string, rows = 3) => (
    <Field key={name} label={label} error={errors[name]?.message}>
      <textarea rows={rows} {...register(name)} />
    </Field>
  );
  const select = (name: string, label: string, options: readonly string[]) => (
    <Field key={name} label={label} error={errors[name]?.message}>
      <select {...register(name)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
  async function submit(values: Record<string, string>) {
    setSubmitError('');
    try {
      await save(resource, { ...values, id: existing?.id || crypto.randomUUID() }, existing);
      onClose();
    } catch (error) {
      setSubmitError((error as Error).message);
    }
  }
  return (
    <>
      <div className="drawer-header">
        <span className="drawer-icon">
          <Icon size={21} />
        </span>
        <div>
          <span className="eyebrow">
            {existing ? `NESCO-${existing.id.slice(-4)}` : 'MAKE THE NEXT MOVE'}
          </span>
          <DialogTitle>{existing ? `Edit ${label}` : `New ${label}`}</DialogTitle>
        </div>
      </div>
      <DialogDescription>
        {resource === 'tasks'
          ? 'Turn a plan into a clear, actionable next step.'
          : resource === 'events'
            ? 'Make time for what matters. All times are in Asia/Jakarta (WIB).'
            : 'Keep the context, decisions, and next steps in one place.'}
      </DialogDescription>
      <form className="editor-form" onSubmit={handleSubmit(submit)} noValidate>
        <fieldset className="editor-fields" disabled={!editable}>
          {demo && (
            <div className="inline-notice">
              Demo changes stay in this session and reset on reload.
            </div>
          )}
          {input('title', `${label[0].toUpperCase() + label.slice(1)} title`, 'text', true)}
          {area('description', 'Description')}
          {resource === 'tasks' && (
            <>
              <div className="form-grid">
                {select('status', 'Status', taskStatuses)}
                {select('priority', 'Priority', priorities)}
                {select('category', 'Category', categories)}
                {input('assignee', 'Assigned member email')}
                {input('start_date', 'Start date', 'date')}
                {input('due_date', 'Due date', 'date')}
                {input('module', 'Related module')}
                {input('reference_url', 'Reference URL', 'url')}
              </div>
              <div className="form-section">
                <h3>
                  Subtasks{' '}
                  <span>
                    {subtasks.filter((s) => s.done).length}/{subtasks.length}
                  </span>
                </h3>
                <div className="subtask-list">
                  {subtasks.map((s) => (
                    <div key={s.id}>
                      <input
                        type="checkbox"
                        aria-label={`Complete ${s.title}`}
                        checked={s.done}
                        onChange={(e) =>
                          setValue(
                            'subtasks_json',
                            JSON.stringify(
                              subtasks.map((t) =>
                                t.id === s.id ? { ...t, done: e.target.checked } : t,
                              ),
                            ),
                          )
                        }
                      />
                      <span className={s.done ? 'checked-text' : ''}>{s.title}</span>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove ${s.title}`}
                        onClick={() =>
                          setValue(
                            'subtasks_json',
                            JSON.stringify(subtasks.filter((t) => t.id !== s.id)),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="add-subtask">
                  <input
                    aria-label="New subtask title"
                    placeholder="Add a small next step…"
                    value={subtaskText}
                    onChange={(e) => setSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subtaskText.trim().length >= 2) {
                          setValue(
                            'subtasks_json',
                            JSON.stringify([
                              ...subtasks,
                              { id: crypto.randomUUID(), title: subtaskText.trim(), done: false },
                            ]),
                          );
                          setSubtaskText('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Add subtask"
                    disabled={subtaskText.trim().length < 2}
                    onClick={() => {
                      setValue(
                        'subtasks_json',
                        JSON.stringify([
                          ...subtasks,
                          { id: crypto.randomUUID(), title: subtaskText.trim(), done: false },
                        ]),
                      );
                      setSubtaskText('');
                    }}
                  >
                    <Plus size={17} />
                  </Button>
                </div>
              </div>
              {area('notes', 'Notes')}
            </>
          )}
          {resource === 'events' && (
            <>
              <div className="form-grid">
                {(['start_datetime', 'end_datetime'] as const).map((name, i) => (
                  <Field
                    key={name}
                    label={i ? 'End · WIB' : 'Start · WIB'}
                    error={errors[name]?.message}
                    required
                  >
                    <input
                      type="datetime-local"
                      value={localTime(watched[name])}
                      onChange={(e) =>
                        setValue(name, e.target.value ? `${e.target.value}:00+07:00` : '', {
                          shouldValidate: true,
                        })
                      }
                    />
                  </Field>
                ))}
                {select('category', 'Event type', eventCategories)}
                {select('visibility', 'Visibility', ['Internal', 'Public'])}
                {input('responsible', 'Responsible member email')}
                {input('location', 'Location / meeting URL')}
              </div>
              <div className="inline-notice">
                Only public events appear in the subscribable calendar feed.
              </div>
            </>
          )}
          {resource === 'activities' && (
            <>
              <div className="form-grid">
                {select('type', 'Activity type', eventCategories)}
                {input('date', 'Date', 'date')}
                {input('responsible', 'Responsible member emails')}
              </div>
              <fieldset className="linked-tasks">
                <legend>Related tasks</legend>
                {data.tasks.length ? (
                  data.tasks.map((t) => (
                    <label key={t.id}>
                      <input
                        type="checkbox"
                        checked={related.includes(t.id)}
                        onChange={(e) =>
                          setValue(
                            'related_tasks_json',
                            JSON.stringify(
                              e.target.checked
                                ? [...related, t.id]
                                : related.filter((id) => id !== t.id),
                            ),
                          )
                        }
                      />
                      <span>{t.title}</span>
                    </label>
                  ))
                ) : (
                  <p>No tasks to link yet.</p>
                )}
              </fieldset>
              {area('notes', 'Meeting notes')}
              {area('decisions', 'Decisions')}
              <Field
                label="Follow-up actions"
                hint="One action per line"
                error={errors.follow_ups_json?.message}
              >
                <textarea
                  rows={3}
                  value={parseList(watched.follow_ups_json).join('\n')}
                  onChange={(e) =>
                    setValue('follow_ups_json', JSON.stringify(e.target.value.split('\n')))
                  }
                />
              </Field>
              <Field
                label="Reference links"
                hint="One full https:// URL per line"
                error={errors.references_json?.message}
              >
                <textarea
                  rows={2}
                  value={parseList(watched.references_json).join('\n')}
                  onChange={(e) =>
                    setValue(
                      'references_json',
                      JSON.stringify(e.target.value.split('\n').filter(Boolean)),
                    )
                  }
                />
              </Field>
            </>
          )}
          {existing && (
            <p className="record-meta">
              Created{' '}
              {new Date(existing.created_at).toLocaleDateString('en-GB', {
                timeZone: 'Asia/Jakarta',
              })}{' '}
              · ID {existing.id}
            </p>
          )}
          {submitError && (
            <div className="form-error" role="alert">
              {submitError}
            </div>
          )}
          {deleting && (
            <Confirmation
              title={`Delete this ${label}?`}
              description="This removes the shared record for everyone. This action cannot be undone."
              pending={pendingDelete}
              onCancel={() => setDeleting(false)}
              onConfirm={async () => {
                setPendingDelete(true);
                try {
                  await remove(resource, existing!);
                  onClose();
                } catch (error) {
                  notify((error as Error).message, true);
                } finally {
                  setPendingDelete(false);
                }
              }}
            />
          )}
        </fieldset>
        <div className="drawer-footer">
          {existing && (demo || user.role === 'admin') && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="delete-record"
              aria-label={`Delete ${label}`}
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={17} />
            </Button>
          )}
          <div />
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !editable}>
            {isSubmitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />}{' '}
            {isSubmitting ? 'Saving…' : existing ? 'Save changes' : `Create ${label}`}
          </Button>
        </div>
      </form>
    </>
  );
}
