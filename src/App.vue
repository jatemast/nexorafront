<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <div id="nexora-app">
    <!-- Router View with Transition Animations -->
    <RouterView v-slot="{ Component, route }">
      <Transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
      >
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>

    <!-- PrimeVue Global Components -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<style>
/* =============================================
   Page Transition Animations
   ============================================= */

/* Fade (default) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide Up (for modals / sheets) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Scale (for dialogs / modals) */
.scale-enter-active,
.scale-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* PrimeVue Toast Customization */
.p-toast {
  z-index: 9999 !important;
}

.p-toast .p-toast-message {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.06) !important;
}

/* PrimeVue ConfirmDialog Customization */
.p-confirm-dialog {
  border-radius: 16px !important;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15),
    0 15px 20px -12px rgba(0, 0, 0, 0.1) !important;
}
</style>
