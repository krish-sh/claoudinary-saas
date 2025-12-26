import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-up",
  "/sign-in",
  "/",
  "/home",
]);

const isPublicApiRouter = createRouteMatcher(["/api/videos"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const accessHomeDashboard = currentUrl.pathname === "/home";
  const isApiRequest = currentUrl.pathname.startsWith("/api");

  // If user is logged in and tries to access auth pages, redirect to home
  if (userId && isPublicRoute(req) && !accessHomeDashboard) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // If user is NOT logged in
  if (!userId) {
    // ALLOW access to public routes (don't redirect!)
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // ALLOW access to public API routes
    if (isApiRequest && isPublicApiRouter(req)) {
      return NextResponse.next();
    }

    // Everything else requires authentication - redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
