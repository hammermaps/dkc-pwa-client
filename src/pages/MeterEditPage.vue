<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        @click="$router.back()"
      />
      <div class="col q-ml-sm text-h6">Zähler bearbeiten</div>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-caption text-grey q-mb-md">
          Zähler-Stammdaten können derzeit nur im Backend-System bearbeitet werden.
          Diese Ansicht zeigt die aktuellen Daten.
        </div>

        <div
          v-if="meter"
          class="q-gutter-md"
        >
          <q-field
            label="Name"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.name }}</div>
            </template>
          </q-field>

          <q-field
            label="Typ"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.type }}</div>
            </template>
          </q-field>

          <q-field
            label="Standort"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.location }}</div>
            </template>
          </q-field>

          <q-field
            label="Einheit"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.unit }}</div>
            </template>
          </q-field>

          <q-field
            v-if="meter.serial_number"
            label="Seriennummer"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.serial_number }}</div>
            </template>
          </q-field>

          <q-field
            v-if="meter.description"
            label="Beschreibung"
            stack-label
            outlined
          >
            <template #control>
              <div class="self-center full-width no-outline">{{ meter.description }}</div>
            </template>
          </q-field>
        </div>

        <div
          v-else
          class="text-grey text-center q-pa-xl"
        >
          Zähler nicht gefunden
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Zurück"
          @click="$router.back()"
        />
        <q-btn
          v-if="meter"
          color="primary"
          label="Neue Ablesung"
          icon="add"
          :to="{ name: 'meter-detail', params: { id: meter.id } }"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMeterStore } from '../stores/meters';

const props = defineProps<{ id: number }>();
const meterStore = useMeterStore();

const meter = computed(() => meterStore.meters.find((m) => m.id === props.id) ?? null);
</script>
