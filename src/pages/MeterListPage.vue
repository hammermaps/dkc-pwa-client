<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col text-h5">Zähler</div>
      <div class="col-auto row q-gutter-sm">
        <q-btn
          round
          flat
          icon="qr_code_scanner"
          color="primary"
          @click="showQrScanner = true"
        >
          <q-tooltip>QR-Code scannen</q-tooltip>
        </q-btn>
        <q-btn
          round
          flat
          icon="refresh"
          color="primary"
          :loading="meterStore.isLoading"
          @click="refresh"
        >
          <q-tooltip>Aktualisieren</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row q-gutter-sm q-mb-md">
      <q-input
        v-model="search"
        dense
        outlined
        placeholder="Suchen..."
        class="col"
        clearable
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-select
        v-model="filterType"
        dense
        outlined
        :options="typeOptions"
        label="Typ"
        clearable
        class="col-auto"
        style="min-width: 120px"
      />
    </div>

    <!-- Error -->
    <q-banner
      v-if="meterStore.error"
      class="bg-negative text-white q-mb-md"
      rounded
    >
      {{ meterStore.error }}
    </q-banner>

    <!-- Loading skeleton -->
    <div
      v-if="meterStore.isLoading && !filteredMeters.length"
      class="q-gutter-sm"
    >
      <q-skeleton
        v-for="i in 5"
        :key="i"
        type="rect"
        height="72px"
        class="rounded-borders"
      />
    </div>

    <!-- Meter list -->
    <q-list
      v-else
      bordered
      separator
      class="rounded-borders"
    >
      <q-item
        v-for="meter in filteredMeters"
        :key="meter.id"
        clickable
        :to="{ name: 'meter-detail', params: { id: meter.id } }"
      >
        <q-item-section avatar>
          <q-avatar
            :color="meter.active ? 'primary' : 'grey'"
            text-color="white"
            icon="speed"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ meter.name }}</q-item-label>
          <q-item-label caption>
            {{ meter.type }} · {{ meter.location }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-right">
            <div
              v-if="meter.last_reading !== undefined"
              class="text-body2 text-weight-medium"
            >
              {{ meter.last_reading }} {{ meter.unit }}
            </div>
            <div
              v-if="meter.last_reading_date"
              class="text-caption text-grey"
            >
              {{ formatDate(meter.last_reading_date) }}
            </div>
          </div>
          <q-badge
            v-if="!meter.active"
            color="grey"
            label="Inaktiv"
          />
        </q-item-section>
      </q-item>

      <q-item v-if="!meterStore.isLoading && filteredMeters.length === 0">
        <q-item-section class="text-center text-grey q-pa-xl">
          <q-icon name="search_off" size="48px" class="q-mb-sm" />
          <div>Keine Zähler gefunden</div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- QR Scanner Dialog -->
    <q-dialog v-model="showQrScanner" full-width>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">QR-Code scannen</div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>
        <q-card-section>
          <QrScanner @scanned="onQrScanned" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMeterStore } from '../stores/meters';
import { useAuthStore } from '../stores/auth';
import QrScanner from '../components/QrScanner.vue';

const router = useRouter();
const meterStore = useMeterStore();
const authStore = useAuthStore();

const search = ref('');
const filterType = ref<string | null>(null);
const showQrScanner = ref(false);

const typeOptions = computed(() => {
  const types = new Set(meterStore.meters.map((m) => m.type).filter(Boolean));
  return Array.from(types);
});

const filteredMeters = computed(() => {
  let result = meterStore.meters;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q),
    );
  }
  if (filterType.value) {
    result = result.filter((m) => m.type === filterType.value);
  }
  return result;
});

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('de').format(new Date(date));
}

function onQrScanned(code: string) {
  showQrScanner.value = false;
  // Try to find meter by QR code
  const meter = meterStore.meters.find((m) => m.qr_code === code);
  if (meter) {
    void router.push({ name: 'meter-detail', params: { id: meter.id } });
  }
}

async function refresh() {
  await meterStore.loadMeters(authStore.activeProjectId ?? undefined);
}

onMounted(() => {
  void refresh();
});
</script>
