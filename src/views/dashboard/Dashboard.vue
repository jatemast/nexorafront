<script setup>
// Bridge file: re-exports the Dashboard page component so the router can
// lazy-load it from the expected path (@/views/dashboard/Dashboard.vue).
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'
</script>

<template>
  <DashboardPage />
</template>
