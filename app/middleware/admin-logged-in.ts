import { useUserStore } from "#imports";

export default defineNuxtRouteMiddleware((to, _from) => {
  const useUser = useUserStore();
  const allowedRoles = ["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE_ADMIN"];

  if (useUser.isLoggedIn && allowedRoles.includes(useUser.role as string)) {
    if (useUser.isLoggedIn && to.path === "/admin/login") {
      return navigateTo("/admin");
    }
  }
});
