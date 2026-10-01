import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  details: Record<string, unknown> | null = null,
  status = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details || undefined,
      },
    },
    { status }
  );
}

export function successResponse<T>(data: T, status = 200, headers: HeadersInit = {}) {
  return NextResponse.json(data, {
    status,
    headers,
  });
}
