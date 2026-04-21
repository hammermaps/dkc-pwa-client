<template>
  <q-layout view="lHh lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          DK-Control
        </q-toolbar-title>
        <SyncIndicator class="q-mr-sm" />
        <q-btn
          flat
          round
          dense
          icon="account_circle"
          @click="showUserMenu = true"
        >
          <q-tooltip>{{ user?.vname }} {{ user?.nname }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md">
          <div class="text-h6 text-primary">DK-Control</div>
          <div
            v-if="user"
            class="text-caption text-grey"
          >
            {{ user.vname }} {{ user.nname }}
          </div>
        </div>

        <q-separator />

        <q-list padding>
          <q-item
            v-for="item in navItems"
            :key="item.name"
            clickable
            :active="$route.name === item.name || String($route.name ?? '').startsWith(String(item.namePrefix ?? ''))"
            active-class="text-primary"
            :to="item.to"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-list padding>
          <q-item
            clickable
            @click="handleLogout"
          >
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section class="text-negative">Abmelden</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <OfflineBanner class="q-mx-md q-mt-sm" />
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation for mobile -->
    <q-footer class="bg-white shadow-up-2 gt-xs" style="display: none" />
    <q-tabs
      v-model="activeTab"
      class="text-grey fixed-bottom lt-sm bg-white shadow-up-2"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      dense
    >
      <q-tab
        name="dashboard"
        icon="dashboard"
        label="Dashboard"
        @click="$router.push('/dashboard')"
      />
      <q-tab
        name="meters"
        icon="speed"
        label="Zähler"
        @click="$router.push('/meters')"
      />
      <q-tab
        name="settings"
        icon="settings"
        label="Einstellungen"
        @click="$router.push('/settings')"
      />
    </q-tabs>

    <!-- User menu dialog -->
    <q-dialog v-model="showUserMenu" position="top">
      <q-card style="min-width: 280px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ user?.vname }} {{ user?.nname }}</div>
          <div class="text-caption">{{ user?.email }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            color="negative"
            label="Abmelden"
            icon="logout"
            @click="handleLogout"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import OfflineBanner from '../components/OfflineBanner.vue';
import SyncIndicator from '../components/SyncIndicator.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);
const showUserMenu = ref(false);
const user = computed(() => authStore.user);

const activeTab = computed(() => {
  const name = String(route.name ?? '');
  if (name.startsWith('meter')) return 'meters';
  if (name === 'settings') return 'settings';
  return 'dashboard';
});

const navItems = [
  { name: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { name: 'meter-list', namePrefix: 'meter', icon: 'speed', label: 'Zähler', to: '/meters' },
  { name: 'settings', icon: 'settings', label: 'Einstellungen', to: '/settings' },
];

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function handleLogout() {
  showUserMenu.value = false;
  await authStore.logout();
  await router.push({ name: 'login' });
}
</script>
