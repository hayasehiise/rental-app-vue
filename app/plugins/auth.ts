export default defineNuxtPlugin(async (_nuxtApp) => {
  const useUser = useUserStore();
  await useUser.getUser();
});
