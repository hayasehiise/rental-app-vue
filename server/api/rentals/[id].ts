import type { RentalType } from "@prisma/client";
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID Diperlukan" });
  }

  const method = getMethod(event);

  // Get -> detail rental
  if (method === "GET") {
    return prisma.rental.findUnique({
      where: { id },
    });
  }

  // Put -> update rental
  if (method === "PUT" || method === "PATCH") {
    interface EventRes {
      name: string;
      type: RentalType;
      description?: string;
    }
    const body = await readBody<EventRes>(event);
    return prisma.rental.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
      },
    });
  }

  // Delete -> delete rental data
  if (method === "DELETE") {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true };
  }
});
