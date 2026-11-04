'use client';
import { useEffect, useState } from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Search,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  GripVertical,
  ArrowUpDown,
  ArrowUpRight,
  X,
  Layers3,
} from 'lucide-react';
import { useWorkspace } from './providers';
import { Avatar, Badge, EmptyState, PageHeading, Priority, SearchInput, Status } from './shared';
import { Button } from './ui/button';
import { TaskCategory } from './task-category';
import {
  categories,
  priorities,
  taskStatuses,
  parseList,
  type Subtask,
  type WorkspaceRecord,
} from '@/lib/schema';
import { memberCanEdit } from '@/lib/permissions';
import { cn, displayDate, overdue } from '@/lib/utils';
export function Tasks() {
  const { data, setEditor, save, notify, user } = useWorkspace();
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('All members');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [sort, setSort] = useState('deadline');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [filters, setFilters] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get('search') || '');
    try {
      setView(localStorage.getItem('nesco-task-view') || 'board');
    } catch {}
  }, []);
  const members = [...new Set(data.tasks.map((t) => t.assignee).filter(Boolean))];
  const tasks = data.tasks
    .filter(
      (t) =>
        `${t.title} ${t.description} ${t.module} ${t.category}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (assignee === 'All members' || t.assignee === assignee) &&
        (category === 'All categories' || t.category === category) &&
        (status === 'All statuses' || t.status === status),
    )
    .sort((a, b) =>
      sort === 'priority'
        ? priorities.indexOf(b.priority as (typeof priorities)[number]) -
          priorities.indexOf(a.priority as (typeof priorities)[number])
        : (a.due_date || '9999').localeCompare(b.due_date || '9999'),
    );
  const changeView = (value: string) => {
    setView(value);
    try {
      localStorage.setItem('nesco-task-view', value);
    } catch {}
  };
  async function updateStatus(task: WorkspaceRecord, next: string) {
    if (task.status === next) return;
    try {
      await save('tasks', { ...task, status: next }, task);
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  const filterCount =
    Number(assignee !== 'All members') +
    Number(category !== 'All categories') +
    Number(status !== 'All statuses');
  return (
    <>
      <PageHeading
        eyebrow="SMALL STEPS. REAL PROGRESS."
        title="Make room for good work."
        description="From the first idea to the final deploy. Keep every next step in sight."
        actions={
          <Button
            disabled={user.role === 'viewer'}
            onClick={() => setEditor({ resource: 'tasks' })}
          >
            <Plus size={17} />
            Create task
          </Button>
        }
      />
      <div className="page-summary-row">
        <div>
          <span className="summary-dot" />
          <strong>{data.tasks.length} tasks</strong>
          <span>in your workspace</span>
        </div>
        <div className="member-stack">
          {members.slice(0, 4).map((m) => (
            <Avatar name={m} key={m} small />
          ))}
          <span>{members.length} assigned members</span>
        </div>
      </div>
      <div className="toolbar">
        <div className="view-switch" aria-label="Task view">
          <button
            aria-pressed={view === 'board'}
            className={view === 'board' ? 'selected' : ''}
            onClick={() => changeView('board')}
          >
            <LayoutGrid size={16} />
            Board
          </button>
          <button
            aria-pressed={view === 'list'}
            className={view === 'list' ? 'selected' : ''}
            onClick={() => changeView('list')}
          >
            <List size={16} />
            List
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
        <div className="toolbar-spacer" />
        <select
          className="compact-select"
          aria-label="Sort tasks"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="deadline">Sort: due date</option>
          <option value="priority">Sort: priority</option>
        </select>
        <Button variant="outline" onClick={() => setFilters(!filters)} aria-expanded={filters}>
          <SlidersHorizontal size={15} />
          Filters{filterCount > 0 && <Badge tone="green">{filterCount}</Badge>}
        </Button>
      </div>
      {filters && (
        <div className="filter-bar">
          <label>
            Assignee
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {['All members', ...members].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['All categories', ...categories].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {['All statuses', ...taskStatuses].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {filterCount > 0 && (
            <button
              className="text-link"
              onClick={() => {
                setAssignee('All members');
                setCategory('All categories');
                setStatus('All statuses');
              }}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      )}
      {view === 'board' ? (
        <>
          <p className="board-hint">
            <GripVertical size={13} />
            Drag cards between columns, or use a card’s status menu.
          </p>
          <div className="kanban-board">
            {taskStatuses.map((column, i) => (
              <section
                key={column}
                className={cn('kanban-column', dragOver === column && 'kanban-drop-active')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOver(column);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const task = data.tasks.find(
                    (t) => t.id === e.dataTransfer.getData('text/plain'),
                  );
                  if (task) void updateStatus(task, column);
                }}
              >
                <div className="kanban-header">
                  <span className={`status-dot status-dot-${i}`} />
                  <h2>{column}</h2>
                  <span>{tasks.filter((t) => t.status === column).length}</span>
                  <button
                    className="icon-button"
                    aria-label={`Add ${column} task`}
                    onClick={() => setEditor({ resource: 'tasks', defaults: { status: column } })}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="kanban-cards">
                  {tasks
                    .filter((t) => t.status === column)
                    .map((task) => {
                      const subtasks = parseList<Subtask>(task.subtasks_json);
                      return (
                        <article
                          className="task-card"
                          data-task-category={task.category}
                          draggable={memberCanEdit(user, task, 'tasks')}
                          key={task.id}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDragOver(null)}
                        >
                          <div className="task-card-top">
                            <span className="technical-id">NSC-{task.id.slice(-3)}</span>
                            <Priority value={task.priority} />
                          </div>
                          <div className="task-card-category">
                            <TaskCategory category={task.category} />
                          </div>
                          <button
                            className="task-card-title"
                            onClick={() => setEditor({ resource: 'tasks', record: task })}
                          >
                            {task.title}
                          </button>
                          <p>{task.description}</p>
                          {task.module && (
                            <div className="task-card-module">
                              <Layers3 size={12} aria-hidden="true" />
                              <span className="sr-only">Module: </span>
                              <span>{task.module}</span>
                            </div>
                          )}
                          <div className="task-card-meta">
                            <span className={overdue(task) ? 'date-overdue' : ''}>
                              <CalendarDays size={13} />
                              {displayDate(task.due_date)}
                            </span>
                            {subtasks.length > 0 && (
                              <span>
                                <CheckSquare size={13} />
                                {subtasks.filter((s) => s.done).length}/{subtasks.length}
                              </span>
                            )}
                            <Avatar name={task.assignee} small />
                          </div>
                          <select
                            className="card-status-select"
                            aria-label={`Change status for ${task.title}`}
                            value={task.status}
                            disabled={!memberCanEdit(user, task, 'tasks')}
                            onChange={(e) => void updateStatus(task, e.target.value)}
                          >
                            {taskStatuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </article>
                      );
                    })}
                  <button
                    className="kanban-add"
                    onClick={() => setEditor({ resource: 'tasks', defaults: { status: column } })}
                  >
                    <Plus size={15} />
                    Add task
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="task-table full-task-table">
              <thead>
                <tr>
                  <th>Task name</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due date</th>
                  <th>Category</th>
                  <th>
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button
                        className="table-task-title"
                        onClick={() => setEditor({ resource: 'tasks', record: t })}
                      >
                        <CheckSquare size={16} />
                        <span>
                          <strong>{t.title}</strong>
                          <small className="technical-id">
                            NSC-{t.id.slice(-3)} · {t.module || 'General'}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <select
                        className="inline-status-select"
                        aria-label={`Status for ${t.title}`}
                        value={t.status}
                        disabled={!memberCanEdit(user, t, 'tasks')}
                        onChange={(e) => void updateStatus(t, e.target.value)}
                      >
                        {taskStatuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Priority value={t.priority} />
                    </td>
                    <td>
                      <span className="assignee-cell">
                        <Avatar name={t.assignee} small />
                        {t.assignee || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={overdue(t) ? 'date-overdue' : ''}>
                        {displayDate(t.due_date)}
                      </span>
                    </td>
                    <td>
                      <TaskCategory category={t.category} />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${t.title}`}
                        onClick={() => setEditor({ resource: 'tasks', record: t })}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              {tasks.length} of {data.tasks.length} tasks
            </span>
            <span>All changes sync to your workspace</span>
          </div>
        </section>
      )}
      {!tasks.length && (
        <EmptyState
          title="A clean slate"
          description={
            search || filterCount
              ? 'Try a different search or clear your filters.'
              : 'Your next big thing starts with one small task.'
          }
          action={
            <Button
              disabled={user.role === 'viewer'}
              onClick={() => setEditor({ resource: 'tasks' })}
            >
              <Plus size={16} />
              Create a task
            </Button>
          }
        />
      )}
    </>
  );
}
