import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Decisions API v1 endpoint stub' });
}

export async function POST() {
  return NextResponse.json({ message: 'Create decision stub' }, { status: 201 });
}
