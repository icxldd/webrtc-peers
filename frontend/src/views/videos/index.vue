<template>
	<div>
    <video src="" autoplay></video>
		<div v-for="(stream, index) in streams" :key="index">
      
			<video ref="video" class="rtc-video" v-if="stream" :srcObject="stream" controls autoplay></video>
      <i></i>
		</div>
	</div>
</template>

<script>
import OnePeerMedia from './one-peer-media'
export default {
  components:{
    OnePeerMedia
  },
  props:{
    streams: Array,
  }
}
</script>

<style></style>
