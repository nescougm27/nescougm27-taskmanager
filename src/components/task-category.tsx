import { Code2, Figma, Layers3, Rocket, ShieldCheck } from 'lucide-react';

const categoryIcons = {
  'UI/UX Design': Figma,
  'Frontend Development': Code2,
  'Backend Development': Code2,
  'Testing & QA': ShieldCheck,
  Deployment: Rocket,
};

export function TaskCategory({ category }: { category: string }) {
  const Icon = categoryIcons[category as keyof typeof categoryIcons] || Layers3;

  return (
    <span
      className="task-category"
      data-task-category={category}
      aria-label={`Task category: ${category || 'Uncategorized'}`}
    >
      <Icon size={14} aria-hidden="true" />
      <span>{category || 'Uncategorized'}</span>
    </span>
  );
}
