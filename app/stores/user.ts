import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    id: null as string | null,
    name: null as string | null,
    email: null as string | null,
    role: null as string | null,
  }),
  actions: {
    setUser(user: { id: string; name: string; email: string; role: string }) {
      this.id = user.id;
      this.name = user.name;
      this.email = user.email;
      this.role = user.role;
    },
    async getUser() {
      try {
        const { user } = await $fetch("/api/auth/me");
        if (user) {
          this.id = user.id;
          this.name = user.name;
          this.email = user.email;
          this.role = user.role;
        }
      } catch {
        this.clearUser();
      }
    },
    clearUser() {
      this.$reset();
    },
    async logout() {
      try {
        await $fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch {
        console.error("ada yang salah");
      } finally {
        this.clearUser();
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.id,
    isAdmin: (state) =>
      ["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE_ADMIN"].includes(
        state.role ?? ""
      ),
  },
  persist: true,
});
