<template>
  <div :class="['v-input', {error}]">
    <input
      v-bind="$attrs"
      :value="value"
      @input="e => $emit('input', e.target.value)"
      @focus="$emit('update:error', '')"
      :class="{error}"
    />
    <span class="err-tips">{{error}}</span>
  </div>
</template>
<script>
export default {
  props: {
    error: String,
    value: String
  }
}
</script>

<style lang="scss" >
.v-input {
  position: relative;
  box-sizing: border-box;
  input {
    width: 100%;
    height: 40px;
    padding: 0 20px 0 15px;
    box-sizing: border-box;
    border-radius: 4px;
    outline: none;
    border: 1px solid #ccc;
    &:focus {
      border: 1px solid rgb(64, 158, 255);
    }
    &.error {
      border: 1px solid rgb(245, 108, 108);
    }
  }
  .err-tips {
    position: absolute;
    left: 0;
    bottom: -20px;
    color: rgb(245, 108, 108);
    display: block;
    height: 20px;
    font-size: 12px;
    line-height: 20px;
  }
}
</style>

