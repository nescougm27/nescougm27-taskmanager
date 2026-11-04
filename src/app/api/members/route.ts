import { memberSchema } from '@/lib/schema';
import { checkOrigin, requireAdmin, requireUser } from '@/lib/server/auth';
import { createMember, listMembers } from '@/lib/server/members';
import { handleApi, parseJsonBody } from '@/lib/server/api';
export const GET = () =>
  handleApi(async () => {
    requireAdmin(await requireUser());
    return Response.json(
      { data: await listMembers() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  });
export const POST = (request: Request) =>
  handleApi(async () => {
    checkOrigin(request);
    requireAdmin(await requireUser());
    return Response.json(
      { data: await createMember(memberSchema.parse(await parseJsonBody(request))) },
      { status: 201 },
    );
  });
