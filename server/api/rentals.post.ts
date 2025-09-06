import type { RentalType } from "@prisma/client";
import { prisma } from "../utils/prisma";

interface EventRes {
  name: string;
  type: RentalType;
  description?: string;
}
export default defineEventHandler(async (event) => {
  const body = await readBody<EventRes>(event);

  if (!body.name || !body.type) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nama dan Tipe Dibutuhkan",
    });
  }

  const rental = await prisma.rental.create({
    data: {
      name: body.name,
      type: body.type,
      description: body.description || "",
    },
  });

  return rental;
});
