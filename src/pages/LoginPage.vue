<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card
      class="login-card shadow-8"
      style="min-width: 320px; max-width: 420px; width: 100%"
    >
      <q-card-section class="bg-primary text-white text-center q-pa-lg">
        <q-icon
          name="speed"
          size="64px"
          class="q-mb-sm"
        />
        <div class="text-h5 text-weight-bold">DK-Control</div>
        <div class="text-caption opacity-80">Facility Management PWA</div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-form
          class="q-gutter-md"
          @submit.prevent="handleLogin"
        >
          <q-input
            v-model="form.username"
            label="Benutzername"
            outlined
            :rules="[(v) => !!v || 'Benutzername erforderlich']"
            autocomplete="username"
            prepend-icon="person"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Passwort"
            outlined
            :type="showPassword ? 'text' : 'password'"
            :rules="[(v) => !!v || 'Passwort erforderlich']"
            autocomplete="current-password"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div
            v-if="authStore.loginError"
            class="text-negative text-caption"
          >
            <q-icon name="error" /> {{ authStore.loginError }}
          </div>

          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            size="lg"
            :loading="authStore.isLoading"
            label="Anmelden"
            icon="login"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center text-caption text-grey q-pt-none">
        DK-Control PWA v1.0
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({ username: '', password: '' });
const showPassword = ref(false);

async function handleLogin() {
  const ok = await authStore.login(form.value.username, form.value.password);
  if (ok) {
    const redirect = (route.query['redirect'] as string) ?? '/dashboard';
    await router.push(redirect);
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 12px;
}
</style>
