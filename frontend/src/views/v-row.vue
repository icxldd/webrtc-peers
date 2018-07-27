<template>
  <div class="v-row">
    <span class="left">
      <slot name="left"></slot>
    </span>
    <span class="right">
      <slot name="right"></slot>
    </span>
  </div>
</template>
<script>
</script>
<style lang="scss" >
.v-row {
  display: grid;
  grid-auto-columns: 1fr 4fr;
  align-items: center;
  .right {
    grid-area: 1 / 2;
  }
}
</style>
