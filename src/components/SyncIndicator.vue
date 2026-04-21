<template>
  <div class="sync-indicator row items-center q-gutter-xs">
    <q-spinner
      v-if="isSyncing"
      color="primary"
      size="xs"
    />
    <q-icon
      v-else-if="pendingCount > 0 && isOnline"
      name="sync"
      color="warning"
      size="xs"
    />
    <q-icon
      v-else-if="pendingCount > 0 && !isOnline"
      name="cloud_off"
      color="negative"
      size="xs"
    />
    <q-icon
      v-else-if="lastSyncAt"
      name="cloud_done"
      color="positive"
      size="xs"
    />
    <span
      v-if="pendingCount > 0"
      class="text-caption"
    >{{ pendingCount }}</span>
    <q-tooltip v-if="lastSyncAt">
      Zuletzt synchronisiert: {{ formatDate(lastSyncAt) }}
    </q-tooltip>
    <q-tooltip v-else-if="pendingCount > 0">
      {{ pendingCount }} Ablesungen nicht synchronisiert
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useSync } from '../composables/useSync';

const { isOnline, isSyncing, pendingCount, lastSyncAt } = useSync();

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
</script>
