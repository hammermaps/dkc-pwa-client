<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Dashboard</div>

    <div
      v-if="isLoading"
      class="flex flex-center q-pa-xl"
    >
      <q-spinner
        color="primary"
        size="48px"
      />
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="row q-gutter-md">
        <!-- MM Card -->
        <div
          v-if="data?.mm"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card class="dashboard-card">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h4 text-primary">{{ data.mm.pending }}</div>
                  <div class="text-caption text-grey">Offene Mängelmeldungen</div>
                </div>
                <div class="col-auto">
                  <q-icon name="warning" size="40px" color="warning" />
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="text-caption text-grey">
              Gesamt: {{ data.mm.total }} | Erledigt: {{ data.mm.completed }}
            </q-card-section>
          </q-card>
        </div>

        <!-- NEA Card -->
        <div
          v-if="data?.nea"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card class="dashboard-card">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h4 text-primary">{{ data.nea.total_systems }}</div>
                  <div class="text-caption text-grey">NEA-Anlagen</div>
                </div>
                <div class="col-auto">
                  <q-icon name="bolt" size="40px" color="primary" />
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="text-caption text-grey">
              Prüfungen diesen Monat: {{ data.nea.inspections_this_month }}
            </q-card-section>
          </q-card>
        </div>

        <!-- Building Card -->
        <div
          v-if="data?.building"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card class="dashboard-card">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h4 text-primary">{{ data.building.open }}</div>
                  <div class="text-caption text-grey">Offene Begehungen</div>
                </div>
                <div class="col-auto">
                  <q-icon name="business" size="40px" color="secondary" />
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="text-caption text-grey">
              In Bearbeitung: {{ data.building.in_progress }} | Abgeschlossen: {{ data.building.completed }}
            </q-card-section>
          </q-card>
        </div>

        <!-- Keys Card -->
        <div
          v-if="data?.keys"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card class="dashboard-card">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h4 text-primary">{{ data.keys.currently_issued }}</div>
                  <div class="text-caption text-grey">Ausgegebene Schlüssel</div>
                </div>
                <div class="col-auto">
                  <q-icon name="vpn_key" size="40px" color="accent" />
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="text-caption text-grey">
              Bestand: {{ data.keys.total_inventory }}
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Notifications -->
      <div
        v-if="data?.notifications?.unread"
        class="q-mt-md"
      >
        <q-banner
          class="bg-info text-white"
          rounded
        >
          <template #avatar>
            <q-icon name="notifications" />
          </template>
          {{ data.notifications.unread }} ungelesene Benachrichtigungen
        </q-banner>
      </div>

      <!-- Quick actions -->
      <div class="q-mt-lg">
        <div class="text-h6 q-mb-sm">Schnellzugriff</div>
        <div class="row q-gutter-sm">
          <q-btn
            outline
            color="primary"
            icon="speed"
            label="Zähler erfassen"
            :to="{ name: 'meter-list' }"
          />
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDashboard } from '../api/dashboard';
import type { DashboardResponse } from '../api/dashboard';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const data = ref<DashboardResponse | null>(null);
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    const res = await getDashboard(authStore.activeProjectId ?? undefined);
    if (res.success) {
      data.value = res;
    }
  } catch {
    // Silently fail – offline dashboard still shows cached modules
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.dashboard-card {
  border-radius: 8px;
  transition: box-shadow 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>
