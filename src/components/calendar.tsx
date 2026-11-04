'use client';
import { useEffect, useState } from 'react';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Radio,
  Copy,
  Download,
  ArrowUpRight,
  Clock3,
  MapPin,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from './providers';
import { Badge, EmptyState, PageHeading, SearchInput } from './shared';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn, jakartaDate } from '@/lib/utils';
import { eventCategories } from '@/lib/schema';
const eventTone = (category: string) =>
  category === 'Committee Meeting'
    ? 'green'
    : category === 'Design Review'
      ? 'purple'
      : category === 'Development Sprint'
        ? 'blue'
        : category === 'Internal Deadline'
          ? 'red'
          : 'amber';
const time = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  });
export function Calendar() {
  const { data, setEditor, demo, notify } = useWorkspace();
  const [date, setDate] = useState(() => new Date(`${jakartaDate()}T12:00:00`));
  const [view, setView] = useState('Month');
  const [subscribe, setSubscribe] = useState(false);
  const [category, setCategory] = useState('All event types');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  useEffect(() => {
    setSearch(new URLSearchParams(window.location.search).get('search') || '');
    setFeedUrl(`${window.location.origin}/api/calendar.ics`);
  }, []);
  const events = data.events
    .filter(
      (e) =>
        (category === 'All event types' || e.category === category) &&
        `${e.title} ${e.description}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  const days = eachDayOfInterval(
    view === 'Week'
      ? { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
      : {
          start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
        },
  );
  const datesFor = (day: Date) =>
    events.filter((e) => {
      const d = format(day, 'yyyy-MM-dd');
      return (
        jakartaDate(new Date(e.start_datetime)) <= d &&
        jakartaDate(new Date(new Date(e.end_datetime).getTime() - 1)) >= d
      );
    });
  const add = (day: Date) => {
    const selected = format(day, 'yyyy-MM-dd');
    setEditor({
      resource: 'events',
      defaults: {
        start_datetime: `${selected}T19:00:00+07:00`,
        end_datetime: `${selected}T20:00:00+07:00`,
      },
    });
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify('Could not copy automatically. Select and copy the calendar URL below.', true);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A SHARED RHYTHM"
        title="Make time for what’s next."
        description="Meetings, milestones, and meaningful moments. All in one place."
        actions={
          <>
            <Button variant="outline" onClick={() => setSubscribe(true)}>
              <Radio size={16} />
              Subscribe to calendar
            </Button>
            <Button onClick={() => setEditor({ resource: 'events' })}>
              <Plus size={17} />
              Create event
            </Button>
          </>
        }
      />
      <div className="calendar-info">
        <span className="calendar-info-icon">
          <CalendarDays size={20} />
        </span>
        <div>
          <strong>Your committee, in sync.</strong>
          <p>
            Keep this calendar with you. Subscribe once to get future updates in your own calendar.
          </p>
        </div>
        <button className="text-link" onClick={() => setSubscribe(true)}>
          How it works <ArrowUpRight size={15} />
        </button>
      </div>
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-title">
            <h2>{format(date, 'MMMM yyyy')}</h2>
            <button
              className="icon-button"
              aria-label="Previous period"
              onClick={() => setDate(view === 'Week' ? addWeeks(date, -1) : addMonths(date, -1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Next period"
              onClick={() => setDate(view === 'Week' ? addWeeks(date, 1) : addMonths(date, 1))}
            >
              <ChevronRight size={18} />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date(`${jakartaDate()}T12:00:00`))}
            >
              Today
            </Button>
          </div>
          <span className="calendar-timezone">Asia/Jakarta · UTC+7</span>
          <div className="view-switch">
            {['Month', 'Week', 'Agenda'].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                className={view === v ? 'selected' : ''}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-filter-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search events…" />
          <select
            className="compact-select"
            aria-label="Filter event type"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {['All event types', ...eventCategories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {view === 'Month' ? (
          <div className="calendar-scroll">
            <div className="calendar-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {days.map((day) => {
                const dayEvents = datesFor(day);
                const today = format(day, 'yyyy-MM-dd') === jakartaDate();
                return (
                  <div
                    className={cn(
                      'calendar-cell',
                      !isSameMonth(day, date) && 'calendar-other-month',
                      today && 'calendar-today',
                    )}
                    key={day.toISOString()}
                  >
                    <div className="calendar-cell-top">
                      <span className={today ? 'today-number' : ''}>{format(day, 'd')}</span>
                      <button
                        className="calendar-add"
                        aria-label={`Create event on ${format(day, 'MMMM d')}`}
                        onClick={() => add(day)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="day-events">
                      {dayEvents.map((e) => (
                        <button
                          key={e.id}
                          className={`calendar-event calendar-event-${eventTone(e.category)}`}
                          onClick={() => setEditor({ resource: 'events', record: e })}
                        >
                          <i />
                          <span>{time(e.start_datetime)}</span>
                          <strong>{e.title}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'Week' ? (
          <div className="calendar-scroll">
            <div className="calendar-week-view">
              {days.map((day) => (
                <div className="calendar-week-column" key={day.toISOString()}>
                  <div
                    className={cn(
                      'week-column-date',
                      format(day, 'yyyy-MM-dd') === jakartaDate() && 'week-today',
                    )}
                  >
                    <span>{format(day, 'EEE')}</span>
                    <strong>{format(day, 'd')}</strong>
                  </div>
                  {datesFor(day).map((e) => (
                    <button
                      key={e.id}
                      className={`week-event calendar-event-${eventTone(e.category)}`}
                      onClick={() => setEditor({ resource: 'events', record: e })}
                    >
                      <span>
                        {time(e.start_datetime)} – {time(e.end_datetime)}
                      </span>
                      <strong>{e.title}</strong>
                      <small>{e.category}</small>
                    </button>
                  ))}
                  <button className="kanban-add" onClick={() => add(day)}>
                    <Plus size={14} />
                    Add event
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="agenda-list">
            {events
              .filter((e) => isSameMonth(new Date(e.start_datetime), date))
              .map((e) => (
                <button
                  key={e.id}
                  className="agenda-event"
                  onClick={() => setEditor({ resource: 'events', record: e })}
                >
                  <div className="agenda-date">
                    <span>{format(new Date(e.start_datetime), 'EEE')}</span>
                    <strong>{format(new Date(e.start_datetime), 'dd')}</strong>
                  </div>
                  <div>
                    <Badge tone={eventTone(e.category)}>{e.category}</Badge>
                    <h3>{e.title}</h3>
                    <p>
                      <Clock3 size={13} />
                      {time(e.start_datetime)} – {time(e.end_datetime)} WIB <MapPin size={13} />
                      {e.location || 'Location to be confirmed'}
                    </p>
                  </div>
                  <Badge>{e.visibility}</Badge>
                  <ChevronRight size={17} />
                </button>
              ))}
            {!events.some((e) => isSameMonth(new Date(e.start_datetime), date)) && (
              <EmptyState
                title="A little room on the calendar"
                description="No events this month. Make space for your next milestone."
                action={
                  <Button onClick={() => setEditor({ resource: 'events' })}>
                    <Plus size={16} />
                    Create event
                  </Button>
                }
              />
            )}
          </div>
        )}
        <div className="calendar-legend">
          <span>
            <i className="legend-green" />
            Meeting
          </span>
          <span>
            <i className="legend-purple" />
            Design review
          </span>
          <span>
            <i className="legend-blue" />
            Sprint
          </span>
          <span>
            <i className="legend-red" />
            Deadline
          </span>
          <span>
            <i className="legend-amber" />
            Other
          </span>
        </div>
      </section>
      <Dialog open={subscribe} onOpenChange={setSubscribe}>
        <DialogContent>
          <span className="modal-feature-icon">
            <Radio size={24} />
          </span>
          <DialogTitle>Your calendar. Always in the loop.</DialogTitle>
          <DialogDescription>
            Subscribe to public NESCO events. Changes appear when your calendar provider refreshes
            the feed.
          </DialogDescription>
          <div className="subscribe-content">
            {demo && (
              <div className="inline-notice">
                The official feed becomes available after Google Sheets is connected. Sample events
                are never published.
              </div>
            )}
            <label className="field">
              <span className="field-label">Calendar subscription URL</span>
              <div className="copy-input">
                <input value={feedUrl} readOnly aria-label="Calendar URL" />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={copy}
                  aria-label="Copy calendar URL"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </label>
            <div className="subscribe-actions">
              <Button asChild={!demo} disabled={demo}>
                {demo ? (
                  <span>Subscribe in Apple Calendar</span>
                ) : (
                  <a href={feedUrl.replace(/^https?:/, 'webcal:')}>
                    <CalendarDays size={16} />
                    Subscribe in Apple Calendar
                  </a>
                )}
              </Button>
              <Button variant="outline" asChild={!demo} disabled={demo}>
                {demo ? (
                  <span>Download .ics</span>
                ) : (
                  <a href={`${feedUrl}?download=1`} download="nesco-2027.ics">
                    <Download size={16} />
                    Download .ics
                  </a>
                )}
              </Button>
            </div>
            <h3>Google Calendar</h3>
            <ol>
              <li>Open Google Calendar on desktop.</li>
              <li>
                Choose <strong>Other calendars → + → From URL</strong>.
              </li>
              <li>
                Paste the subscription URL above and select <strong>Add calendar</strong>.
              </li>
            </ol>
            <h3>Apple Calendar</h3>
            <p>
              Choose <strong>File → New Calendar Subscription</strong>, paste the URL, and choose an
              automatic refresh interval.
            </p>
            <div className="inline-notice">
              A downloaded .ics file is a one-time snapshot. Subscribe by URL to receive future
              updates. Only events marked Public are included.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
