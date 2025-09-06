import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

// encode untuk secret
const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event);

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid Credentials",
    });
  }

  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid Credentials",
    });
  }

  const token = await new SignJWT({ id: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  // Simpan token di cookie
  setCookie(event, "token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
});
