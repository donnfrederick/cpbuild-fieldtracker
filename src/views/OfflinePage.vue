<script setup lang="ts">
  const tryReconnect = () => {
    window.location.reload(); // Navigate to dashboard
  };
</script>

<template>
  <div class="top-nav-bar">
    <TopNavBar />
  </div>

  <div class="offline-page">
    <h1>You Are Offline</h1>
    <p>Please check your internet connection.</p>
    <button @click="tryReconnect">Try Again</button>
  </div>
</template>

<style scoped>
  .offline-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #f8f9fa;
    text-align: center;
  }
  h1 {
    font-size: 2rem;
    color: #333;
  }
  p {
    margin: 10px 0;
    color: #333;
  }
  button {
    padding: 10px 20px;
    background-color: #2c7be5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
