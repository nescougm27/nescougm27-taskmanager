'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useWorkspace } from './providers';
import {
  Badge,
  Confirmation,
  EmptyState,
  MetricCard,
  PageHeading,
  Priority,
  SearchInput,
  Status,
} from './shared';
import { Field } from './record-editor';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { feedbackSchema, priorities, requestStatuses, type WorkspaceRecord } from '@/lib/schema';
import { displayDate } from '@/lib/utils';
const types = [
  {
    value: 'evaluation',
    title: 'Evaluation 2026',
    short: 'Evaluation',
    icon: MessageSquareText,
    description: 'Look back to move forward.',
  },
  {
    value: 'feature_request',
    title: 'Feature Request',
    short: 'Feature',
    icon: Lightbulb,
    description: 'A better way to do something.',
  },
  {
    value: 'page_request',
    title: 'Page Request',
    short: 'Page',
    icon: FileText,
    description: 'Make space for something new.',
  },
] as const;
type FeedbackType = (typeof types)[number]['value'];
const ratingFields = [
  ['rating_design', 'Website design', 'Visual identity, layout, and consistency.'],
  ['rating_ux', 'User experience', 'How easy was it to find your way?'],
  ['rating_responsiveness', 'Responsiveness', 'The experience across different screen sizes.'],
  ['rating_performance', 'Loading performance', 'Speed and smoothness when using the website.'],
  ['rating_functionality', 'Feature functionality', 'Did the website’s features work as expected?'],
  ['rating_reliability', 'Technical reliability', 'Stability, errors, and availability.'],
] as const;
const initial = (type: FeedbackType): Record<string, string> => ({
  type,
  submitter: '',
  division: '',
  title: '',
  module: '',
  slug: '',
  description: '',
  problem: '',
  expected_behavior: '',
  priority: 'Medium',
  reference_url: '',
  extra_json: '{}',
  rating_design: '',
  rating_ux: '',
  rating_responsiveness: '',
  rating_performance: '',
  rating_functionality: '',
  rating_reliability: '',
  strengths: '',
  weaknesses: '',
  recommendations: '',
  additional_notes: '',
  maintain: '',
  improve: '',
  avoid: '',
  proposed_feature: '',
  audience: '',
  sections: '',
  features: '',
  submission_id: '',
});
const draftKey = (type: string) => `nesco-feedback-draft-${type}`;
function readDraft(type: FeedbackType) {
  try {
    const raw = localStorage.getItem(draftKey(type));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
        return {
          ...initial(type),
          ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === 'string')),
          type,
        };
    }
  } catch {}
  return initial(type);
}
export function Feedback() {
  const { data, user, demo } = useWorkspace();
  const [tab, setTab] = useState('Share feedback');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('search');
    if (query) {
      setSearch(query);
      setTab('Submission directory');
    }
  }, []);
  const evaluations = data.feedback.filter((f) => f.type === 'evaluation');
  const features = data.feedback.filter((f) => f.type === 'feature_request');
  const pages = data.feedback.filter((f) => f.type === 'page_request');
  const pending = data.feedback.filter(
    (f) => f.type !== 'evaluation' && (f.status === 'Submitted' || f.status === 'Under Review'),
  ).length;
  const ratings = evaluations.flatMap((e) =>
    ratingFields.map(([key]) => Number(e[key])).filter((n) => n >= 1 && n <= 5),
  );
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return (
    <>
      <PageHeading
        eyebrow="BETTER, TOGETHER"
        title="Evaluate the past. Shape what’s next."
        description="Thoughtful feedback today. A better NESCO experience tomorrow."
      />
      <div className="metrics-grid feedback-metrics">
        <MetricCard
          label="Evaluations 2026"
          value={user.role === 'admin' ? evaluations.length : '—'}
          caption={
            user.role !== 'admin'
              ? 'Responses are private to administrators'
              : 'Reflections from the previous chapter'
          }
          icon={MessageSquareText}
        />
        <MetricCard
          label="Feature requests"
          value={features.length}
          caption="Ideas that make a difference"
          icon={Lightbulb}
          tone="amber"
        />
        <MetricCard
          label="Page requests"
          value={pages.length}
          caption="New spaces worth creating"
          icon={FileText}
          tone="blue"
        />
        <MetricCard
          label="Pending review"
          value={pending}
          caption="Ready for a thoughtful look"
          icon={Clock3}
          tone="purple"
        />
      </div>
      {evaluations.length >= 2 && (
        <div className="evaluation-average">
          <Star size={20} />
          <strong>
            {average.toFixed(1)}
            <span>/ 5</span>
          </strong>
          <span>Average website rating · {evaluations.length} evaluations</span>
        </div>
      )}
      <div className="feedback-main-tabs" role="tablist" aria-label="Feedback center view">
        {['Share feedback', 'Submission directory'].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'selected' : ''}
            onClick={() => setTab(t)}
            key={t}
          >
            {t === 'Share feedback' ? <Plus size={16} /> : <FileText size={16} />} {t}
            {t === 'Submission directory' && <span>{data.feedback.length}</span>}
          </button>
        ))}
        <span>
          <ShieldCheck size={14} />A space for constructive ideas
        </span>
      </div>
      {tab === 'Share feedback' ? (
        <div className="feedback-layout">
          <FeedbackForm />
          <aside className="feedback-aside">
            <div className="feedback-aside-card">
              <span className="aside-spark">
                <Sparkles size={23} />
              </span>
              <h2>
                Good ideas
                <br />
                start with you.
              </h2>
              <p>
                Whether you noticed something that could be better or imagined something entirely
                new, this is the place to share it.
              </p>
              <div className="feedback-steps">
                <div>
                  <span>01</span>
                  <p>
                    <strong>Choose your perspective</strong>Reflect, suggest a feature, or propose a
                    page.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <p>
                    <strong>Give it some context</strong>The why matters just as much as the what.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <p>
                    <strong>Help shape the next chapter</strong>Your input becomes part of the plan.
                  </p>
                </div>
              </div>
            </div>
            <div className="privacy-note">
              <LockKeyhole size={17} />
              <div>
                <strong>A note on privacy</strong>
                <p>
                  Evaluation responses are only visible to authorized reviewers. Feature and page
                  requests are shared with the committee.
                </p>
              </div>
            </div>
            <div className="draft-note">
              <Save size={17} />
              <div>
                <strong>Pick up where you left off</strong>
                <p>
                  Unfinished drafts are saved on this device, separately for each feedback type.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <FeedbackDirectory initialSearch={search} />
      )}
    </>
  );
}
function FeedbackForm() {
  const { save, demo, notify, user } = useWorkspace();
  const [type, setType] = useState<FeedbackType>('evaluation');
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<Record<string, string> | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const form = useForm<Record<string, string>>({
    defaultValues: initial('evaluation'),
    resolver: zodResolver(feedbackSchema.passthrough()) as unknown as Resolver<
      Record<string, string>
    >,
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form;
  useEffect(() => {
    const values = readDraft('evaluation');
    values.submission_id ||= crypto.randomUUID();
    reset(values);
  }, [reset]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sub = watch((values) => {
      if (values.type !== type) return;
      clearTimeout(timer);
      setSaved(false);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(draftKey(type), JSON.stringify(values));
          setSaved(true);
        } catch {
          setSaved(false);
        }
      }, 650);
    });
    return () => {
      clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [type, watch]);
  function changeType(next: FeedbackType) {
    if (next === type) return;
    try {
      localStorage.setItem(draftKey(type), JSON.stringify(getValues()));
    } catch {}
    const values = readDraft(next);
    values.submission_id ||= crypto.randomUUID();
    setType(next);
    reset(values);
    setSaved(false);
    setError('');
    setSuccess(false);
  }
  const textField = (
    name: string,
    label: string,
    placeholder = '',
    required = false,
    inputType = 'text',
  ) => (
    <Field key={name} label={label} error={errors[name]?.message} required={required}>
      <input
        type={inputType}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={!!errors[name]}
      />
    </Field>
  );
  const textArea = (name: string, label: string, placeholder = '', required = false) => (
    <Field key={name} label={label} error={errors[name]?.message} required={required}>
      <textarea
        rows={3}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={!!errors[name]}
      />
    </Field>
  );
  const values = watch();
  function review(values: Record<string, string>) {
    const extra = Object.fromEntries(
      [
        'additional_notes',
        'maintain',
        'improve',
        'avoid',
        'proposed_feature',
        'audience',
        'sections',
        'features',
      ].map((key) => [key, values[key] || '']),
    );
    setError('');
    setPreview({ ...values, extra_json: JSON.stringify(extra) });
  }
  async function submit() {
    if (!preview || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      await save('feedback', { ...preview, id: preview.submission_id || crypto.randomUUID() });
      try {
        localStorage.removeItem(draftKey(type));
      } catch {}
      setSuccess(true);
      setPreview(null);
      const next = initial(type);
      next.submission_id = crypto.randomUUID();
      reset(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <section className="panel feedback-form-panel">
      <div className="feedback-form-header">
        <h2>Every perspective counts.</h2>
        <p>What would you like to share with the team?</p>
      </div>
      <div className="feedback-type-selector" role="tablist" aria-label="Submission type">
        {types.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={type === t.value}
            className={type === t.value ? 'selected' : ''}
            onClick={() => changeType(t.value)}
          >
            <t.icon size={18} />
            <strong>{t.title}</strong>
            <small>{t.description}</small>
            {type === t.value && <CheckCircle2 size={15} className="type-check" />}
          </button>
        ))}
      </div>
      {success ? (
        <div className="submission-success" role="status">
          <span>
            <CheckCheck size={32} />
          </span>
          <h2>Your perspective is part of the plan.</h2>
          <p>
            Your {type === 'evaluation' ? 'evaluation' : 'request'} was saved to Google Sheets.
            Thank you for helping shape NESCO 2027.
          </p>
          <Button onClick={() => setSuccess(false)}>
            <Plus size={16} />
            Share something else
          </Button>
        </div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit(review)} noValidate>
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h3>A little about you</h3>
              <p>Let the team know where your perspective comes from.</p>
            </div>
          </div>
          <div className="form-grid">
            {textField(
              'submitter',
              type === 'evaluation' ? 'Respondent name' : 'Requester name',
              'Your name',
              true,
            )}
            {textField(
              'division',
              type === 'evaluation' ? 'Previous committee role' : 'Committee role / division',
              'e.g. Web Development',
              true,
            )}
          </div>
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h3>
                {type === 'evaluation'
                  ? 'Looking back at NESCO 2026'
                  : type === 'feature_request'
                    ? 'An idea worth exploring'
                    : 'A page with a purpose'}
              </h3>
              <p>
                {type === 'evaluation'
                  ? 'Rate your experience. 1 is poor, 5 is excellent.'
                  : type === 'feature_request'
                    ? 'Help us understand the problem and your proposed solution.'
                    : 'Tell us what this page should do and who it is for.'}
              </p>
            </div>
          </div>
          {type === 'evaluation' ? (
            <>
              <div className="rating-grid">
                {ratingFields.map(([key, label, hint]) => (
                  <fieldset className="rating-field" key={key}>
                    <legend>
                      {label}
                      <span className="required-mark">*</span>
                    </legend>
                    <p>{hint}</p>
                    <div className="rating-options" role="radiogroup" aria-label={label}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          key={n}
                          className={Number(values[key]) >= n ? 'rating-active' : ''}
                          title={`${n} out of 5`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            {...register(key)}
                            value={String(n)}
                            aria-label={`${label}: ${n} out of 5`}
                          />
                          <Star
                            size={20}
                            fill={Number(values[key]) >= n ? 'currentColor' : 'none'}
                          />
                          <span>{n}</span>
                        </label>
                      ))}
                    </div>
                    {errors[key] && (
                      <span className="field-error" role="alert">
                        {errors[key]?.message}
                      </span>
                    )}
                  </fieldset>
                ))}
              </div>
              {textArea(
                'description',
                'Your overall experience',
                'A short reflection on the website and development process.',
                true,
              )}
              {textArea(
                'strengths',
                'What worked well?',
                'The details that made a positive difference.',
              )}
              {textArea(
                'weaknesses',
                'What problems occurred?',
                'Describe challenges with the website or the development process.',
              )}
              {textArea(
                'maintain',
                'What features should be maintained?',
                'What should we carry into the next chapter?',
              )}
              {textArea(
                'improve',
                'What should be improved?',
                'Where could the experience be clearer, faster, or easier?',
              )}
              {textArea(
                'avoid',
                'What should we avoid in NESCO 2027?',
                'Lessons worth remembering.',
              )}
              {textArea(
                'recommendations',
                'Recommendations for the next team',
                'What would you tell the next development committee?',
              )}
            </>
          ) : (
            <>
              {textField(
                'title',
                type === 'feature_request' ? 'Feature title' : 'Proposed page title',
                type === 'feature_request'
                  ? 'Give your idea a clear, short name'
                  : 'e.g. Competition guide',
                true,
              )}
              {type === 'feature_request' ? (
                <>
                  {textField(
                    'module',
                    'Related website module',
                    'e.g. Registration, Competitions, Homepage',
                  )}
                  {textArea(
                    'problem',
                    'What problem should we solve?',
                    'Describe the challenge and who experiences it.',
                    true,
                  )}
                  {textArea('proposed_feature', 'Proposed feature', 'How could we make it better?')}
                  {textArea(
                    'description',
                    'Describe your idea',
                    'Explain your proposed feature and why it matters.',
                    true,
                  )}
                  {textArea(
                    'expected_behavior',
                    'Expected behavior',
                    'What should happen when someone uses this feature?',
                  )}
                </>
              ) : (
                <>
                  {textField('slug', 'Suggested URL slug', '/competition-guide', true)}
                  {textArea(
                    'description',
                    'Purpose of the page',
                    'What should this page help people do?',
                    true,
                  )}
                  {textField(
                    'audience',
                    'Target audience',
                    'e.g. Participants, partners, committee members',
                  )}
                  {textArea(
                    'sections',
                    'Required sections',
                    'List the content sections this page needs.',
                  )}
                  {textArea(
                    'features',
                    'Required features',
                    'List interactions or functionality it should include.',
                  )}
                </>
              )}
              <div className="form-grid">
                <Field label="Priority" error={errors.priority?.message}>
                  <select {...register('priority')}>
                    {priorities.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                {textField(
                  'reference_url',
                  type === 'page_request' ? 'Content / design reference URL' : 'Reference URL',
                  'https://',
                  false,
                  'url',
                )}
              </div>
            </>
          )}
          <div className="form-section-heading">
            <span>03</span>
            <div>
              <h3>Anything else?</h3>
              <p>A little extra context can go a long way.</p>
            </div>
          </div>
          {textArea(
            'additional_notes',
            'Additional notes',
            'Anything you would like the team to know.',
          )}
          <div className="feedback-form-footer">
            <span>
              <Save size={14} />
              {saved ? 'Draft saved on this device' : 'Draft saves automatically'}
            </span>
            <Button type="submit" disabled={user.role === 'viewer'}>
              Review submission <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!pending && !open) {
            setPreview(null);
            setError('');
          }
        }}
      >
        <DialogContent className="submission-preview">
          <DialogTitle>A quick look before you share.</DialogTitle>
          <DialogDescription>
            Review your {type === 'evaluation' ? 'evaluation' : 'request'} before submitting it to
            the workspace.
          </DialogDescription>
          {preview && (
            <>
              <div className="preview-summary">
                <Badge tone="green">{types.find((t) => t.value === type)?.title}</Badge>
                <h3>{preview.title || 'Website evaluation 2026'}</h3>
                <p>
                  {preview.submitter} · {preview.division}
                </p>
              </div>
              <dl className="preview-fields">
                {Object.entries(preview)
                  .filter(
                    ([k, v]) =>
                      v &&
                      ![
                        'type',
                        'submitter',
                        'division',
                        'title',
                        'extra_json',
                        'submission_id',
                      ].includes(k),
                  )
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replace(/^rating_/, 'Rating · ').replaceAll('_', ' ')}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
              {demo && (
                <div className="inline-notice">
                  This is a demo preview. Connect Google Sheets before submitting. Your unfinished
                  draft is saved on this device.
                </div>
              )}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <div className="form-actions">
                <Button variant="outline" disabled={pending} onClick={() => setPreview(null)}>
                  Back to editing
                </Button>
                <Button
                  onClick={() => void submit()}
                  disabled={pending || demo || user.role === 'viewer'}
                >
                  {pending ? <Loader2 size={16} className="spin" /> : <Check size={16} />}{' '}
                  {pending ? 'Submitting…' : error ? 'Retry submission' : 'Confirm & submit'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function FeedbackDirectory({ initialSearch }: { initialSearch: string }) {
  const { data, user, demo, save, remove, notify } = useWorkspace();
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('All statuses');
  const [priority, setPriority] = useState('All priorities');
  const [selected, setSelected] = useState<WorkspaceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  const records = data.feedback
    .filter(
      (f) =>
        `${f.title} ${f.description} ${f.submitter}`.toLowerCase().includes(search.toLowerCase()) &&
        (type === 'all' ? f.type !== 'evaluation' : f.type === type) &&
        (type === 'evaluation' || status === 'All statuses' || f.status === status) &&
        (priority === 'All priorities' || f.priority === priority),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const canReview = demo || user.role === 'admin';
  const canAdmin = demo || user.role === 'admin';
  const current = selected ? data.feedback.find((f) => f.id === selected.id) || selected : null;
  let extra: Record<string, string> = {};
  try {
    extra = JSON.parse(current?.extra_json || '{}');
  } catch {}
  return (
    <>
      <div className="directory-tabs" role="tablist" aria-label="Feedback directory type">
        {[
          { value: 'all', title: 'All requests' },
          ...types.filter((t) => t.value !== 'evaluation'),
          ...(canReview ? [{ value: 'evaluation', title: 'Private evaluations' }] : []),
        ].map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={type === t.value}
            className={type === t.value ? 'selected' : ''}
            onClick={() => {
              setType(t.value);
              setStatus('All statuses');
              setPriority('All priorities');
            }}
          >
            {t.value === 'evaluation' && <LockKeyhole size={13} />} {t.title}
          </button>
        ))}
      </div>
      {type === 'evaluation' && (
        <div className="inline-notice">
          <LockKeyhole size={15} />
          Evaluation responses are private to authorized reviewers and do not use the request
          approval workflow.
        </div>
      )}
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search submissions…" />
        <div className="toolbar-spacer" />
        {type !== 'evaluation' && (
          <>
            <select
              className="compact-select"
              aria-label="Submission status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['All statuses', ...requestStatuses].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="compact-select"
              aria-label="Submission priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {['All priorities', ...priorities].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </>
        )}
      </div>
      <section className="panel">
        <div className="table-scroll">
          <table className="task-table feedback-table">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Submitted by</th>
                {type !== 'evaluation' && (
                  <>
                    <th>Priority</th>
                    <th>Status</th>
                  </>
                )}
                <th>Date</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((f) => (
                <tr key={f.id}>
                  <td>
                    <button
                      className="table-task-title"
                      onClick={() => {
                        setSelected(f);
                        setDeleting(false);
                      }}
                    >
                      <span className="request-row-icon">
                        {f.type === 'evaluation' ? (
                          <MessageSquareText size={17} />
                        ) : f.type === 'page_request' ? (
                          <FileText size={17} />
                        ) : (
                          <Lightbulb size={17} />
                        )}
                      </span>
                      <span>
                        <strong>{f.title || 'Website evaluation 2026'}</strong>
                        <small>{types.find((t) => t.value === f.type)?.title}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="submitter-cell">
                      <strong>{f.submitter}</strong>
                      <small>{f.division}</small>
                    </span>
                  </td>
                  {type !== 'evaluation' && (
                    <>
                      <td>
                        <Priority value={f.priority} />
                      </td>
                      <td>
                        <Status value={f.status} />
                      </td>
                    </>
                  )}
                  <td>{displayDate(f.created_at)}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`View ${f.title}`}
                      onClick={() => {
                        setSelected(f);
                        setDeleting(false);
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!records.length && (
          <EmptyState
            title="Room for a fresh perspective"
            description="No submissions match this view. Try another filter, or share your first idea."
          />
        )}
        <div className="table-footer">
          <span>
            {records.length} {records.length === 1 ? 'submission' : 'submissions'}
          </span>
          <span>
            {type === 'evaluation' ? 'Reviewer access only' : 'Ideas move forward, together.'}
          </span>
        </div>
      </section>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!pending && !open) setSelected(null);
        }}
      >
        <DialogContent className="feedback-detail">
          <DialogTitle>{current?.title || 'Website evaluation 2026'}</DialogTitle>
          <DialogDescription>
            {current?.submitter} · {current?.division} ·{' '}
            {displayDate(current?.created_at || '', 'd MMM yyyy')}
          </DialogDescription>
          {current && (
            <>
              <div className="detail-badges">
                <Badge tone="green">{types.find((t) => t.value === current.type)?.title}</Badge>
                {current.type !== 'evaluation' && (
                  <>
                    <Priority value={current.priority} />
                    <Status value={current.status} />
                  </>
                )}
              </div>
              <div className="feedback-detail-body">
                {current.type === 'evaluation' && (
                  <div className="rating-summary">
                    {ratingFields.map(([key, label]) => (
                      <div key={key}>
                        <span>{label}</span>
                        <strong>
                          <Star size={13} />
                          {current[key] || '—'} / 5
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
                {[
                  'description',
                  'module',
                  'slug',
                  'problem',
                  'expected_behavior',
                  'strengths',
                  'weaknesses',
                  'recommendations',
                ]
                  .filter((k) => current[k])
                  .map((k) => (
                    <section key={k}>
                      <h3>{k.replaceAll('_', ' ')}</h3>
                      <p>{current[k]}</p>
                    </section>
                  ))}
                {Object.entries(extra)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <section key={k}>
                      <h3>{k.replaceAll('_', ' ')}</h3>
                      <p>{String(v)}</p>
                    </section>
                  ))}
                {current.reference_url && /^https?:\/\//.test(current.reference_url) && (
                  <a
                    className="reference-link"
                    href={current.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open reference
                    <ArrowUpRight size={15} />
                  </a>
                )}
                {canAdmin && current.type !== 'evaluation' && (
                  <Field
                    label="Request review status"
                    hint="Only administrators can update the review workflow."
                  >
                    <select
                      value={current.status}
                      disabled={pending}
                      onChange={async (e) => {
                        setPending(true);
                        try {
                          await save('feedback', { ...current, status: e.target.value }, current);
                        } catch (error) {
                          notify((error as Error).message, true);
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      {requestStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {deleting && (
                  <Confirmation
                    title="Delete this submission?"
                    description="This shared record will be permanently removed."
                    pending={pending}
                    onCancel={() => setDeleting(false)}
                    onConfirm={async () => {
                      setPending(true);
                      try {
                        await remove('feedback', current);
                        setSelected(null);
                      } catch (e) {
                        notify((e as Error).message, true);
                      } finally {
                        setPending(false);
                      }
                    }}
                  />
                )}
              </div>
              <div className="form-actions">
                {canAdmin && (
                  <Button variant="ghost" disabled={pending} onClick={() => setDeleting(true)}>
                    <Trash2 size={15} />
                    Delete
                  </Button>
                )}
                <Button variant="outline" disabled={pending} onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
