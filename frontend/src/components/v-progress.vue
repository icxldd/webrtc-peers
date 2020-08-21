<template>
  <div class="v-progress">
    <div class="bar">
      <div class="complete" :style="{width: percentage+'%'}"> </div>
    </div>
    <div class="progress-text">{{ percentage.toFixed(2) }}%</div>
  </div>
</template>

<script>
export default {
  props: {
    percentage: Number
  }
}
</script>

<style lang="scss" scoped>
.v-progress {
  display: flex;
  align-items: center;
  .bar {
    flex: 1 1 auto;
    height: 6px;
    background: #ebeef5;
    position: relative;
  
    .complete{
      position: absolute;
      left:0;
      top: 0;
      bottom: 0;
      background: #409eff;
      border-radius: 3px;
    }
  }

  .progress-text {
    flex: 0 0 auto;
    color: #606266;
    margin-left: 8px;
  }
}
</style>
