<template>
  <div>
    <!-- Offline indicator: shown whenever the device has no connectivity -->
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
    </q-banner>

    <!-- Pending-sync indicator: shown when back online but queue still has items -->
    <q-banner
      v-else-if="pendingCount > 0"
      class="bg-warning text-dark q-mb-sm"
      dense
      rounded
    >
      <template #avatar>
        <q-icon name="sync_problem" />
      </template>
      <span class="text-caption">
        {{ pendingCount }} ausstehende Ablesung{{ pendingCount !== 1 ? 'en' : '' }} warten auf Synchronisierung
      </span>
      <template #action>
        <q-btn
          v-if="canSync"
          flat
          dense
          label="Jetzt synchronisieren"
          icon="sync"
          :loading="isSyncing"
          @click="triggerSync"
        />
      </template>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { useSync } from '../composables/useSync';

const { isOnline, isSyncing, pendingCount, canSync, triggerSync } = useSync();
</script>
