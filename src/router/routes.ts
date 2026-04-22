import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'meters',
        name: 'meter-list',
        component: () => import('pages/MeterListPage.vue'),
      },
      {
        path: 'meters/create',
        name: 'meter-create',
        component: () => import('pages/MeterCreatePage.vue'),
      },
      {
        path: 'meters/:id(\\d+)',
        name: 'meter-detail',
        component: () => import('pages/MeterDetailPage.vue'),
        props: (route) => ({ id: Number(route.params['id']) }),
      },
      {
        path: 'meters/:id(\\d+)/edit',
        name: 'meter-edit',
        component: () => import('pages/MeterEditPage.vue'),
        props: (route) => ({ id: Number(route.params['id']) }),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
      },
    ],
  },
  // Catch-all
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

export default routes;
