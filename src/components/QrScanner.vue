<template>
  <div class="qr-scanner">
    <div
      v-if="!scanning"
      class="text-center q-pa-md"
    >
      <q-btn
        color="primary"
        icon="qr_code_scanner"
        label="QR-Code scannen"
        @click="startScanning"
      />
    </div>

    <div
      v-if="scanning"
      class="scanner-container"
    >
      <video
        ref="videoEl"
        class="scanner-video"
        playsinline
        autoplay
        muted
      />
      <canvas
        ref="canvasEl"
        class="scanner-canvas"
        style="display: none"
      />
      <q-btn
        round
        flat
        icon="close"
        class="scanner-close"
        color="white"
        @click="stopScanning"
      />
      <div class="scanner-overlay">
        <div class="scanner-frame" />
      </div>
    </div>

    <div
      v-if="error"
      class="text-negative text-caption q-pa-sm"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const emit = defineEmits<{
  (e: 'scanned', code: string): void;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const scanning = ref(false);
const error = ref<string | null>(null);

let stream: MediaStream | null = null;
let animFrameId: number | null = null;

async function startScanning() {
  error.value = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    scanning.value = true;
    // Wait for next tick so video element is mounted
    requestAnimationFrame(() => {
      if (videoEl.value && stream) {
        videoEl.value.srcObject = stream;
        void videoEl.value.play();
        scheduleFrame();
      }
    });
  } catch (err) {
    error.value = 'Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen.';
    console.error(err);
  }
}

function stopScanning() {
  scanning.value = false;
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

function scheduleFrame() {
  animFrameId = requestAnimationFrame(processFrame);
}

function processFrame() {
  const video = videoEl.value;
  const canvas = canvasEl.value;
  if (!video || !canvas || !scanning.value) return;

  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    scheduleFrame();
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Use BarcodeDetector API if available
  if ('BarcodeDetector' in window) {
    const detector = new (window as unknown as { BarcodeDetector: { new(opts: object): { detect(img: ImageData): Promise<{ rawValue: string }[]> } } }).BarcodeDetector({ formats: ['qr_code'] });
    detector.detect(imageData).then((codes) => {
      if (codes.length > 0 && codes[0]) {
        const code = codes[0].rawValue;
        stopScanning();
        emit('scanned', code);
      } else {
        scheduleFrame();
      }
    }).catch(() => scheduleFrame());
  } else {
    // Fallback: just stop and show message
    error.value = 'QR-Code-Erkennung wird von diesem Browser nicht unterstützt.';
    stopScanning();
  }
}

onUnmounted(() => {
  stopScanning();
});
</script>

<style scoped>
.scanner-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-video {
  width: 100%;
  display: block;
}

.scanner-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-frame {
  width: 200px;
  height: 200px;
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}
</style>
