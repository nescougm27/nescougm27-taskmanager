'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  SquareCheckBig,
  CircleDashed,
  CircleCheck,
  Clock3,
  ArrowUpRight,
  Plus,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  Code2,
  Figma,
  Plug,
  ShieldCheck,
  Rocket,
  MessageSquareText,
  GitCommitHorizontal,
  Flag,
  Layers3,
  Circle,
  CheckCheck,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { addDays } from 'date-fns';
import { useWorkspace } from './providers';
import {
  Avatar,
  Badge,
  EmptyState,
  MetricCard,
  PageHeading,
  Priority,
  SectionHeading,
  Status,
} from './shared';
import { Button } from './ui/button';
import { displayDate, jakartaDate, overdue } from '@/lib/utils';
import { categories, type WorkspaceRecord } from '@/lib/schema';
const categoryIcons = [Figma, Code2, Plug, ShieldCheck, Rocket];
export function Overview() {
  const { data, setEditor, demo } = useWorkspace();
  const [focus, setFocus] = useState('High priority');
  const [now] = useState(() => new Date());
  const today = jakartaDate(now);
  const tasks = data.tasks;
  const done = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const late = tasks.filter((t) => overdue(t, today));
  const active = tasks.filter((t) => t.status === 'In Progress');
  const week = jakartaDate(addDays(now, 7));
  const focused = tasks
    .filter(
      (t) =>
        t.status !== 'Done' &&
        (focus === 'Due today'
          ? t.due_date === today
          : focus === 'This week'
            ? t.due_date >= today && t.due_date <= week
            : focus === 'Overdue'
              ? overdue(t, today)
              : t.priority === 'High' || t.priority === 'Urgent'),
    )
    .sort((a, b) => {
      const p = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return (
        (p[a.priority as keyof typeof p] ?? 4) - (p[b.priority as keyof typeof p] ?? 4) ||
        a.due_date.localeCompare(b.due_date)
      );
    })
    .slice(0, 4);
  const upcoming = data.events
    .filter((e) => new Date(e.end_datetime) >= now)
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
    .slice(0, 3);
  const activity: (WorkspaceRecord & { kind: string })[] = [
    ...data.activities.map((a) => ({ ...a, kind: 'activity' })),
    ...tasks.map((t) => ({ ...t, kind: 'task' })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 3);
  const chart = [
    { name: 'Completed', value: done },
    { name: 'In progress', value: active.length },
    { name: 'Remaining', value: tasks.length - done - active.length },
  ];
  return (
    <>
      <PageHeading
        eyebrow="LET’S MAKE SOMETHING GREAT"
        title="A little progress. A bigger picture."
        description="Here’s where we are, what’s next, and what needs your attention."
        actions={
          <>
            <span className="current-date">
              <CalendarDays size={15} />
              {new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(now)}
            </span>
            <Button onClick={() => setEditor({ resource: 'tasks' })}>
              <Plus size={17} />
              Create task
            </Button>
          </>
        }
      />
      <div className="welcome-card">
        <div className="welcome-copy">
          <Badge tone="welcome">
            <span className="live-dot" />
            NESCO 2027 · WEB DEVELOPMENT
          </Badge>
          <h2>
            Big ideas. Thoughtful code.
            <br />
            One shared workspace.
          </h2>
          <p>
            Plan with purpose, build together, and bring
            <br className="desktop-break" /> the next NESCO experience to life.
          </p>
          <Link href="/tasks">
            Let’s see what’s next <ArrowRight size={16} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="code-window">
            <div className="code-window-top">
              <span />
              <span />
              <span />
              <i>nesco / 2027</i>
            </div>
            <div className="code-line">
              <span>const</span> nextChapter = {'{'}
            </div>
            <div className="code-line indent">
              team: <em>"web development"</em>,
            </div>
            <div className="code-line indent">
              ideas: <em>Infinity</em>,
            </div>
            <div className="code-line indent">
              status: <b>"building together"</b>
            </div>
            <div className="code-line">{'}'};</div>
            <div className="code-comment">// small steps, meaningful impact.</div>
          </div>
          <div className="floating-check">
            <CheckCheck size={18} />
            <span>Built with purpose</span>
          </div>
          <span className="art-spark art-spark-one">+</span>
          <span className="art-spark art-spark-two">+</span>
        </div>
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Total tasks"
          value={tasks.length.toString().padStart(2, '0')}
          caption="Across all development stages"
          icon={Layers3}
        />
        <MetricCard
          label="In progress"
          value={active.length.toString().padStart(2, '0')}
          caption="Good things are taking shape"
          icon={CircleDashed}
          tone="blue"
        />
        <MetricCard
          label="Completed"
          value={done.toString().padStart(2, '0')}
          caption={`${progress}% of the journey, done`}
          icon={CircleCheck}
        />
        <MetricCard
          label="Overdue"
          value={late.length.toString().padStart(2, '0')}
          caption={late.length ? 'A little attention goes a long way' : 'Everything is on track'}
          icon={Clock3}
          tone="amber"
        />
      </div>
      <div className="overview-primary">
        <section className="panel progress-panel">
          <SectionHeading
            title="The bigger picture"
            subtitle="Every completed task moves us forward."
            action={<Badge tone="green">{progress}% complete</Badge>}
          />
          <div className="progress-content">
            <div className="progress-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasks.length ? chart : [{ name: 'No tasks', value: 1 }]}
                    dataKey="value"
                    innerRadius="75%"
                    outerRadius="96%"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={tasks.length ? 4 : 0}
                    stroke="none"
                    cornerRadius={5}
                    isAnimationActive={false}
                  >
                    {(tasks.length ? chart : [{}]).map((_, i) => (
                      <Cell key={i} fill={['#397854', '#b4d6b1', '#edf1e9'][i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e1eae3', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-label">
                <strong>
                  {progress}
                  <span>%</span>
                </strong>
                <span>Overall progress</span>
              </div>
            </div>
            <div className="category-progress">
              {categories.map((category, i) => {
                const all = tasks.filter((t) => t.category === category);
                const completed = all.filter((t) => t.status === 'Done').length;
                const percent = all.length ? Math.round((completed / all.length) * 100) : 0;
                const Icon = categoryIcons[i];
                return (
                  <div className="category-row" key={category}>
                    <div className="category-label">
                      <Icon size={15} />
                      <span>{category}</span>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${percent}%`,
                          background: ['#326649', '#5c9364', '#8ab18a', '#a6c6a0', '#c0d6b8'][i],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="progress-legend">
            <span>
              <i style={{ background: '#397854' }} />
              Completed
            </span>
            <span>
              <i style={{ background: '#b4d6b1' }} />
              In progress
            </span>
            <span>
              <i style={{ background: '#edf1e9' }} />
              Up next
            </span>
            <span className="legend-total">
              {done} of {tasks.length} tasks
            </span>
          </div>
        </section>
        <section className="panel upcoming-panel">
          <SectionHeading
            title="On the horizon"
            subtitle={`${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'} · all times WIB`}
            href="/calendar"
          />
          <div className="upcoming-list">
            {upcoming.map((event, i) => (
              <button
                key={event.id}
                className="upcoming-event"
                onClick={() => setEditor({ resource: 'events', record: event })}
              >
                <div className={`event-date event-date-${i}`}>
                  <span>{displayDate(event.start_datetime, 'MMM').toUpperCase()}</span>
                  <strong>{displayDate(event.start_datetime, 'dd')}</strong>
                </div>
                <div className="event-summary">
                  <Badge tone={i === 0 ? 'green' : i === 1 ? 'purple' : 'amber'}>
                    {event.category}
                  </Badge>
                  <h3>{event.title}</h3>
                  <p>
                    <Clock3 size={12} />
                    {new Date(event.start_datetime).toLocaleTimeString('en-GB', {
                      timeZone: 'Asia/Jakarta',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB <span>·</span>
                    {event.location.startsWith('http')
                      ? 'Online meeting'
                      : event.location || 'Location to be confirmed'}
                  </p>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          {!upcoming.length && (
            <EmptyState
              title="Room for what’s next"
              description="Add your next meeting or milestone."
            />
          )}
          <button className="subtle-action" onClick={() => setEditor({ resource: 'events' })}>
            <Plus size={15} />
            Add to the calendar
          </button>
        </section>
      </div>
      <section className="panel focus-panel">
        <SectionHeading
          title="A little focus goes a long way"
          subtitle="Your next steps, with the important things first."
          href="/tasks"
          label="Open task manager"
        />
        <div className="focus-tabs" role="tablist" aria-label="Task focus">
          {['High priority', 'Due today', 'This week', 'Overdue'].map((f) => (
            <button
              role="tab"
              aria-selected={focus === f}
              className={focus === f ? 'selected' : ''}
              key={f}
              onClick={() => setFocus(f)}
            >
              {f}
              {f === 'Overdue' && late.length > 0 && <span>{late.length}</span>}
            </button>
          ))}
        </div>
        <div className="table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task name</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due date</th>
                <th>
                  <span className="sr-only">Open task</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {focused.map((task) => (
                <tr key={task.id}>
                  <td>
                    <button
                      className="table-task-title"
                      onClick={() => setEditor({ resource: 'tasks', record: task })}
                    >
                      <SquareCheckBig size={16} />
                      <span>
                        <strong>{task.title}</strong>
                        <small>{task.category}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <Status value={task.status} />
                  </td>
                  <td>
                    <Priority value={task.priority} />
                  </td>
                  <td>
                    <span className="assignee-cell">
                      <Avatar name={task.assignee} small />
                      <span>{task.assignee || 'Unassigned'}</span>
                    </span>
                  </td>
                  <td>
                    <span className={overdue(task, today) ? 'date-overdue' : 'table-date'}>
                      {overdue(task, today) && <Clock3 size={12} />} {displayDate(task.due_date)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => setEditor({ resource: 'tasks', record: task })}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!focused.length && (
          <EmptyState
            title="A clear head, a clear list"
            description="No tasks match this focus. You’re ready for what’s next."
          />
        )}
        <div className="table-footer">
          <span>
            Showing {focused.length} focus {focused.length === 1 ? 'task' : 'tasks'}
          </span>
          <Link href="/tasks">
            View all {tasks.length} tasks <ArrowRight size={14} />
          </Link>
        </div>
      </section>
      <div className="overview-bottom">
        <section className="panel recent-panel">
          <SectionHeading
            title="Small steps, shared progress"
            subtitle="The latest from your workspace."
            href="/activities"
          />
          <div className="activity-feed">
            {activity.map((item, i) => (
              <div className="feed-item" key={item.id}>
                <span className={`feed-icon feed-icon-${i}`}>
                  {item.kind === 'task' ? (
                    <SquareCheckBig size={15} />
                  ) : (
                    <GitCommitHorizontal size={17} />
                  )}
                </span>
                <div>
                  <p>
                    {item.kind === 'task' ? (
                      <>
                        <strong>{item.assignee || 'Team'}</strong> updated a task
                      </>
                    ) : (
                      <>Activity documented</>
                    )}
                  </p>
                  <button
                    onClick={() =>
                      setEditor({
                        resource: item.kind === 'task' ? 'tasks' : 'activities',
                        record: item,
                      })
                    }
                  >
                    {item.title}
                  </button>
                  <small>{displayDate(item.updated_at, 'MMM d, HH:mm')}</small>
                </div>
              </div>
            ))}
          </div>
          {!activity.length && (
            <EmptyState
              title="Your story starts here"
              description="Updates will appear as the team makes progress."
            />
          )}
        </section>
        <section className="panel requests-panel">
          <SectionHeading
            title="Ideas for what’s next"
            subtitle="Your team’s latest feature and page requests."
            href="/feedback"
          />
          {data.feedback
            .filter((f) => f.type !== 'evaluation')
            .slice(-2)
            .reverse()
            .map((f) => (
              <Link
                href={`/feedback?search=${encodeURIComponent(f.title)}`}
                className="request-preview"
                key={f.id}
              >
                <span className="request-preview-icon">
                  <MessageSquareText size={17} />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>
                    {f.type === 'feature_request' ? 'Feature request' : 'Page request'}{' '}
                    <span>·</span> {f.division}
                  </p>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          {!data.feedback.filter((f) => f.type !== 'evaluation').length && (
            <EmptyState
              title="Good ideas are welcome"
              description="Share a feature or page request with the team."
            />
          )}
          <Link className="subtle-action" href="/feedback">
            <Plus size={15} />
            Share an idea
          </Link>
        </section>
      </div>
    </>
  );
}
