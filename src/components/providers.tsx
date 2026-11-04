'use client';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { createDemoData } from '@/lib/demo';
import type { Resource, WorkspaceRecord, WorkspaceData, SessionUser } from '@/lib/schema';
type Editor = {
  resource: 'tasks' | 'events' | 'activities';
  record?: WorkspaceRecord;
  defaults?: Record<string, string>;
} | null;
type WorkspaceContextType = {
  data: WorkspaceData;
  demo: boolean;
  user: SessionUser;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  editor: Editor;
  setEditor: (editor: Editor) => void;
  notify: (message: string, error?: boolean) => void;
  save: (
    resource: Resource,
    record: Partial<WorkspaceRecord> & { id: string },
    existing?: WorkspaceRecord,
  ) => Promise<WorkspaceRecord>;
  remove: (resource: Resource, record: WorkspaceRecord) => Promise<void>;
};
const WorkspaceContext = createContext<WorkspaceContextType | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw Error('Workspace provider missing');
  return value;
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Request failed. Please try again.');
  return data.data;
}
export function Providers({
  children,
  demo,
  user,
}: {
  children: ReactNode;
  demo: boolean;
  user: SessionUser;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: true } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <WorkspaceProvider demo={demo} user={user}>
        {children}
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
function WorkspaceProvider({
  children,
  demo,
  user,
}: {
  children: ReactNode;
  demo: boolean;
  user: SessionUser;
}) {
  const client = useQueryClient();
  const wwc = usePathname() === '/wwc';
  const [samples] = useState(createDemoData);
  const [editor, setEditor] = useState<Editor>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; error: boolean }[]>([]);
  const notify = useCallback((message: string, error = false) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-3), { id, message, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);
  const tasks = useQuery({
    queryKey: ['workspace', 'tasks'],
    queryFn: () => api<WorkspaceRecord[]>('/api/tasks?limit=5000'),
    initialData: demo ? samples.tasks : undefined,
    enabled: !demo,
  });
  const events = useQuery({
    queryKey: ['workspace', 'events'],
    queryFn: () => api<WorkspaceRecord[]>('/api/events?limit=5000'),
    initialData: demo ? samples.events : undefined,
    enabled: !demo,
  });
  const activities = useQuery({
    queryKey: ['workspace', 'activities'],
    queryFn: () => api<WorkspaceRecord[]>('/api/activities?limit=5000'),
    initialData: demo ? samples.activities : undefined,
    enabled: !demo,
  });
  const feedback = useQuery({
    queryKey: ['workspace', 'feedback'],
    queryFn: () => api<WorkspaceRecord[]>('/api/feedback?limit=5000'),
    initialData: demo ? samples.feedback : undefined,
    enabled: !demo,
  });
  const participants = useQuery({
    queryKey: ['workspace', 'wwc-participants'],
    queryFn: () => api<WorkspaceRecord[]>('/api/wwc-participants?limit=5000'),
    initialData: demo ? samples['wwc-participants'] : undefined,
    enabled: !demo && wwc,
  });
  const questions = useQuery({
    queryKey: ['workspace', 'wwc-questions'],
    queryFn: () => api<WorkspaceRecord[]>('/api/wwc-questions?limit=5000'),
    initialData: demo ? samples['wwc-questions'] : undefined,
    enabled: !demo && wwc,
  });
  const queries = [tasks, events, activities, feedback, ...(wwc ? [participants, questions] : [])];
  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['workspace'] });
  }, [client]);
  useEffect(() => {
    let theme = 'light';
    try {
      theme = localStorage.getItem('nesco-theme') || 'light';
    } catch {}
    document.documentElement.dataset.theme = theme;
  }, []);
  async function save(
    resource: Resource,
    input: Partial<WorkspaceRecord> & { id: string },
    existing?: WorkspaceRecord,
  ) {
    if (user.role === 'viewer') throw Error('Your account has read-only access.');
    if (demo && resource === 'feedback' && !existing)
      throw Error(
        'Connect Google Sheets to submit feedback. Your draft remains saved on this device.',
      );
    const key = ['workspace', resource];
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<WorkspaceRecord[]>(key) || [];
    const now = new Date().toISOString();
    const optimistic = {
      ...existing,
      ...input,
      created_at: existing?.created_at || now,
      updated_at: now,
    } as WorkspaceRecord;
    client.setQueryData<WorkspaceRecord[]>(
      key,
      existing
        ? previous.map((r) => (r.id === existing.id ? optimistic : r))
        : [...previous, optimistic],
    );
    try {
      const saved = demo
        ? optimistic
        : await api<WorkspaceRecord>(`/api/${resource}${existing ? `/${existing.id}` : ''}`, {
            method: existing ? 'PATCH' : 'POST',
            body: JSON.stringify({ ...input, if_unmodified_since: existing?.updated_at }),
          });
      client.setQueryData<WorkspaceRecord[]>(key, (old) =>
        (old || []).map((r) => (r.id === saved.id ? saved : r)),
      );
      notify(
        demo
          ? 'Demo updated · changes reset when you reload.'
          : existing
            ? 'Changes saved to Google Sheets.'
            : 'Created and saved to Google Sheets.',
      );
      return saved;
    } catch (error) {
      client.setQueryData(key, previous);
      throw error;
    }
  }
  async function remove(resource: Resource, record: WorkspaceRecord) {
    const key = ['workspace', resource];
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<WorkspaceRecord[]>(key);
    client.setQueryData<WorkspaceRecord[]>(key, (old) =>
      (old || []).filter((r) => r.id !== record.id),
    );
    try {
      if (!demo)
        await api(`/api/${resource}/${record.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ if_unmodified_since: record.updated_at }),
        });
      notify(demo ? 'Removed from this demo session.' : 'Record deleted.');
    } catch (error) {
      client.setQueryData(key, previous);
      throw error;
    }
  }
  return (
    <WorkspaceContext.Provider
      value={{
        data: {
          tasks: tasks.data || [],
          events: events.data || [],
          activities: activities.data || [],
          feedback: feedback.data || [],
          'wwc-participants': participants.data || [],
          'wwc-questions': questions.data || [],
        },
        demo,
        user,
        loading: queries.some((q) => q.isLoading),
        error: queries.find((q) => q.error)?.error?.message || null,
        refresh,
        editor,
        setEditor,
        notify,
        save,
        remove,
      }}
    >
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast ${t.error ? 'toast-error' : ''}`} key={t.id}>
            {t.error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
            <span>{t.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToasts((old) => old.filter((x) => x.id !== t.id))}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </WorkspaceContext.Provider>
  );
}
