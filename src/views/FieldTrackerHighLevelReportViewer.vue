<script setup lang="ts">
  import TopNavBar from '@/components/TopNavBar.vue';
  import { ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  const reportUrl = ref(
    'https://dundas.cpbuildbi.net/CPBuildBI/Dashboard/d2b2f461-e277-41fd-9016-9cfd2dc2f4a2?e=false&vo=viewonly'
  );
  const router = useRouter();
  const route = useRoute();

  const projectViewerRoute = `/field-tracker/project-viewer/${route.params.id}/edit`;

  const closeReport = () => {
    router.push({
      name: 'field-tracker-project-viewer',
      params: { id: route.params.id, mode: 'edit' },
    });
  };
</script>

<template>
  <div class="entire-report">
    <div class="top-nav-bar">
      <TopNavBar />
    </div>

    <div class="report-container">
      <!-- Tool Header -->
      <div class="header-body container-fluid">
        <div class="row">
          <div class="col-lg-8 col-md-8 col-sm-12 col-12">
            <span class="breadcrumb-nav">
              <router-link to="/field-tracker" class="breadcrumb-link">Field Tracker</router-link> /
              <router-link :to="projectViewerRoute" class="breadcrumb-link"
                >Project Viewer</router-link
              >
              / High Level Report</span
            >
          </div>
          <div
            class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
          >
            <button class="btn-close-ft-project link-type-button" @click="closeReport">
              Close Report<i class="bi-x-circle" />
            </button>
          </div>
        </div>
      </div>
      <hr />

      <iframe :src="reportUrl" width="100%" height="600px" frameborder="0">
        Your browser does not support iframes.
      </iframe>
    </div>
  </div>
</template>

<style scoped>
  .entire-report {
    display: flex;
    flex-direction: column;
    height: 100vh; /* Ensure full height */
    background-color: white;
  }

  .top-nav-bar {
    flex-shrink: 0; /* Prevent the nav bar from shrinking */
  }

  .report-container {
    flex-grow: 1; /* Allow the report container to take up remaining space */
    display: flex;
    flex-direction: column;
  }

  .header-body {
    width: 100%;
    padding: 10px 30px;
    min-width: 350px;
  }

  .iframe-container {
    flex-grow: 1; /* Allow the iframe container to grow */
  }

  iframe {
    width: 100%;
    height: 100%;
    padding: 30px;
  }

  .breadcrumb-nav {
    font-size: 16px;
    color: #3c3c3c;
    font-weight: 200;
  }

  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }

  hr {
    margin: 7px 30px;
    color: #7a7a7a;
  }

  i {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .bi-x-circle {
    margin-left: 5px;
  }

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }
</style>
