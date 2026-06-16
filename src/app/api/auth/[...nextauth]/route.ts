import NextAuth from "next-auth";

export const runtime = "nodejs";

const handler = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
