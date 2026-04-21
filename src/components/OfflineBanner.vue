<template>
  <q-banner
    v-if="!isOnline"
    class="bg-negative text-white q-mb-sm"
    dense
    rounded
  >
    <template #avatar>
      <q-icon name="cloud_off" />
    </template>
    <span class="text-caption">
      Offline – Änderungen werden lokal gespeichert
      <span v-if="pendingCount > 0">({{ pendingCount }} ausstehend)</span>
    </span>
    <template #action>
      <q-btn
        v-if="canSync"
        flat
        dense
        label="Sync"
        icon="sync"
        @click="triggerSync"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { useSync } from '../composables/useSync';

const { isOnline, pendingCount, canSync, triggerSync } = useSync();
</script>
