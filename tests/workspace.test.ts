import test from 'node:test';
import assert from 'node:assert/strict';
import {
  eventSchema,
  feedbackSchema,
  memberSchema,
  taskSchema,
  wwcParticipantSchema,
  wwcQuestionSchema,
  type MemberRecord,
  type SessionUser,
} from '../src/lib/schema';
import { memberCanEdit, findActiveMembership, verifiedGoogleEmail } from '../src/lib/permissions';
import { createDemoData } from '../src/lib/demo';
import { escapeICS, foldLine, generateICS } from '../src/lib/ics';
import { jakartaDate, overdue } from '../src/lib/utils';
import { interviewAnswers, starterQuestions } from '../src/lib/wwc';
const data = createDemoData();
const member: SessionUser = { email: 'member@example.com', name: 'Test Member', role: 'member' };
const entry: MemberRecord = {
  id: crypto.randomUUID(),
  name: 'Test Member',
  email: member.email,
  role: 'member',
  status: 'active',
  joined_at: new Date().toISOString(),
  version: 'test',
};
test('WWC validates candidate identity, statuses, answers, and editable questions', () => {
  const candidate = {
    title: 'Calon Peserta',
    responsible: member.email,
    status: 'Belum diwawancarai',
  };
  assert.equal(wwcParticipantSchema.safeParse(candidate).success, true);
  for (const change of [
    { title: ' ' },
    { email: 'not-an-email' },
    { status: 'Unknown' },
    { responsible: '' },
    { answers_json: 'invalid JSON' },
    { answers_json: '{}' },
    { answers_json: '[{}]' },
  ])
    assert.equal(wwcParticipantSchema.safeParse({ ...candidate, ...change }).success, false);
  const answer = {
    question_id: crypto.randomUUID(),
    question: 'Apa motivasimu?',
    response: 'Ingin berkontribusi.',
  };
  assert.equal(
    wwcParticipantSchema.safeParse({ ...candidate, answers_json: JSON.stringify([answer]) })
      .success,
    true,
  );
  assert.equal(
    wwcParticipantSchema.safeParse({ ...candidate, answers_json: JSON.stringify([answer, answer]) })
      .success,
    false,
  );
  assert.equal(
    wwcParticipantSchema.safeParse({
      ...candidate,
      answers_json: JSON.stringify([{ ...answer, response: 'a'.repeat(5001) }]),
    }).success,
    false,
  );
  for (const question of starterQuestions)
    assert.equal(
      wwcQuestionSchema.safeParse({ ...question, responsible: member.email }).success,
      true,
    );
  assert.equal(
    wwcQuestionSchema.safeParse({ title: ' ', category: 'Umum', responsible: member.email })
      .success,
    false,
  );
});
test('WWC preserves saved question wording after edits and deletion and includes new questions', () => {
  const original = data['wwc-questions'][0];
  const added = data['wwc-questions'][1];
  const saved = {
    question_id: original.id,
    question: original.title,
    response: 'Jawaban kandidat',
  };
  const candidate = { ...original, answers_json: JSON.stringify([saved]) };
  assert.deepEqual(interviewAnswers(candidate, [{ ...original, title: 'Pertanyaan diubah' }]), [
    saved,
  ]);
  const answers = interviewAnswers(candidate, [added]);
  assert.deepEqual(answers[1], saved);
  assert.equal(answers[0].question_id, added.id);
  assert.equal(answers[0].response, '');
  assert.deepEqual(interviewAnswers(undefined, []), []);
});
test('WWC editing follows interviewer ownership and viewer restrictions', () => {
  for (const resource of ['wwc-participants', 'wwc-questions']) {
    assert.equal(memberCanEdit(member, { responsible: member.email }, resource), true);
    assert.equal(memberCanEdit(member, { responsible: 'someone@example.com' }, resource), false);
    assert.equal(
      memberCanEdit({ ...member, role: 'viewer' }, { responsible: member.email }, resource),
      false,
    );
    assert.equal(
      memberCanEdit({ ...member, role: 'admin' }, { responsible: 'someone@example.com' }, resource),
      true,
    );
  }
});
test('only a verified Google identity is eligible for membership lookup', () => {
  assert.equal(
    verifiedGoogleEmail('google', { email: 'Member@Example.com', email_verified: true }),
    member.email,
  );
  assert.equal(
    verifiedGoogleEmail('google', { email: member.email, email_verified: 'true' }),
    null,
  );
  assert.equal(verifiedGoogleEmail('google', { email: member.email }), null);
  assert.equal(verifiedGoogleEmail('other', { email: member.email, email_verified: true }), null);
});
test('membership requires one exact active email and rejects suspended, removed, and duplicate entries', () => {
  assert.equal(findActiveMembership([entry], member.email)?.id, entry.id);
  assert.equal(findActiveMembership([entry], 'MEMBER@example.com')?.id, entry.id);
  assert.equal(findActiveMembership([entry], 'other@example.com'), null);
  assert.equal(findActiveMembership([{ ...entry, status: 'suspended' }], member.email), null);
  assert.equal(findActiveMembership([], member.email), null);
  assert.equal(
    findActiveMembership([entry, { ...entry, id: crypto.randomUUID() }], member.email),
    null,
  );
});
test('members can edit only work assigned to their verified email', () => {
  assert.equal(memberCanEdit(member, { assignee: member.email }, 'tasks'), true);
  assert.equal(memberCanEdit(member, { assignee: member.name }, 'tasks'), false);
  assert.equal(memberCanEdit(member, { assignee: 'other@example.com' }, 'tasks'), false);
  assert.equal(
    memberCanEdit(member, { responsible: `other@example.com, ${member.email}` }, 'activities'),
    true,
  );
  assert.equal(memberCanEdit(member, { responsible: 'other@example.com' }, 'events'), false);
  assert.equal(
    memberCanEdit({ ...member, role: 'viewer' }, { assignee: member.email }, 'tasks'),
    false,
  );
  assert.equal(
    memberCanEdit({ ...member, role: 'admin' }, { assignee: 'other@example.com' }, 'tasks'),
    true,
  );
});
test('task validation rejects invalid statuses, dates, JSON subtasks, and dangerous reference URLs', () => {
  const task = data.tasks[0];
  assert.equal(taskSchema.safeParse(task).success, true);
  for (const change of [
    { status: 'Made up' },
    { due_date: '2020-01-01' },
    { subtasks_json: '[{}]' },
    { reference_url: 'javascript:alert(1)' },
    { title: '' },
  ])
    assert.equal(taskSchema.safeParse({ ...task, ...change }).success, false);
});
test('events require offset-aware timestamps and an end after their start', () => {
  assert.equal(eventSchema.safeParse(data.events[0]).success, true);
  assert.equal(
    eventSchema.safeParse({ ...data.events[0], end_datetime: data.events[0].start_datetime })
      .success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({ ...data.events[0], start_datetime: '2026-10-27T19:00:00' }).success,
    false,
  );
});
test('feedback validates each dynamic type and all six evaluation ratings', () => {
  const base = {
    submitter: 'Test Member',
    division: 'Web Development',
    description: 'A useful description.',
  };
  assert.equal(
    feedbackSchema.safeParse({
      ...base,
      type: 'feature_request',
      title: 'A useful feature',
      problem: 'A specific problem',
    }).success,
    true,
  );
  assert.equal(
    feedbackSchema.safeParse({ ...base, type: 'feature_request', title: '', problem: 'A problem' })
      .success,
    false,
  );
  assert.equal(
    feedbackSchema.safeParse({
      ...base,
      type: 'page_request',
      title: 'A useful page',
      slug: '/competition-guide',
    }).success,
    true,
  );
  assert.equal(
    feedbackSchema.safeParse({
      ...base,
      type: 'page_request',
      title: 'A useful page',
      slug: 'no spaces please',
    }).success,
    false,
  );
  assert.equal(feedbackSchema.safeParse({ ...base, type: 'evaluation' }).success, false);
  const ratings = Object.fromEntries(
    ['design', 'ux', 'responsiveness', 'performance', 'functionality', 'reliability'].map((k) => [
      `rating_${k}`,
      '4',
    ]),
  );
  assert.equal(feedbackSchema.safeParse({ ...base, type: 'evaluation', ...ratings }).success, true);
  assert.equal(
    feedbackSchema.safeParse({ ...base, type: 'evaluation', ...ratings, rating_design: '6' })
      .success,
    false,
  );
});
test('member roles and states are a closed validated set', () => {
  assert.equal(memberSchema.safeParse(entry).success, true);
  assert.equal(memberSchema.safeParse({ ...entry, role: 'owner' }).success, false);
  assert.equal(memberSchema.safeParse({ ...entry, status: 'anything' }).success, false);
});
test('calendar publishes public events only, with stable UIDs and Jakarta times converted to UTC', () => {
  const ics = generateICS(data.events, new Date('2026-10-26T00:00:00Z'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.ok(ics.includes(`UID:${data.events[2].id}@nesco-workspace`));
  assert.ok(ics.includes('DTSTART:20261031T020000Z'));
  assert.ok(ics.includes('DTEND:20261031T030000Z'));
  assert.ok(!ics.includes(data.events[0].title));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(ics.replaceAll('\r\n', '').includes('\n'), false);
});
test('calendar escapes descriptions and folds Unicode by UTF-8 octets', () => {
  assert.equal(escapeICS('A, B; C\\D\nline'), 'A\\, B\\; C\\\\D\\nline');
  const original = 'DESCRIPTION:' + '🌿 NESCO, together; '.repeat(15);
  const folded = foldLine(original);
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.equal(folded.replaceAll('\r\n ', ''), original);
});
test('WIB due-date boundaries use Jakarta, excluding completed tasks', () => {
  assert.equal(jakartaDate(new Date('2026-10-25T18:00:00Z')), '2026-10-26');
  assert.equal(overdue({ due_date: '2026-10-25', status: 'To Do' }, '2026-10-26'), true);
  assert.equal(overdue({ due_date: '2026-10-26', status: 'To Do' }, '2026-10-26'), false);
  assert.equal(overdue({ due_date: '2026-10-25', status: 'Done' }, '2026-10-26'), false);
});
