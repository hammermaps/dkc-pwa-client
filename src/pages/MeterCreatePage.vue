<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        @click="$router.back()"
      />
      <div class="col q-ml-sm text-h6">Neuen Zähler anlegen</div>
    </div>

    <q-card>
      <q-card-section>
        <q-banner
          class="bg-info text-white q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="info" />
          </template>
          Das Anlegen neuer Zähler ist derzeit nur im Backend-Administrationssystem möglich.
          Bitte wenden Sie sich an den Administrator.
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Zurück"
          @click="$router.back()"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
// Placeholder – meter creation via API not yet supported
</script>
