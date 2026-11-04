'use client';
import { useEffect, useState } from 'react';
import {
  Plus,
  ChevronDown,
  ArrowUpRight,
  CalendarDays,
  Users,
  CheckCheck,
  Link2,
  ListChecks,
  MessageSquareText,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useWorkspace } from './providers';
import { Avatar, Badge, EmptyState, PageHeading, SearchInput, SectionHeading } from './shared';
import { Button } from './ui/button';
import { displayDate } from '@/lib/utils';
import { eventCategories, parseList } from '@/lib/schema';
export function Activities() {
  const { data, setEditor } = useWorkspace();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All activity types');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    setSearch(new URLSearchParams(window.location.search).get('search') || '');
  }, []);
  const records = data.activities
    .filter(
      (a) =>
        `${a.title} ${a.description}`.toLowerCase().includes(search.toLowerCase()) &&
        (type === 'All activity types' || a.type === type) &&
        (!from || a.date >= from) &&
        (!to || a.date <= to),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeading
        eyebrow="KEEP THE CONTEXT"
        title="The work behind the work."
        description="Conversations, decisions, and next steps. A shared memory for your team."
        actions={
          <Button onClick={() => setEditor({ resource: 'activities' })}>
            <Plus size={17} />
            Log activity
          </Button>
        }
      />
      <div className="activities-intro">
        <span className="activities-intro-icon">
          <ActivityIcon size={25} />
        </span>
        <div>
          <h2>Good work has a story.</h2>
          <p>
            Document what happened, capture what matters, and keep everyone moving in the same
            direction.
          </p>
        </div>
        <Badge tone="green">{data.activities.length} activities</Badge>
      </div>
      <div className="toolbar activity-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search activities…" />
        <select
          className="compact-select"
          aria-label="Activity type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {['All activity types', ...eventCategories].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <div className="toolbar-spacer" />
        <label className="date-filter">
          From
          <input
            type="date"
            aria-label="Activities from date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="date-filter">
          To
          <input
            type="date"
            aria-label="Activities to date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <div className="activity-timeline">
        {records.map((a) => (
          <article className="timeline-record" key={a.id}>
            <div className="timeline-date">
              <span>{displayDate(a.date, 'MMM').toUpperCase()}</span>
              <strong>{displayDate(a.date, 'dd')}</strong>
              <span>{displayDate(a.date, 'EEE')}</span>
            </div>
            <span className="timeline-dot" />
            <div className="panel activity-card">
              <div className="activity-card-header">
                <Badge tone={a.type === 'Design Review' ? 'purple' : 'green'}>{a.type}</Badge>
                <button
                  className="text-link"
                  onClick={() => setEditor({ resource: 'activities', record: a })}
                >
                  Edit activity
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <h2>{a.title}</h2>
              <p className="activity-description">{a.description}</p>
              <div className="activity-card-meta">
                <span>
                  <Users size={14} />
                  {a.responsible || 'No members assigned'}
                </span>
                <span>
                  <ListChecks size={14} />
                  {parseList(a.related_tasks_json).length} linked tasks
                </span>
              </div>
              <button
                className="activity-expand"
                aria-expanded={expanded === a.id}
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                {expanded === a.id ? 'Hide details' : 'Read notes & next steps'}
                <ChevronDown size={15} className={expanded === a.id ? 'rotate' : ''} />
              </button>
              {expanded === a.id && (
                <div className="activity-details">
                  {a.notes && (
                    <section>
                      <h3>
                        <MessageSquareText size={15} />
                        Meeting notes
                      </h3>
                      <p>{a.notes}</p>
                    </section>
                  )}
                  {a.decisions && (
                    <section>
                      <h3>
                        <CheckCheck size={16} />
                        Decisions
                      </h3>
                      <p>{a.decisions}</p>
                    </section>
                  )}
                  {parseList(a.follow_ups_json).filter(Boolean).length > 0 && (
                    <section>
                      <h3>
                        <ListChecks size={16} />
                        Follow-up actions
                      </h3>
                      <ul>
                        {parseList(a.follow_ups_json)
                          .filter(Boolean)
                          .map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                      </ul>
                    </section>
                  )}
                  {parseList(a.related_tasks_json).length > 0 && (
                    <section>
                      <h3>Related tasks</h3>
                      <div className="related-task-buttons">
                        {parseList(a.related_tasks_json).map((id) => {
                          const task = data.tasks.find((t) => t.id === id);
                          return task ? (
                            <button
                              key={id}
                              onClick={() => setEditor({ resource: 'tasks', record: task })}
                            >
                              {task.title}
                              <ArrowUpRight size={13} />
                            </button>
                          ) : (
                            <span key={id} className="muted">
                              Task no longer available
                            </span>
                          );
                        })}
                      </div>
                    </section>
                  )}
                  {parseList(a.references_json).length > 0 && (
                    <section>
                      <h3>
                        <Link2 size={15} />
                        References
                      </h3>
                      {parseList(a.references_json).map((url, i) =>
                        /^https?:\/\//.test(url) ? (
                          <a
                            className="reference-link"
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {url}
                            <ArrowUpRight size={13} />
                          </a>
                        ) : null,
                      )}
                    </section>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {!records.length && (
        <EmptyState
          title="Every step has a story"
          description={
            search || from || to || type !== 'All activity types'
              ? 'No activities match your filters.'
              : 'Log a meeting, design review, or development milestone.'
          }
          action={
            <Button onClick={() => setEditor({ resource: 'activities' })}>
              <Plus size={16} />
              Log your first activity
            </Button>
          }
        />
      )}
    </>
  );
}
