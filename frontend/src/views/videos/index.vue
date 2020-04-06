<template>
	<div>
		<video src="" autoplay></video>
		<div v-for="(stream, index) in streams" :key="index">
			<video ref="video" class="rtc-video" controls autoplay></video>
			<i></i>
		</div>
	</div>
</template>

<script>
import OnePeerMedia from './one-peer-media'
export default {
	components: {
		OnePeerMedia
	},
	props: {
		streams: Array
	},
	watch: {
		async streams() {
			await new Promise(this.$nextTick)
			const videos = this.$refs.video
			if (videos) {
				videos.forEach(
					(it, index) => (it.srcObject = rtcManager.streams[index])
				)
			}
		}
	}
}
</script>

<style></style>
