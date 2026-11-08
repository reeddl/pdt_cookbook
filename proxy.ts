import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resolveRole, VIEW_AS_COOKIE } from "@/lib/viewAs";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  const isPublic = pathname === "/login" || pathname === "/pending";

  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const { status } = session.user;
  // An admin previewing a lower role is routed exactly as that role would be.
  const { role } = resolveRole(session.user.role, request.cookies.get(VIEW_AS_COOKIE)?.value);

  if (status !== "APPROVED") {
    if (pathname === "/pending") return NextResponse.next();
    return NextResponse.redirect(new URL("/pending", request.nextUrl.origin));
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
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
