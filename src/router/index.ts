import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from '../stores/auth';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();

    if (to.meta['public']) {
      // Redirect to dashboard if already authenticated
      if (authStore.isAuthenticated) {
        return next({ name: 'dashboard' });
      }
      return next();
    }

    if (to.meta['requiresAuth']) {
      if (!authStore.isAuthenticated) {
        // Try to restore session
        const ok = await authStore.checkAuth();
        if (!ok) {
          return next({ name: 'login', query: { redirect: to.fullPath } });
        }
      }
      return next();
    }

    return next();
  });

  return Router;
});
