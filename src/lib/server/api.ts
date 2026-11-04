import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '../errors';
import { schemas, requestStatuses, type Resource, type WorkspaceRecord } from '../schema';
import { canReview, checkOrigin, requireAdmin, requireUser, requireWriter } from './auth';
import { memberCanEdit } from '../permissions';
import { createRecord, listRecords, updateRecord } from './sheets';
import { demoMode } from './config';
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function handleApi(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        { error: 'Please check the highlighted fields.', fields: error.flatten().fieldErrors },
        422,
      );
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    console.error(
      'Workspace request failed:',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return json(
      { error: 'The workspace could not complete this request. Retry in a moment.' },
      503,
    );
  }
}
export async function parseJsonBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 100000)
    throw new AppError(413, 'Submission is too large.');
  const raw = await request.text();
  if (raw.length > 100000) throw new AppError(413, 'Submission is too large.');
  try {
    return z.record(z.string(), z.unknown()).parse(JSON.parse(raw));
  } catch {
    throw new AppError(400, 'Expected a JSON object.');
  }
}
export function collectionHandlers(resource: Resource) {
  return {
    GET: (request: Request) =>
      handleApi(async () => {
        const user = await requireUser();
        let records = await listRecords(resource);
        if (resource === 'feedback' && !canReview(user))
          records = records.filter((r) => r.type !== 'evaluation');
        const params = new URL(request.url).searchParams;
        const limit = z.coerce
          .number()
          .int()
          .min(1)
          .max(5000)
          .parse(params.get('limit') || 500);
        const offset = z.coerce
          .number()
          .int()
          .min(0)
          .parse(params.get('offset') || 0);
        return json({ data: records.slice(offset, offset + limit), total: records.length });
      }),
    POST: (request: Request) =>
      handleApi(async () => {
        checkOrigin(request);
        const user = await requireUser();
        requireWriter(user);
        if (demoMode())
          throw new AppError(
            503,
            'Demo mode cannot save to Google Sheets. Configure the workspace first.',
          );
        const raw = await parseJsonBody(request);
        const id = z.uuid().parse(raw.id);
        const data = schemas[resource].parse(raw) as Record<string, string>;
        if (
          resource !== 'feedback' &&
          !memberCanEdit(user, data as Record<string, string>, resource)
        )
          throw new AppError(
            403,
            'Members may create records assigned to their own verified email.',
          );
        const now = new Date().toISOString();
        const record = {
          ...data,
          id,
          created_at: now,
          updated_at: now,
          ...(resource === 'feedback'
            ? {
                status: data.type === 'evaluation' ? 'Received' : 'Submitted',
                title: data.title || 'Website evaluation 2026',
              }
            : {}),
        } as WorkspaceRecord;
        return json({ data: await createRecord(resource, record) }, 201);
      }),
  };
}
type Context = { params: Promise<{ id: string }> };
export function itemHandlers(resource: Resource) {
  return {
    GET: (_request: Request, context: Context) =>
      handleApi(async () => {
        const user = await requireUser();
        const { id } = await context.params;
        const record = (await listRecords(resource)).find((r) => r.id === id);
        if (!record) throw new AppError(404, 'Record not found.');
        if (resource === 'feedback' && record.type === 'evaluation' && !canReview(user))
          throw new AppError(403, 'Evaluation responses are restricted to authorized reviewers.');
        return json({ data: record });
      }),
    PATCH: (request: Request, context: Context) =>
      handleApi(async () => {
        checkOrigin(request);
        const user = await requireUser();
        requireWriter(user);
        const { id } = await context.params;
        const raw = await parseJsonBody(request);
        const version = z.string().min(1).parse(raw.if_unmodified_since);
        const current = (await listRecords(resource)).find((r) => r.id === id);
        if (!current) throw new AppError(404, 'Record not found.');
        let data: Record<string, string>;
        if (resource === 'feedback') {
          requireAdmin(user);
          if (current.type === 'evaluation')
            throw new AppError(400, 'Evaluations do not use request review statuses.');
          data = { status: z.enum(requestStatuses).parse(raw.status) };
        } else {
          data = schemas[resource].parse({ ...current, ...raw }) as Record<string, string>;
          if (!memberCanEdit(user, current, resource) || !memberCanEdit(user, data, resource))
            throw new AppError(403, 'You may only update records assigned to your verified email.');
        }
        return json({ data: await updateRecord(resource, id, version, data) });
      }),
    DELETE: (request: Request, context: Context) =>
      handleApi(async () => {
        checkOrigin(request);
        const user = await requireUser();
        requireAdmin(user);
        const { id } = await context.params;
        const raw = await parseJsonBody(request);
        const version = z.string().min(1).parse(raw.if_unmodified_since);
        await updateRecord(resource, id, version, null);
        return json({ ok: true });
      }),
  };
}
