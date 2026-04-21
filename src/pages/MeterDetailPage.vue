<template>
  <q-page class="q-pa-md">
    <div
      v-if="!meter"
      class="flex flex-center q-pa-xl"
    >
      <q-spinner
        color="primary"
        size="48px"
      />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-btn
          flat
          round
          icon="arrow_back"
          @click="$router.back()"
        />
        <div class="col q-ml-sm">
          <div class="text-h6">{{ meter.name }}</div>
          <div class="text-caption text-grey">{{ meter.location }}</div>
        </div>
        <q-btn
          round
          flat
          icon="edit"
          :to="{ name: 'meter-edit', params: { id: meter.id } }"
        >
          <q-tooltip>Bearbeiten</q-tooltip>
        </q-btn>
        <q-btn
          round
          flat
          :icon="meter.active ? 'pause_circle' : 'play_circle'"
          :color="meter.active ? 'warning' : 'positive'"
          @click="toggleActive"
        >
          <q-tooltip>{{ meter.active ? 'Deaktivieren' : 'Aktivieren' }}</q-tooltip>
        </q-btn>
      </div>

      <!-- Meter info -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row q-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey">Typ</div>
              <div>{{ meter.type }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">Einheit</div>
              <div>{{ meter.unit }}</div>
            </div>
            <div
              v-if="meter.serial_number"
              class="col-6"
            >
              <div class="text-caption text-grey">Seriennummer</div>
              <div>{{ meter.serial_number }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">Status</div>
              <q-badge :color="meter.active ? 'positive' : 'grey'">
                {{ meter.active ? 'Aktiv' : 'Inaktiv' }}
              </q-badge>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Last reading -->
      <q-card
        v-if="meter.last_reading !== undefined"
        class="q-mb-md"
      >
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Letzter Zählerstand</div>
          <div class="text-h4 text-primary">
            {{ meter.last_reading }} <span class="text-h6">{{ meter.unit }}</span>
          </div>
          <div
            v-if="meter.last_reading_date"
            class="text-caption text-grey"
          >
            {{ formatDate(meter.last_reading_date) }}
          </div>
        </q-card-section>
      </q-card>

      <!-- New reading button -->
      <q-btn
        color="primary"
        class="full-width q-mb-md"
        icon="add"
        label="Neue Ablesung"
        @click="showReadingForm = true"
      />

      <!-- Readings history -->
      <div class="text-subtitle2 q-mb-sm">Ablesungshistorie</div>

      <div
        v-if="meterStore.isLoading"
        class="q-gutter-sm"
      >
        <q-skeleton
          v-for="i in 3"
          :key="i"
          type="rect"
          height="56px"
          class="rounded-borders"
        />
      </div>

      <q-list
        v-else
        bordered
        separator
        class="rounded-borders"
      >
        <q-item
          v-for="reading in meterStore.currentReadings"
          :key="reading.id"
        >
          <q-item-section>
            <q-item-label>
              <span class="text-weight-medium">{{ reading.value }} {{ meter.unit }}</span>
            </q-item-label>
            <q-item-label caption>{{ formatDate(reading.date) }}</q-item-label>
          </q-item-section>
          <q-item-section
            v-if="reading.notes"
            side
          >
            <q-icon
              name="notes"
              size="xs"
              color="grey"
            >
              <q-tooltip>{{ reading.notes }}</q-tooltip>
            </q-icon>
          </q-item-section>
          <q-item-section
            v-if="reading.image_path"
            side
          >
            <q-icon
              name="photo"
              size="xs"
              color="grey"
            />
          </q-item-section>
        </q-item>

        <q-item v-if="!meterStore.isLoading && !meterStore.currentReadings.length">
          <q-item-section class="text-center text-grey q-pa-md">
            Noch keine Ablesungen vorhanden
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- New reading dialog -->
    <q-dialog
      v-model="showReadingForm"
      persistent
    >
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Neue Ablesung</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model.number="readingForm.value"
            label="Zählerstand *"
            type="number"
            outlined
            :suffix="meter?.unit"
            :rules="[(v) => v !== null && v !== undefined && v !== '' || 'Wert erforderlich']"
          />
          <q-input
            v-model="readingForm.date"
            label="Datum *"
            outlined
            type="date"
            :rules="[(v) => !!v || 'Datum erforderlich']"
          />
          <q-input
            v-model="readingForm.notes"
            label="Notiz"
            outlined
            type="textarea"
            rows="2"
          />
          <ImageUpload
            label="Foto aufnehmen (optional)"
            @update:blob="readingForm.imageBlob = $event"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Abbrechen"
            @click="showReadingForm = false"
          />
          <q-btn
            color="primary"
            label="Speichern"
            :loading="isSaving"
            @click="saveReading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useMeterStore } from '../stores/meters';
import ImageUpload from '../components/ImageUpload.vue';

const props = defineProps<{ id: number }>();

const $q = useQuasar();
const meterStore = useMeterStore();

const showReadingForm = ref(false);
const isSaving = ref(false);
const readingForm = ref({
  value: null as number | null,
  date: new Date().toISOString().split('T')[0],
  notes: '',
  imageBlob: null as Blob | null,
});

const meter = computed(() => meterStore.meters.find((m) => m.id === props.id) ?? null);

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('de', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

async function saveReading() {
  if (readingForm.value.value === null || !readingForm.value.date) return;

  isSaving.value = true;
  try {
    const ok = await meterStore.addReading(
      {
        meter_id: props.id,
        value: readingForm.value.value,
        date: readingForm.value.date,
        notes: readingForm.value.notes || undefined,
      },
      readingForm.value.imageBlob,
    );

    if (ok) {
      showReadingForm.value = false;
      readingForm.value = {
        value: null,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        imageBlob: null,
      };
      $q.notify({ type: 'positive', message: 'Ablesung gespeichert' });
    } else {
      $q.notify({ type: 'negative', message: meterStore.error ?? 'Fehler beim Speichern' });
    }
  } finally {
    isSaving.value = false;
  }
}

async function toggleActive() {
  if (!meter.value) return;
  const ok = await meterStore.toggleMeterActive(meter.value.id, !meter.value.active);
  if (ok) {
    $q.notify({
      type: 'positive',
      message: meter.value.active ? 'Zähler deaktiviert' : 'Zähler aktiviert',
    });
  }
}

onMounted(async () => {
  await meterStore.loadReadings(props.id);
});
</script>
