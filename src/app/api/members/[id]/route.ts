import { z } from 'zod';
import { memberSchema } from '@/lib/schema';
import { checkOrigin, requireAdmin, requireUser } from '@/lib/server/auth';
import { changeMember } from '@/lib/server/members';
import { handleApi, parseJsonBody } from '@/lib/server/api';
import { listMembers } from '@/lib/server/members';
import { AppError } from '@/lib/errors';
type Context = { params: Promise<{ id: string }> };
export const GET = (_request: Request, context: Context) =>
  handleApi(async () => {
    requireAdmin(await requireUser());
    const { id } = await context.params;
    const member = (await listMembers()).find((m) => m.id === id);
    if (!member) throw new AppError(404, 'Member not found.');
    return Response.json({ data: member }, { headers: { 'Cache-Control': 'private, no-store' } });
  });
export const PATCH = (request: Request, context: Context) =>
  handleApi(async () => {
    checkOrigin(request);
    const user = await requireUser();
    requireAdmin(user);
    const { id } = await context.params;
    const raw = await parseJsonBody(request);
    return Response.json({
      data: await changeMember(
        id,
        z.string().min(1).parse(raw.version),
        memberSchema.parse(raw),
        user,
      ),
    });
  });
export const DELETE = (request: Request, context: Context) =>
  handleApi(async () => {
    checkOrigin(request);
    const user = await requireUser();
    requireAdmin(user);
    const { id } = await context.params;
    const raw = await parseJsonBody(request);
    await changeMember(id, z.string().min(1).parse(raw.version), null, user);
    return Response.json({ data: { ok: true } });
  });
