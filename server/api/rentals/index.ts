import type { RentalType } from "@prisma/client";
export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // get List rentals
  if (method === "GET") {
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search ? String(query.search) : "";

    const [data, total] = await Promise.all([
      prisma.rental.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { name: { contains: search } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rental.count({
        where: { name: { contains: search } },
      }),
    ]);

    const hasMore = page * limit < total;

    return { data, hasMore };
  }

  // Post Rentals
  if (method === "POST") {
    interface EventRes {
      name: string;
      type: RentalType;
      description?: string;
    }

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
  }
});
