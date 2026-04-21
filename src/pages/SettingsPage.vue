<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Einstellungen</div>

    <!-- Account -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Konto</div>
        <div
          v-if="user"
          class="q-gutter-sm"
        >
          <div class="row">
            <div class="col-4 text-caption text-grey">Name</div>
            <div class="col">{{ user.vname }} {{ user.nname }}</div>
          </div>
          <div class="row">
            <div class="col-4 text-caption text-grey">Benutzername</div>
            <div class="col">{{ user.username }}</div>
          </div>
          <div class="row">
            <div class="col-4 text-caption text-grey">E-Mail</div>
            <div class="col">{{ user.email }}</div>
          </div>
          <div class="row">
            <div class="col-4 text-caption text-grey">Admin</div>
            <div class="col">
              <q-badge :color="user.is_admin ? 'primary' : 'grey'">
                {{ user.is_admin ? 'Ja' : 'Nein' }}
              </q-badge>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Sync status -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Synchronisation</div>
        <div class="q-gutter-sm">
          <div class="row items-center">
            <div class="col-4 text-caption text-grey">Status</div>
            <div class="col">
              <q-badge :color="isOnline ? 'positive' : 'negative'">
                {{ isOnline ? 'Online' : 'Offline' }}
              </q-badge>
            </div>
          </div>
          <div class="row items-center">
            <div class="col-4 text-caption text-grey">Ausstehend</div>
            <div class="col">{{ pendingCount }} Einträge</div>
          </div>
          <div
            v-if="lastSyncAt"
            class="row"
          >
            <div class="col-4 text-caption text-grey">Letzter Sync</div>
            <div class="col">{{ formatDate(lastSyncAt) }}</div>
          </div>
        </div>
        <q-btn
          v-if="pendingCount > 0"
          class="q-mt-md"
          color="primary"
          outline
          icon="sync"
          label="Jetzt synchronisieren"
          :loading="isSyncing"
          :disable="!isOnline"
          @click="triggerSync"
        />
      </q-card-section>
    </q-card>

    <!-- API Tokens -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">API-Tokens</div>
        <div
          v-if="isLoadingTokens"
          class="q-pa-sm"
        >
          <q-skeleton
            v-for="i in 2"
            :key="i"
            type="text"
            class="q-mb-sm"
          />
        </div>
        <q-list
          v-else
          dense
        >
          <q-item
            v-for="token in tokens"
            :key="token.id"
          >
            <q-item-section>
              <q-item-label>{{ token.name }}</q-item-label>
              <q-item-label caption>
                Erstellt: {{ formatDate(new Date(token.created_at)) }}
                <span v-if="token.expires_at"> · Läuft ab: {{ formatDate(new Date(token.expires_at)) }}</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="removeToken(token.id)"
              />
            </q-item-section>
          </q-item>
          <q-item v-if="!tokens.length">
            <q-item-section class="text-grey">Keine Tokens</q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- App info -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">App-Info</div>
        <div class="q-gutter-xs">
          <div class="row">
            <div class="col-4 text-caption text-grey">Version</div>
            <div class="col">1.0.0</div>
          </div>
          <div class="row">
            <div class="col-4 text-caption text-grey">API-URL</div>
            <div class="col text-caption">{{ apiBaseUrl || '(nicht gesetzt)' }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Logout -->
    <q-btn
      color="negative"
      outline
      class="full-width"
      icon="logout"
      label="Abmelden"
      @click="handleLogout"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { useSync } from '../composables/useSync';
import { listTokens, deleteToken } from '../api/auth';
import type { TokenInfo } from '../api/auth';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { isOnline, isSyncing, pendingCount, lastSyncAt, triggerSync } = useSync();

const user = computed(() => authStore.user);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

const tokens = ref<TokenInfo[]>([]);
const isLoadingTokens = ref(false);

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function loadTokens() {
  isLoadingTokens.value = true;
  try {
    const res = await listTokens();
    if (res.success && res.tokens) {
      tokens.value = res.tokens;
    }
  } catch {
    // Ignore – offline
  } finally {
    isLoadingTokens.value = false;
  }
}

async function removeToken(tokenId: number) {
  $q.dialog({
    title: 'Token löschen',
    message: 'Soll dieser API-Token wirklich gelöscht werden?',
    cancel: true,
    ok: { label: 'Löschen', color: 'negative' },
  }).onOk(async () => {
    try {
      const res = await deleteToken(tokenId);
      if (res.success) {
        tokens.value = tokens.value.filter((t) => t.id !== tokenId);
        $q.notify({ type: 'positive', message: 'Token gelöscht' });
      }
    } catch {
      $q.notify({ type: 'negative', message: 'Token konnte nicht gelöscht werden' });
    }
  });
}

async function handleLogout() {
  await authStore.logout();
  await router.push({ name: 'login' });
}

onMounted(() => {
  void loadTokens();
});
</script>
