import { NextResponse } from "next/server";

export const GET = (request: Request) => {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}