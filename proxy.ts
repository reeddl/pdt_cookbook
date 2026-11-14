import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Wrapping the proxy in auth() (rather than calling `await auth()` inside it)
// lets Auth.js write the refreshed session cookie onto every response. That
// rolling refresh is what keeps a returning visitor signed in: each visit pushes
// the cookie's expiry another 30 days out. A bare `await auth()` here reads the
// session but throws the refreshed cookie away, so the cookie expired a fixed
// time after sign-in no matter how often the site was used.
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

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
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
