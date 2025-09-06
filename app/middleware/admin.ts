export default defineNuxtRouteMiddleware(async (to, _from) => {
  const useUser = useUserStore();

  if (!useUser.isLoggedIn && to.path.startsWith("/admin")) {
    return navigateTo("/admin/login");
  }
  if (useUser.isLoggedIn && !useUser.isAdmin) {
    useUser.logout();
    return navigateTo("/admin/login");
  }
});
