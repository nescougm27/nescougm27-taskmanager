'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  SquareCheckBig,
  CalendarDays,
  Activity,
  MessageSquareText,
  UsersRound,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Plus,
  PanelLeftClose,
  Menu,
  X,
  Sun,
  Moon,
  ArrowUpRight,
  HelpCircle,
  LogOut,
  Leaf,
  Command,
  RefreshCw,
  Settings2,
  LockKeyhole,
} from 'lucide-react';
import { useWorkspace } from './providers';
import { Avatar, Badge, EmptyState, LoadingSkeleton, SearchInput } from './shared';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { logout } from '@/app/actions/auth';
import { MemberManager } from './members';
import { RecordEditor } from './record-editor';
import { cn, displayDate } from '@/lib/utils';
const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Task Manager', icon: SquareCheckBig },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/wwc', label: 'Wawancara (WWC)', icon: UsersRound },
  { href: '/feedback', label: 'Feedback Center', icon: MessageSquareText },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data, demo, user, loading, error, refresh, setEditor, notify } = useWorkspace();
  const [membersOpen, setMembersOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState('light');
  const [command, setCommand] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [profile, setProfile] = useState(false);
  const [quick, setQuick] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = nav.find((n) => n.href === path) || nav[0];
  useEffect(() => {
    try {
      setTheme(localStorage.getItem('nesco-theme') || 'light');
    } catch {}
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommand((v) => !v);
      }
      if (e.key === 'Escape') {
        setQuick(false);
        setProfile(false);
        setMobile(false);
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    setMobile(false);
    setQuick(false);
    setProfile(false);
  }, [path]);
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('nesco-theme', next);
    } catch {}
  }
  const searchResults = [
    ...data.tasks.map((r) => ({ ...r, description: r.description, href: '/tasks', kind: 'Task' })),
    ...data.events.map((r) => ({
      ...r,
      description: r.description,
      href: '/calendar',
      kind: 'Event',
    })),
    ...data.activities.map((r) => ({
      ...r,
      description: r.description,
      href: '/activities',
      kind: 'Activity',
    })),
    ...data.feedback.map((r) => ({
      ...r,
      description: r.description,
      href: '/feedback',
      kind: 'Feedback',
    })),
  ]
    .filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <div className={cn('workspace', collapsed && 'sidebar-collapsed')}>
      {mobile && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="workspace-navigation" className={cn('sidebar', mobile && 'sidebar-open')}>
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <Leaf size={25} strokeWidth={1.7} />
          </span>
          <span className="brand-name">
            nesco<span className="brand-year">2027</span>
          </span>
          <span className="brand-mark">®</span>
        </Link>
        <div className="workspace-selector">
          <span className="workspace-letter">
            W<span>↗</span>
          </span>
          <div>
            <strong>Web Development</strong>
            <span>Committee workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'nav-item',
                (path === n.href || (path === '/' && n.href === '/dashboard')) && 'nav-active',
              )}
              aria-current={
                path === n.href || (path === '/' && n.href === '/dashboard') ? 'page' : undefined
              }
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.href === '/tasks' && (
                <span className="nav-count">
                  {data.tasks.filter((t) => t.status !== 'Done').length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-tag">
              <span />
              BUILDING NESCO 2027
            </span>
            <h3>
              A little progress,
              <br />
              every single day.
            </h3>
            <p>
              Great experiences start
              <br />
              with a great team.
            </p>
            <div className="leaf-art" aria-hidden="true">
              <Leaf size={74} strokeWidth={0.7} />
            </div>
            <Link href="/tasks">
              Let’s build something <ArrowUpRight size={14} />
            </Link>
          </div>
          <button className="nav-item sidebar-help" onClick={() => setHelp(true)}>
            <HelpCircle size={18} />
            <span>Help & resources</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-profile">
            {user.image ? (
              <img
                className="avatar"
                src={user.image}
                alt={user.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Avatar name={user.name} />
            )}
            <div>
              <strong>{user.name}</strong>
              <span>{demo ? 'Demo administrator' : user.role}</span>
            </div>
            {user.role === 'admin' && (
              <button aria-label="Manage members" onClick={() => setMembersOpen(true)}>
                <Settings2 size={16} />
              </button>
            )}
          </div>
          <div className="sidebar-footer">
            <span>
              <i />{' '}
              {demo
                ? 'Demo environment'
                : error
                  ? 'Connection needs attention'
                  : loading
                    ? 'Connecting workspace'
                    : 'Workspace connected'}
            </span>
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title="Toggle sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            {collapsed && (
              <button
                className="desktop-expand"
                onClick={() => setCollapsed(false)}
                aria-label="Expand navigation"
              >
                <Menu size={20} />
              </button>
            )}
            <span>NESCO 2027</span>
            <ChevronRight size={13} />
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="command-trigger"
              aria-label="Search workspace"
              onClick={() => setCommand(true)}
            >
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button theme-button"
              onClick={toggleTheme}
              title="Toggle color theme"
              aria-label="Toggle color theme"
            >
              {theme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button notification-button"
              onClick={() => setNotifications(true)}
              aria-label="View upcoming events"
            >
              <Bell size={19} />
              {data.events.length > 0 && <i />}
            </button>
            <span className="topbar-divider" />
            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() => setProfile(!profile)}
                aria-label="Open account menu"
                aria-expanded={profile}
              >
                <Avatar name={user.name} />
                <ChevronDown size={13} />
              </button>
              {profile && (
                <div className="dropdown profile-dropdown">
                  <strong>{user.name}</strong>
                  <small>{demo ? 'Sample account' : user.email}</small>
                  <Badge tone="green">{demo ? 'Demo workspace' : user.role}</Badge>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setMembersOpen(true);
                        setProfile(false);
                      }}
                    >
                      <Settings2 size={16} />
                      Manage members
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (demo) {
                        setHelp(true);
                        setProfile(false);
                        return;
                      }
                      await logout();
                    }}
                  >
                    <LogOut size={16} />
                    {demo ? 'Connect workspace' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-container" id="main-content">
          {user.role === 'viewer' && (
            <div className="inline-notice read-only-notice">
              <LockKeyhole size={14} />
              You have read-only access. Contact an administrator to request changes.
            </div>
          )}
          {demo && (
            <div className="demo-banner">
              <span>
                <span className="demo-dot" />
                Demo workspace{' '}
                <span className="demo-banner-detail">
                  · Sample data. Changes last for this session.
                </span>
              </span>
              <button onClick={() => setHelp(true)}>
                Connect Google Sheets <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw size={14} />
                Retry
              </Button>
            </div>
          )}
          {loading ? <LoadingSkeleton /> : children}
          <footer className="page-footer">
            <span>Made for the people building NESCO.</span>
            <span>
              <span className="footer-dot" /> NESCO 2027 <span className="footer-separator">/</span>{' '}
              Web Development
            </span>
          </footer>
        </main>
      </div>
      <Dialog open={command} onOpenChange={setCommand}>
        <DialogContent className="command-dialog">
          <DialogTitle>Find your next step</DialogTitle>
          <DialogDescription>Search tasks, events, activities, and feedback.</DialogDescription>
          <div className="search-input command-search">
            <Search size={19} />
            <input
              ref={searchRef}
              aria-label="Search workspace"
              placeholder="Search the workspace…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>esc</kbd>
          </div>
          <div className="command-results">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setCommand(false);
                  router.push(`${r.href}?search=${encodeURIComponent(r.title)}`);
                }}
              >
                <span>
                  <small>{r.kind}</small>
                  <strong>{r.title}</strong>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))}
            {!searchResults.length && (
              <EmptyState title="No results found" description="Try another title or keyword." />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogTitle>Coming up next</DialogTitle>
          <DialogDescription>Your committee’s upcoming calendar events.</DialogDescription>
          <div className="notifications-list">
            {data.events
              .filter((e) => new Date(e.end_datetime) >= new Date())
              .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setNotifications(false);
                    setEditor({ resource: 'events', record: e });
                  }}
                >
                  <CalendarDays size={20} />
                  <span>
                    <strong>{e.title}</strong>
                    <small>
                      {displayDate(e.start_datetime, 'EEE, MMM d')} ·{' '}
                      {new Date(e.start_datetime).toLocaleTimeString('en-GB', {
                        timeZone: 'Asia/Jakarta',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
          </div>
          {!data.events.some((e) => new Date(e.end_datetime) >= new Date()) && (
            <EmptyState
              title="You’re all caught up"
              description="No upcoming events. Add your next committee meeting to the calendar."
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogTitle>A shared place to build.</DialogTitle>
          <DialogDescription>Workspace setup & everyday essentials</DialogDescription>
          <div className="help-content">
            <div className="help-icon">
              <Leaf size={30} />
            </div>
            <p>
              Organize tasks, plan your calendar, document decisions, and shape NESCO 2027 together.
            </p>
            <h3>Connect the committee workspace</h3>
            <ol>
              <li>Create a Google Cloud project and enable the Google Sheets API.</li>
              <li>Share your spreadsheet with the service account email as an Editor.</li>
              <li>
                Set the server environment variables using <code>.env.example</code>.
              </li>
              <li>
                Run <code>pnpm sheets:init</code> to create the four worksheets.
              </li>
              <li>
                Configure Google OAuth and add active committee accounts to the Members worksheet.
              </li>
            </ol>
            <p>
              Full setup and Vercel deployment instructions are in <code>README.md</code>. No
              credentials belong in the browser.
            </p>
            <div className="help-tip">
              <Command size={16} /> Press Ctrl/⌘ + K to search your workspace.
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <MemberManager open={membersOpen} onOpenChange={setMembersOpen} />
      <RecordEditor />
    </div>
  );
}
