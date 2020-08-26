<template>
	<div class="media-content"> 
		<div v-for="stream in streams" :key="stream.id">
			<audio v-if="stream.type === 'audio'" class="rtc-audio" autoplay ref="play"></audio>
			<video v-else ref="play" class="rtc-video" controls autoplay></video>
			<i></i>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		streams: Array,
	},
	watch: {
		async streams(streams) {
			streams.forEach(it => {
				it.type = it.getTracks()[0].kind
			})
			await new Promise(this.$nextTick)
			const play = this.$refs.play

			if (play) {
				play.forEach((it, index) => (it.srcObject = this.streams[index]))
			}
		},
	},
}
</script>

<style>
.rtc-audio {
	/* width: 0;
	opacity: 0;
	height: 0; */
}
.media-content{
	display: grid;
	column-gap: 15px;
	grid-template-columns: repeat(auto-fill, 100px);
	width: 100%;
	padding: 10px
}
.rtc-video {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	object-fit: cover;
	position: relative;

	object-position: center center;
}
</style>
