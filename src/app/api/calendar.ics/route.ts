import { generateICS } from '@/lib/ics';
import { listRecords } from '@/lib/server/sheets';
export async function GET() {
  try {
    return new Response(generateICS(await listRecords('events')), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="nesco-2027.ics"',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json(
      {
        error:
          'The official calendar is not available. Ask an administrator to check the Google Sheets connection.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
