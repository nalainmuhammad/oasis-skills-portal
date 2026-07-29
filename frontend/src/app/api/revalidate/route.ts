import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag');
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.NEXTJS_REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
  }

  // @ts-ignore
  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
