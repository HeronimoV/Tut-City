import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/solve/:path*"],
  // Note: /admin routes are NOT included — they use their own ADMIN_SECRET auth
};
