'use client';
import { Inbox, Search, ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn, initials } from '@/lib/utils';
import { Button } from './ui/button';
export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: React.ReactNode;
  tone?: string;
  dot?: boolean;
}) {
  return (
    <span className={cn('badge', `badge-${tone}`)}>
      {dot && <i />}
      {children}
    </span>
  );
}
export function Priority({ value }: { value: string }) {
  return (
    <Badge
      tone={
        value === 'Urgent'
          ? 'red'
          : value === 'High'
            ? 'amber'
            : value === 'Medium'
              ? 'blue'
              : 'neutral'
      }
    >
      <span className="priority-bars" aria-hidden="true">
        {value === 'Urgent' ? '▰' : value === 'High' ? '▥' : value === 'Medium' ? '▤' : '▱'}
      </span>
      {value}
    </Badge>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      dot
      tone={
        value === 'Done' || value === 'Completed' || value === 'Approved'
          ? 'green'
          : value === 'In Progress' || value === 'In Development'
            ? 'blue'
            : value === 'In Review' || value === 'Under Review'
              ? 'amber'
              : value === 'Rejected'
                ? 'red'
                : 'neutral'
      }
    >
      {value}
    </Badge>
  );
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const color = (name.charCodeAt(name.length - 1) || 0) % 4;
  return (
    <span
      className={`avatar avatar-${color} ${small ? 'avatar-sm' : ''}`}
      title={name || 'Unassigned'}
    >
      {initials(name)}
    </span>
  );
}
export function EmptyState({
  title = 'Nothing here yet',
  description = 'Add your first item to get started.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Inbox size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function SectionHeading({
  title,
  subtitle,
  href,
  action,
  label = 'View all',
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href ? (
        <Link className="text-link" href={href}>
          {label}
          <ArrowUpRight size={15} />
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = 'green',
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{caption}</p>
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="loading-grid" aria-label="Loading workspace" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Confirmation({
  title,
  description,
  onConfirm,
  onCancel,
  pending = false,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div className="confirmation">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="form-actions">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" disabled={pending} onClick={onConfirm}>
          {pending ? 'Deleting…' : 'Delete permanently'}
        </Button>
      </div>
    </div>
  );
}
