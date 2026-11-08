"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { parseViewAs, VIEW_AS_COOKIE, type ViewAsRole } from "@/lib/viewAs";

const EIGHT_HOURS = 60 * 60 * 8;

/** Start previewing as `role`, or pass null to go back to being yourself. */
export async function setViewAs(role: ViewAsRole | null) {
  const session = await auth();
  // Checks the *real* role: only genuine admins can start or stop a preview.
  if (session?.user.role !== "ADMIN") throw new Error("Not authorized: admin only");

  const jar = await cookies();
  const next = parseViewAs(role);
  if (next) {
    jar.set(VIEW_AS_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // Expires on its own so a forgotten preview doesn't linger.
      maxAge: EIGHT_HOURS,
    });
  } else {
    jar.delete(VIEW_AS_COOKIE);
  }

  redirect(next ? "/recipes" : "/admin");
}
