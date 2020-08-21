<template>
	<ul class="content" ref="chat">
		<i-viewer :images="images" class="images">
			<li :class="{ 'is-self': val.isSelf }" v-for="(val, index) in chats" :key="index">
				<div class="user">{{ val.isSelf ? '我' : val.user }}</div>
				<div class="msg-content">
					<span class="text" v-html="val.msg" v-if="val.type === 'text'"></span>

					<video
						v-else-if="val.type === 'video'"
						class="chat-video"
						:hash="val.hash"
						:src="val.file"
						controls
					></video>
					<img v-else-if="val.type === 'img'" class="img" :src="val.file" />
					<div v-else class="chat-file">
						<i class="icon-file iconfont file-icon"></i>
						<span class="file-name">{{ val.fileName }}</span>
						<v-progress
							v-if="val.percent !== 1"
							:percentage="+(val.percent * 100).toFixed(2)"
							color="#8e71c7"
						></v-progress>
						<v-progress v-else :percentage="100" color="#8e71c7" status="success"></v-progress>
					</div>
				</div>
			</li>
		</i-viewer>
	</ul>
</template>

<script>
import IViewer from 'v-viewer/src/component'
import 'viewerjs/dist/viewer.css'
export default {
	components: { IViewer },
	props: { chats: Array, isMobile: Boolean },
	computed: {
		images() {
			let arr = []
			for (let i = 0; i < this.chats.length; i++) {
				if (this.chats[i].type === 'img') {
					arr.push(this.chats[i].file)
				}
			}
			return arr
		},
	},
}
</script>

<style></style>
