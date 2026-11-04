import { z } from 'zod';

export const taskStatuses = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'] as const;
export const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const categories = [
  'UI/UX Design',
  'Frontend Development',
  'Backend Development',
  'Testing & QA',
  'Deployment',
] as const;
export const eventCategories = [
  'Committee Meeting',
  'Development Sprint',
  'Design Review',
  'Internal Deadline',
  'Website Testing',
  'Deployment',
  'General Activity',
] as const;
export const feedbackTypes = ['evaluation', 'feature_request', 'page_request'] as const;
export const requestStatuses = [
  'Submitted',
  'Under Review',
  'Approved',
  'Planned',
  'In Development',
  'Completed',
  'Rejected',
] as const;
const text = z.string().trim().max(10000).default('');
const required = z.string().trim().min(2, 'Please enter at least 2 characters.').max(200);
const url = z
  .union([
    z.literal(''),
    z.url().refine((v) => /^https?:\/\//.test(v), 'Use an http or https URL.'),
  ])
  .default('');
const date = z.union([z.literal(''), z.iso.date()]).default('');
const datetime = z.iso.datetime({ offset: true });
const json = <T extends z.ZodType>(item: T) =>
  z
    .string()
    .default('[]')
    .refine((v) => {
      try {
        return z.array(item).safeParse(JSON.parse(v)).success;
      } catch {
        return false;
      }
    }, 'Invalid structured data.');
export const subtaskSchema = z.object({ id: z.uuid(), title: required, done: z.boolean() });
const strings = json(z.string().max(2000));
const rating = z.union([z.literal(''), z.enum(['1', '2', '3', '4', '5'])]).default('');
export const taskSchema = z
  .object({
    title: required,
    description: text,
    category: z.enum(categories),
    assignee: text,
    priority: z.enum(priorities),
    status: z.enum(taskStatuses),
    start_date: date,
    due_date: date,
    module: text,
    subtasks_json: json(subtaskSchema),
    notes: text,
    reference_url: url,
  })
  .refine((v) => !v.start_date || !v.due_date || v.due_date >= v.start_date, {
    message: 'Due date must be on or after the start date.',
    path: ['due_date'],
  });
export const eventSchema = z
  .object({
    title: required,
    description: text,
    start_datetime: datetime,
    end_datetime: datetime,
    category: z.enum(eventCategories),
    location: text,
    responsible: text,
    visibility: z.enum(['Public', 'Internal']),
  })
  .refine((v) => new Date(v.end_datetime) > new Date(v.start_datetime), {
    message: 'End time must be after start time.',
    path: ['end_datetime'],
  });
export const activitySchema = z.object({
  title: required,
  type: z.enum(eventCategories),
  date: z.iso.date(),
  description: text,
  related_tasks_json: json(z.uuid()),
  responsible: text,
  notes: text,
  decisions: text,
  follow_ups_json: strings,
  references_json: json(z.url().refine((v) => /^https?:\/\//.test(v))),
});
export const feedbackSchema = z
  .object({
    type: z.enum(feedbackTypes),
    submitter: required,
    division: required,
    title: z.string().trim().max(200).default(''),
    module: text,
    slug: z.string().max(200).default(''),
    description: z.string().trim().min(2, 'Please describe your feedback.').max(10000),
    problem: text,
    expected_behavior: text,
    priority: z.enum(priorities).default('Medium'),
    rating_design: rating,
    rating_ux: rating,
    rating_responsiveness: rating,
    rating_performance: rating,
    rating_functionality: rating,
    rating_reliability: rating,
    strengths: text,
    weaknesses: text,
    recommendations: text,
    reference_url: url,
    extra_json: z
      .string()
      .max(30000)
      .default('{}')
      .refine((v) => {
        try {
          const o = JSON.parse(v);
          return o && typeof o === 'object' && !Array.isArray(o);
        } catch {
          return false;
        }
      }, 'Invalid extra fields.'),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'evaluation') {
      for (const field of [
        'rating_design',
        'rating_ux',
        'rating_responsiveness',
        'rating_performance',
        'rating_functionality',
        'rating_reliability',
      ] as const)
        if (!v[field])
          ctx.addIssue({ code: 'custom', path: [field], message: 'Choose a rating from 1 to 5.' });
    } else if (v.title.length < 2)
      ctx.addIssue({ code: 'custom', path: ['title'], message: 'Please enter a request title.' });
    if (v.type === 'feature_request' && !v.problem.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['problem'],
        message: 'Describe the problem to solve.',
      });
    if (v.type === 'page_request' && !/^\/[a-z0-9/-]+$/.test(v.slug))
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'Use a slug such as /competitions.',
      });
  });
export const wwcStatuses = ['Belum diwawancarai', 'Sudah diwawancarai'] as const;
export const wwcAnswerSchema = z.object({
  question_id: z.uuid(),
  question: z.string().trim().min(2).max(2000),
  response: z.string().trim().max(5000),
});
export type WwcAnswer = z.infer<typeof wwcAnswerSchema>;
export const wwcParticipantSchema = z.object({
  title: required,
  email: z.union([z.literal(''), z.email()]).default(''),
  division: z.string().trim().max(200).default(''),
  responsible: z.email(),
  status: z.enum(wwcStatuses),
  notes: text,
  answers_json: json(wwcAnswerSchema).refine((value) => {
    try {
      const answers = z.array(wwcAnswerSchema).parse(JSON.parse(value));
      return new Set(answers.map((answer) => answer.question_id)).size === answers.length;
    } catch {
      return false;
    }
  }, 'Setiap pertanyaan hanya boleh memiliki satu jawaban.'),
});
export const wwcQuestionSchema = z.object({
  title: z.string().trim().min(2, 'Tuliskan pertanyaan minimal 2 karakter.').max(2000),
  category: z.string().trim().min(2).max(100),
  responsible: z.email(),
});
export const schemas = {
  tasks: taskSchema,
  events: eventSchema,
  activities: activitySchema,
  feedback: feedbackSchema,
  'wwc-participants': wwcParticipantSchema,
  'wwc-questions': wwcQuestionSchema,
};
export type Resource = keyof typeof schemas;
export type WorkspaceRecord = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  [key: string]: string;
};
export type WorkspaceData = Record<Resource, WorkspaceRecord[]>;
export const roles = ['admin', 'member', 'viewer'] as const;
export const memberSchema = z.object({
  name: required,
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(roles),
  status: z.enum(['active', 'suspended']),
});
export type MemberRecord = z.infer<typeof memberSchema> & {
  id: string;
  joined_at: string;
  version: string;
};
export type SessionUser = {
  id?: string;
  email: string;
  name: string;
  image?: string;
  role: (typeof roles)[number];
};
export type Subtask = z.infer<typeof subtaskSchema>;
export const sheets = {
  tasks: 'Tasks',
  events: 'Events',
  activities: 'Activities',
  feedback: 'Feedback',
  members: 'Members',
  'wwc-participants': 'WWCParticipants',
  'wwc-questions': 'WWCQuestions',
} as const;
export const sheetHeaders: Record<Resource | 'members', string[]> = {
  'wwc-participants':
    'id,title,email,division,responsible,status,notes,answers_json,created_at,updated_at'.split(
      ',',
    ),
  'wwc-questions': 'id,title,category,responsible,created_at,updated_at'.split(','),
  members: 'id,name,email,role,status,joined_at'.split(','),
  tasks:
    'id,title,description,category,assignee,priority,status,start_date,due_date,module,subtasks_json,notes,reference_url,created_at,updated_at'.split(
      ',',
    ),
  events:
    'id,title,description,start_datetime,end_datetime,category,location,responsible,visibility,created_at,updated_at'.split(
      ',',
    ),
  activities:
    'id,title,type,date,description,related_tasks_json,responsible,notes,decisions,follow_ups_json,references_json,created_at,updated_at'.split(
      ',',
    ),
  feedback:
    'id,type,submitter,division,title,module,slug,description,problem,expected_behavior,priority,status,rating_design,rating_ux,rating_responsiveness,rating_performance,rating_functionality,rating_reliability,strengths,weaknesses,recommendations,reference_url,extra_json,created_at,updated_at'.split(
      ',',
    ),
};
export function parseList<T = string>(value: string | undefined): T[] {
  try {
    const data = JSON.parse(value || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
