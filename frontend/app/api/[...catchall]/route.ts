/**
 * Next.js API Catchall Guard
 *
 * If any /api/* request accidentally hits the Next.js server instead of
 * being routed to the FastAPI backend, this handler returns a clear
 * JSON 502 so developers immediately know the issue: missing
 * NEXT_PUBLIC_API_URL (rewrites disabled) or a path that is not proxied.
 */

import { NextResponse } from "next/server";

interface CatchallErrorBody {
  success: false;
  message: string;
}

function gatewayError(): NextResponse<CatchallErrorBody> {
  return NextResponse.json(
    {
      success: false as const,
      message:
        "502 Bad Gateway — this request was not proxied to the backend. Check NEXT_PUBLIC_API_URL.",
    },
    { status: 502 },
  );
}

export function GET() {
  return gatewayError();
}

export function POST() {
  return gatewayError();
}

export function PUT() {
  return gatewayError();
}

export function PATCH() {
  return gatewayError();
}

export function DELETE() {
  return gatewayError();
}
