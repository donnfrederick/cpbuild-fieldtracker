<script setup lang="ts">
  import { onMounted, nextTick, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useAuthStore } from '../stores/useAuthStore';
  import { useNetworkStore } from '../stores/useNetworkStore';
  import { useMaskingStore } from '../stores/useMaskingStore';
  import logo from '../assets/cp-logo-light.png';
  import { Popover } from 'bootstrap';
  import { useRoute } from 'vue-router';

  const authStore = useAuthStore();
  const networkStore = useNetworkStore();
  const route = useRoute();
  const { isOffline } = storeToRefs(networkStore); // ✅ use storeToRefs to keep reactivity

  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);

  const offlineInfoMessage =
    'Some features may be unavailable. Reconnect and reload the page to resume full functionality.';

  function initOfflinePopover() {
    nextTick(() => {
      const icon = document.querySelector('[data-bs-toggle="popover"]');
      if (icon) {
        const existing = Popover.getInstance(icon);
        if (existing) existing.dispose();
        new Popover(icon);
      }
    });
  }

  onMounted(() => {
    initOfflinePopover();

    if (!maskingStore.allowedRoutes.includes(route?.name as string)) {
      maskingStore.stopMasking();
    }
  });

  watch(
    () => isOffline.value,
    (newVal) => {
      if (newVal) {
        initOfflinePopover();
      }
    }
  );
</script>

<template>
  <nav
    :class="[
      'navbar navbar-expand-lg',
      isOffline ? 'navbar-offline' : isMasking ? 'navbar-masking' : 'navbar-dark',
    ]"
  >
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <a class="navbar-brand d-flex align-items-center gap-2">
        <img :src="logo" alt="logo" height="24" class="d-inline-block align-text-top" />
        <span class="dashboard-title d-flex align-items-center gap-2">
          Tools Dashboard

          <span v-if="isOffline" class="text-light small d-flex align-items-center gap-1">
            (Offline Mode
            <i
              class="bi bi-info-circle"
              tabindex="0"
              role="button"
              aria-label="Offline info"
              data-bs-toggle="popover"
              data-bs-trigger="focus"
              data-bs-placement="bottom"
              :data-bs-content="offlineInfoMessage"
            ></i>
            )
          </span>

          <span v-if="isMasking" class="text-light small d-flex align-items-center gap-1">
            (Masking Mode)
          </span>
        </span>
      </a>

      <div id="navbarNavDarkDropdown">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item dropdown">
            <a
              id="navbarDarkDropdownMenuLink"
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-label="User dropdown menu"
              aria-expanded="false"
            >
              {{ authStore.userInfo?.clientPrincipal?.userDetails }}
            </a>
            <ul
              class="dropdown-menu dropdown-menu-dark dropdown-menu-end"
              aria-labelledby="navbarDarkDropdownMenuLink"
            >
              <li>
                <a
                  class="dropdown-item"
                  href="https://cpbuild-bi.atlassian.net/servicedesk/customer/portal/5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  class="dropdown-item"
                  href="/.auth/logout?post_logout_redirect_uri=/.auth/login/aad"
                >
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .dashboard-title {
    color: #ededed;
    font-size: 18px;
  }

  .offline-label {
    font-size: 12px;
    font-weight: 500;
    text-decoration: underline dotted;
    cursor: pointer;
    user-select: none;
  }

  .bi-info-circle {
    cursor: pointer;
    font-size: 0.9em;
  }

  .navbar {
    background-color: #3c3c3c;
    z-index: 11;
    transition: background-color 0.4s ease;
  }

  .navbar-offline {
    background-color: #c62828 !important; /* Vibrant red */
  }

  .navbar-masking {
    background-color: #19a7af !important; /* Teal/cyan */
  }

  #navbarDarkDropdownMenuLink {
    color: #ededed;
  }

  .dropdown-item {
    color: #ededed;
  }

  nav {
    font-size: 18px;
  }

  .nav-item i {
    margin-right: 10px;
    color: #19a7af;
    cursor: pointer;
  }
</style>
