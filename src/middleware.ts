import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            // Check if the user is authenticated.
            // We protect everything except specific public paths like /login.
            return !!token;
        },
    },
});

export const config = {
    // Add all the routes that should be protected.
    // This matches everything EXCEPT /login, /api, /_next, static files, etc.
    matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
