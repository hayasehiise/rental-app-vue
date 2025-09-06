<template>
  <UContainer>
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit.prevent="onLogin"
    >
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" />
      </UFormField>
      <UFormField label="Password" name="password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? 'Hide Password' : 'Show Password'"
              :aria-pressed="showPassword"
              aria-controls="password"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UButton label="Submit" type="submit" />
    </UForm>
  </UContainer>
</template>

<script lang="ts" setup>
import { useUserStore } from "~/stores/user";
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  middleware: ["admin-logged-in"],
});
const showPassword = ref(false);
const schema = z.object({
  email: z.email("Masukan Email yang Valid"),
  password: z.string().min(6, "Masukan Minimal 6 Karakter"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onLogin(_event: FormSubmitEvent<Schema>) {
  try {
    const res = await $fetch("/api/auth/login", {
      method: "POST",
      body: { email: state.email, password: state.password },
    });
    console.log(res);
    useUserStore().setUser(res);
    toast.add({
      title: "Login Berhasil",
      description: `Selamat Datang ${useUserStore().name}`,
      color: "success",
    });
    return navigateTo("/admin");
  } catch {
    toast.add({
      title: "Login Gagal",
      description: "Mungkin ada yang salah",
      color: "error",
    });
  }
}
</script>

<style></style>
