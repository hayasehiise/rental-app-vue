import { PrismaClient } from "@prisma/client";
import * as j from "jose";

const prisma = new PrismaClient();
// encode untuk secret
const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "token");
  if (!token) return { user: null };

  try {
    const { payload } = await j.jwtVerify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: { id: true, name: true, email: true, role: true },
    });

    return { user };
  } catch {
    return { user: null };
  }
});
