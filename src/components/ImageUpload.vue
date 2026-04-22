<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      :capture="capture"
      class="hidden"
      @change="onFileChange"
    />

    <div
      v-if="previewUrl"
      class="relative-position"
    >
      <q-img
        :src="previewUrl"
        class="rounded-borders"
        style="max-height: 200px; width: 100%"
        fit="contain"
      />
      <q-btn
        round
        dense
        flat
        icon="close"
        class="absolute-top-right"
        color="negative"
        @click="removeImage"
      />
    </div>

    <q-btn
      v-else
      outline
      color="primary"
      icon="camera_alt"
      :label="label"
      @click="openFilePicker"
    />

    <div
      v-if="error"
      class="text-negative text-caption q-mt-xs"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    capture?: 'environment' | 'user' | boolean;
    maxSizeMb?: number;
  }>(),
  {
    label: 'Foto aufnehmen',
    capture: 'environment',
    maxSizeMb: 5,
  },
);

const emit = defineEmits<{
  (e: 'update:blob', blob: Blob | null): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const error = ref<string | null>(null);

function openFilePicker() {
  fileInput.value?.click();
}

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  error.value = null;

  if (!file) return;

  if (file.size > props.maxSizeMb * 1024 * 1024) {
    error.value = `Bild zu groß (max. ${props.maxSizeMb} MB)`;
    return;
  }

  // Revoke previous object URL before creating a new one to prevent memory leaks
  revokePreview();
  previewUrl.value = URL.createObjectURL(file);
  emit('update:blob', file);
}

function removeImage() {
  revokePreview();
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  emit('update:blob', null);
}

onUnmounted(() => {
  revokePreview();
});
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
