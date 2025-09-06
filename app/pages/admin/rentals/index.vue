<template>
  <UContainer class="py-10">
    <!-- Heading Page -->
    <div class="flex">
      <p class="text-2xl font-bold">Rental Management</p>
    </div>
    <!-- Search on table -->
    <div
      class="flex items-center justify-between px-4 py-3.5 border-b border-accented"
    >
      <UInput
        v-model="pagination.search"
        class="max-w-sm"
        placeholder="Cari Rental Data"
      />
      <div class="flex">
        <UButton
          icon="i-tabler-circle-plus-filled"
          label="Tambah Rental"
          @click="modalCreate = true"
        />
      </div>
    </div>
    <!-- List Rental -->
    <div class="w-full">
      <UTable
        ref="table"
        :data="rentals"
        :columns="column"
        :loading="pending"
        sticky
        class="flex-1 h-96 overflow-auto"
      />
    </div>
    <!-- Modal Create -->
    <UModal v-model:open="modalCreate" title="Create Rental">
      <template #body>
        <UForm
          :schema="createSchema"
          :state="createState"
          class="grid grid-cols-2 gap-2"
          @submit="handleCreate"
        >
          <UFormField label="Nama Rental" name="name">
            <UInput v-model="createState.name" />
          </UFormField>
          <UFormField label="Tipe" name="type">
            <USelect
              v-model="createState.type"
              :items="[
                { label: 'Lapangan', value: 'LAPANGAN' },
                { label: 'Gedung', value: 'GEDUNG' },
                { label: 'Kendaraan', value: 'KENDARAAN' },
              ]"
              placeholder="Pilih Tipe"
            />
          </UFormField>
          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="createState.description" autoresize />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <div class="flex gap-5">
          <UButton
            label="Create"
            icon="i-tabler-device-floppy"
            @click="onCreate"
          />
          <UButton
            label="Cancel"
            variant="outline"
            color="neutral"
            @click="modalCreate = false"
          />
        </div>
      </template>
    </UModal>
    <!-- Modal Edit -->
    <UModal v-model:open="modalEdit" title="Edit Rental">
      <template #body>
        <UForm
          :schema="editSchema"
          :state="stateEdit"
          class="grid grid-cols-2 gap-2"
          @submit="handleUpdate"
        >
          <UFormField label="Nama Rental" name="name">
            <UInput v-model="stateEdit.name" />
          </UFormField>
          <UFormField label="Tipe" name="type">
            <USelect
              v-model="stateEdit.type"
              :items="[
                { label: 'Lapangan', value: 'LAPANGAN' },
                { label: 'Gedung', value: 'GEDUNG' },
                { label: 'Kendaraan', value: 'KENDARAAN' },
              ]"
              placeholder="Pilih Tipe"
            />
          </UFormField>
          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="stateEdit.description" autoresize />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <div class="flex gap-5">
          <UButton
            label="Update"
            icon="i-tabler-device-floppy"
            @click="onUpdate"
          />
          <UButton
            label="Cancel"
            variant="outline"
            color="neutral"
            @click="modalEdit = false"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script lang="ts" setup>
import type { RentalType } from "@prisma/client";
import { useInfiniteScroll } from "@vueuse/core";
import type { TableColumn } from "@nuxt/ui";
import * as z from "zod";
import type { ComponentPublicInstance } from "vue";

definePageMeta({
  middleware: ["admin"],
});

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

// Resolve Component yang nanti digunakan pada table
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

// Table Column
const column: TableColumn<Rental>[] = [
  { accessorKey: "name", header: "Nama Rental" },
  {
    accessorKey: "type",
    header: "Tipe Rental",
    cell: ({ row }) =>
      h(UBadge, { variant: "subtle", color: "info" }, () =>
        row.getValue("type")
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string;
      return new Date(raw).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const rental = row.original as Rental;
      return h("div", { class: "flex gap-2" }, [
        h(
          UButton,
          {
            size: "xs",
            color: "primary",
            variant: "subtle",
            icon: "i-tabler-pencil",
            onClick: () => editRental(rental),
          },
          { default: () => "Edit" }
        ),
        h(
          UButton,
          {
            size: "xs",
            color: "error",
            icon: "i-tabler-trash",
            variant: "subtle",
            onClick: () => deleteRental(rental.id),
          },
          { default: () => "Delete" }
        ),
        h(
          UButton,
          {
            size: "xs",
            color: "neutral",
            icon: "i-tabler-stack-2-filled",
            variant: "subtle",
            onClick: () => navigateTo(`/admin/rentals/${rental.id}/units`),
          },
          { default: () => "Units" }
        ),
      ]);
    },
  },
];

// state untuk simpan fetch dan pagination
const rentals = ref<Rental[]>([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  hasMore: true,
  search: "",
});

/**
 * Sesuai pola docs:
 * - params berisi sumber reaktif (page) -> re-fetch otomatis saat berubah
 * - immediate: false + execute() sekali; perubahan params akan memicu fetch lagi
 * - transform mengembalikan { items, hasMore } agar kita bisa stop load
 */
const params = reactive({
  page: pagination.page,
  limit: pagination.limit,
  search: pagination.search,
});
const { data, status, execute, pending } = await useFetch("/api/rentals", {
  key: "admin-rentals",
  params,
  transform: (res: RentalsRes) => {
    return {
      items: res.data,
      hasMore: res.hasMore,
    };
  },
  lazy: true,
  immediate: false,
});

// append hasil tiap fetch ke list dan update hasMore
watch(data, (val) => {
  if (!val) return;
  rentals.value.push(...val.items);
  pagination.hasMore = val.hasMore;
});

// fetch pertama
execute();

// hook infinite scroll - targetkan DOM dari element UTable
const table = useTemplateRef<ComponentPublicInstance>("table");
onMounted(() => {
  useInfiniteScroll(
    table.value?.$el,
    async () => {
      if (!pagination.hasMore) return;
      pagination.page++;
      params.page = pagination.page;
      await execute();
    },
    {
      distance: 200,
      canLoadMore: () => status.value !== "pending" && pagination.hasMore,
    }
  );
});

// Search function
watch(
  () => pagination.search,
  useDebounceFn(() => {
    // reset pagination dan rentals
    rentals.value = [];
    pagination.page = 1;
    pagination.hasMore = true;

    // update params untuk fetch
    params.page = pagination.page;
    params.search = pagination.search;

    execute();
  }, 500)
);

// toast yang akan dipakai oleh create, update, delete
const toast = useToast();

// ref untuk modal create
const modalCreate = ref(false);

// schema untuk create form
const createSchema = z.object({
  name: z.string("Masukan Nama Rental"),
  type: z.enum(["LAPANGAN", "GEDUNG", "KENDARAAN"], "Pilih Tipe yang tersedia"),
  description: z.string().optional(),
});
type CreateSchema = z.output<typeof createSchema>;

// state form
const createState = reactive<Partial<CreateSchema>>({
  name: undefined,
  type: undefined,
  description: "",
});

// Loading state
const createLoading = ref(false);

// function handle create
async function handleCreate() {
  try {
    createLoading.value = true;
    await $fetch("/api/rentals", {
      method: "POST",
      body: createState,
    });

    // reset state
    createState.name = undefined;
    createState.type = undefined;
    createState.description = "";
    modalCreate.value = false;

    // toast
    toast.add({
      title: "Berhasil",
      description: "Data Rental Berhasil Ditambahkan",
      color: "success",
    });

    // refresh table
    rentals.value = [];
    pagination.page = 1;
    pagination.hasMore = true;
    await execute();
  } catch (err) {
    toast.add({ title: "Gagal", description: err as string, color: "error" });
  } finally {
    createLoading.value = false;
  }
}

// handle create untuk footer modal
function onCreate() {
  handleCreate();
}

// watch untuk reset form
watch(modalCreate, (val) => {
  if (!val) {
    createState.name = undefined;
    createState.type = undefined;
    createState.description = "";
  }
});

// ref untuk modal Edit
const modalEdit = ref(false);

// schema validasi edit
const editSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z
    .enum(["LAPANGAN", "GEDUNG", "KENDARAAN"], "Pilih Tipe yang tersedia")
    .optional(),
  description: z.string().optional(),
});
type EditSchema = z.output<typeof editSchema>;

// state form edit
const stateEdit = reactive<Partial<EditSchema>>({
  id: undefined,
  name: undefined,
  type: undefined,
  description: "",
});

// Loading State Edit
const loadingEdit = ref(false);

// function buka modal edit
async function editRental(rental: Rental) {
  // Bisa buka modal edit nanti disini
  stateEdit.id = rental.id;
  stateEdit.name = rental.name;
  stateEdit.type = rental.type;
  stateEdit.description = rental.description ?? "";
  modalEdit.value = true;
}

// function handle update
async function handleUpdate() {
  try {
    loadingEdit.value = true;
    await $fetch(`/api/rentals/${stateEdit.id}`, {
      method: "PUT",
      body: {
        name: stateEdit.name,
        type: stateEdit.type,
        description: stateEdit.description,
      },
    });

    // reset state
    stateEdit.id = undefined;
    stateEdit.name = undefined;
    stateEdit.type = undefined;
    stateEdit.description = "";
    modalEdit.value = false;

    // toast
    toast.add({
      title: "Berhasil",
      description: "Data Berhasil Diedit",
      color: "success",
    });

    rentals.value = [];
    pagination.page = 1;
    pagination.hasMore = true;

    params.page = pagination.page;
    await execute();
  } catch (err) {
    toast.add({ title: "Gagal", description: err as string, color: "error" });
  } finally {
    loadingEdit.value = false;
  }
}

// handle update untuk footer modal
function onUpdate() {
  handleUpdate();
}

// watch untuk reset form update
watch(modalEdit, (val) => {
  if (!val) {
    stateEdit.id = undefined;
    stateEdit.name = undefined;
    stateEdit.type = undefined;
    stateEdit.description = "";
  }
});

// open modal delete
async function deleteRental(id: string) {
  // bisa buka modal delete rental disini
  console.log("Hapus Rental", id);
}
</script>

<style></style>
