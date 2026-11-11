import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  const isPublic = pathname === "/login" || pathname === "/pending";

  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const { status, role } = session.user;

  // REJECTED accounts are locked out. PENDING accounts get view-only access.
  if (status === "REJECTED") {
    if (pathname === "/pending") return NextResponse.next();
    return NextResponse.redirect(new URL("/pending", request.nextUrl.origin));
  }

  if (status === "PENDING") {
    if (pathname === "/pending" || pathname === "/login" || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/recipes", request.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (role === "ADMIN") return NextResponse.next();
    // Moderators get the overview plus the review and comment queues only.
    const moderatorPaths = ["/admin", "/admin/recipes/pending", "/admin/comments"];
    const allowed =
      role === "MODERATOR" &&
      moderatorPaths.some((p) => pathname === p || (p !== "/admin" && pathname.startsWith(p + "/")));
    if (!allowed) {
      const target = role === "MODERATOR" ? "/admin" : "/recipes";
      return NextResponse.redirect(new URL(target, request.nextUrl.origin));
    }
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/recipes", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
