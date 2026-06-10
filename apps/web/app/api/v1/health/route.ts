import { NextResponse } from 'next/server';


export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'joblify-web',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });
}
