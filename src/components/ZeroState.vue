<template>
  <div class="zero-state">
    <i class="bi-layout-text-window-reverse"></i>
    <h3>No Tool Selected</h3>
    <span>Choose a tool from the left side menu to get started</span>
  </div>
</template>

<style scoped>
  .zero-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    gap: 1rem;
    color: #a7a7a7;
  }

  i {
    font-size: 5rem;
    color: #b3e7ea;
  }
</style>
