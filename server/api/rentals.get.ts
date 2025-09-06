import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
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
});
