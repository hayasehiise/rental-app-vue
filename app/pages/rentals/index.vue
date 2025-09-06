<template>
  <UContainer>
    <!-- List Rental Card -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <UCard v-for="rental in rentals" :key="rental.id" variant="subtle">
        <template #header>
          <h3 class="font-semibold">{{ rental.name }}</h3>
        </template>
        <UBadge color="info">{{ rental.type }}</UBadge>
        <p>{{ rental.description }}</p>
        <template #footer>
          <UButton variant="ghost" color="neutral" label="Detail Unit" />
        </template>
      </UCard>
    </div>
    <!-- Loading indicator -->
    <div v-if="pagination.loading" class="text-center p-4">...Loading</div>
    <div v-if="!pagination.hasMore" class="text-center p-4">
      Semua Data Sudah Dimuat
    </div>
    <!-- invisible trigger infinte scroll -->
    <div ref="infiniteEl" class="h-10" />
  </UContainer>
</template>

<script lang="ts" setup>
import type { RentalType } from "@prisma/client";
import { useInfiniteScroll } from "@vueuse/core";

// Rental Interface
interface Rental {
  id: string;
  name: string;
  type: RentalType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface RentalsRes {
  data: Rental[];
  hasMore: boolean;
}

// state untuk simpan fetch dan pagination
const rentals = ref<Rental[]>([]);
const pagination = reactive({
  page: 1,
  limit: 6,
  hasMore: true,
  loading: false,
  search: "",
});

// function Fetch Data Rental
async function fetchRentals() {
  if (!pagination.hasMore || pagination.loading) return;
  pagination.loading = true;

  const res = await $fetch<RentalsRes>(`/api/rentals`, {
    params: {
      page: pagination.page,
      limit: pagination.limit,
      search: pagination.search,
    },
  });
  rentals.value.push(...res.data);
  pagination.hasMore = res.hasMore;
  pagination.page++;
  pagination.loading = false;
}

// initial load
await fetchRentals();

// infinite scroll hook
const infiniteEl = ref<HTMLElement | null>(null);
useInfiniteScroll(
  infiniteEl,
  async () => {
    await fetchRentals();
  },
  { distance: 100 }
);
</script>

<style></style>
