export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  await auth.initialize()

  if (to.path === '/login') {
    if (auth.isAuthenticated.value) {
      return navigateTo('/')
    }

    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo('/login')
  }
})
