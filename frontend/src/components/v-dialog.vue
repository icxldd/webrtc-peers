<template>
  <div class="v-dialog modal">
    <main class="dialog-body v-dialog-body">
      <div class="v-dialog-title">
        <slot name="title"></slot>
      </div>
      <div class="v-dialog-content auto-block">
        <slot name="body"></slot>
      </div>

      <footer class="v-dialog-footer auto-block" v-if="isShowFooter">
        <slot name="footer"></slot>
      </footer>
    </main>
  </div>
</template>

<script>
export default {
  props: {
    isShowFooter: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style lang="scss">
.v-dialog {
  z-index: 1000;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  .v-dialog-body {
    max-height: 90vh;
    box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.8);
  }
  .v-dialog-footer {
    height: 70px;
    display: flex;
    align-items: center;
    border-top: none;
  }
  .v-dialog-content {
    min-height: 50px;
  }
}

.v-dialog-enter {
  opacity: 0;
}
.v-dialog-enter-to {
  animation: opacity-enter 0.3s;
  .v-dialog-body {
    animation: v-dialog-enter 0.32s;
  }
}

.v-dialog-leave-to {
  animation: opacity-leave 0.3s;
  .v-dialog-body {
    animation: v-dialog-leave 0.32s;
  }
}

@keyframes opacity-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes opacity-leave {
  to {
    opacity: 0;
  }
}

@keyframes v-dialog-enter {
  from {
    opacity: 0;
    transform: rotateX(30deg) translateY(-10%);
    transform-origin: top;
  }
}
@keyframes v-dialog-leave {
  to {
    opacity: 0;
    transform: rotateX(30deg) translateY(-10%);
    transform-origin: top;
  }
}
</style>
