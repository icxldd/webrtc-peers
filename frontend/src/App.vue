<template>
	<div :class="['web-rtc', { 'rtc-mobile': isMobile }]">
		<Rooms @create-room="start" @call="call"></Rooms>
		<transition name="play">
			<div class="play">
				<nav v-if="isMobile">
					<!-- <div class="back" @click="isShowVideo = false">&lt; 返回房间</div> -->
					<div class="back" @click="isShowChat = !isShowChat">&#8593; 聊天</div>
				</nav>
				<videos :streams="streams"> </videos>
				<div class="self-btns">
					<i
						class="iconfont icon-mic"
						:class="{ active: slefVideoBtnStatus.audio }"
						@click="selfMediaStatusChange('audio')"
					></i>
					<i
						class="iconfont icon-video"
						:class="{ active: slefVideoBtnStatus.video }"
						@click="selfMediaStatusChange('video')"
					></i>
					<i
						class="iconfont icon-desktopshare"
						:class="{ active: slefVideoBtnStatus.desktopShare }"
						@click="selfMediaStatusChange('desktopShare')"
					></i>
					<i
						class="iconfont icon-camera-switch"
						:class="{ active: slefVideoBtnStatus.cameraSwitch }"
						@click="selfMediaStatusChange('cameraSwitch')"
					></i>
				</div>
			</div>
		</transition>
		<transition name="chat">
			<div class="chat" v-if="peersLength && (isShowChat || !isMobile)">
				<nav v-if="isMobile">
					<div class="back" @click="isShowChat = false">&#8595; 聊天</div>
				</nav>
				<ul class="content" ref="chat">
					<li
						:class="{ 'is-self': val.isSelf }"
						v-for="(val, index) in chats"
						:key="index"
					>
						<div class="user">{{ val.isSelf ? '我' : val.user }}</div>
						<div class="msg-content">
							<span
								class="msg"
								v-html="val.msg"
								v-if="val.type === 'text'"
							></span>
							<video
								v-else-if="val.type === 'video'"
								class="chat-video"
								:hash="val.hash"
								controls
							></video>
							<div v-else class="chat-file">
								<i class="v-icon-document file-icon"></i>
								<span class="file-name">{{ val.fileName }}</span>
								<v-progress
									v-if="val.percent !== 1"
									:percentage="+(val.percent * 100).toFixed(2)"
									color="#8e71c7"
								></v-progress>
								<v-progress
									v-else
									:percentage="100"
									color="#8e71c7"
									status="success"
								></v-progress>
							</div>
						</div>
					</li>
				</ul>
				<div class="edit-content">
					<img src="~assets/folder.svg" class="file" alt="选取文件" />
					<input
						type="file"
						class="input-file"
						@change="fileChange($event.target)"
					/>
					<div
						class="chat-area"
						ref="edit"
						contenteditable="true"
						@drop.stop.prevent="drop"
					></div>
					<div class="button-div">
						<button @click="send">发送</button>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

<script>
import Rooms from '@/views/rooms'
import RTCManager from '@/views/rtc-manager'
import { isMobile, fileReader, fileLoad } from '@/tools'
import Videos from '@/views/videos'
import SelfVideoBtns from '@/views/self-video-btns'
import socket from '@/socket'

import EditorMessageManager from '@/plugins/editor-message-manager'
const editorMessageManager = new EditorMessageManager()
const rtcManager = new RTCManager()

window.rtcManager = rtcManager
export default {
	components: {
		Rooms,
		Videos,
		SelfVideoBtns
	},
	data() {
		return {
			streams: [],
			/**
			 * {pendingSize, size,isSelf, user,fileName}
			 */
			chats: [],
			isShowChat: false,
			peersLength: 0,
			slefVideoBtnStatus: { audio: false, desktopShare: false, video: false }
		}
	},
	computed: {
		isMobile() {
			return isMobile
		}
	},

	methods: {
		selfMediaStatusChange(type) {
			rtcManager.setSelfMediaStatus({...this.slefVideoBtnStatus, [type]:!this.slefVideoBtnStatus[type]})
		},
		start(data) {
			rtcManager.createRoom(data)
		},

		call(picked) {
			rtcManager.call(picked)
		},


		async drop(e) {
			const file = e.dataTransfer.files[0]
			this.addFile(file)
		},

		async addFile(file) {
			const area = this.$refs.edit
			const type = file.type
			if (type.includes('image')) {
				await editorMessageManager.addImg(file, area)
			} else if (['video/webm', 'video/ogg', 'video/mp4'].includes(type)) {
				await editorMessageManager.addVideo(file, area)
			} else {
				await editorMessageManager.addFile(file, area)
			}
		},

		async fileChange(input) {
			const file = input.files[0]
			await this.addFile(file)
			window.file = file
			input.value = ''
		},

		sendText(text) {
			if (!text) return
			const sendData = {
				msg: text,
				user: socket.id,
				type: 'text'
			}
			rtcManager.dcData.emit('chat', sendData)

			this.getChatText({ ...sendData, isSelf: true })
			const area = document.querySelector('.chat-area')
			area.innerHTML = ''
		},
		async sendFiles(files) {
			files.forEach(it => {
				/*
        *       type: 'file',
        file: it.file,
        fileName,
        hash: it.hash,
        index: index++
        */
				const { file, ...data } = it
				const chatMsg = {
					...it,
					isSelf: true,
					percent: 0,
					total: 0,
					sendSize: 0
				}

				this.chats.push(chatMsg)

				//{pendingSize, size,isSelf, user,fileName}
				rtcManager.dcFile.emit('chat-file', file, {
					...data,
					user: socket.id
				})(e => {
					chatMsg.total = e.total
					chatMsg.sendSize = e.sendSize
					chatMsg.percent = e.percent
				})
				// if (data.type === 'video') {
				//   this.getVideo(it)
				// } else {
				//   this.getChatText({ ...it, isSelf: true })
				// }
			})
		},
		getVideo(it) {
			console.log('getvideo', it)
		},

		send() {
			const area = document.querySelector('.chat-area')
			const { text, files } = editorMessageManager.filter(area)
			this.sendFiles(files)
			this.sendText(text)

			area.innerHTML = ''
		},

		async getFile(data, desc) {
			fileLoad({ data, name: desc.fileName })
			// const chat = this.chats.find(it => it.hash === desc.hash)
			// if (chat.type === 'file') {
			//   return fileLoad({ data: chat.file, name: chat.fileName })
			// } else if (chat.type === 'video') {
			//   await new Promise(this.$nextTick)

			//   const video = document.querySelector(`[hash="${chat.hash}"]`)
			//   video.src = URL.createObjectURL(new Blob([chat.file]))
			// }
		},
		async getChatText(chat) {
			this.chats.push(chat)
			await new Promise(this.$nextTick)
			const ul = this.$refs.chat
			ul.scrollTop = ul.scrollHeight
			// if (chat.msg && chat.msg.includes('hash=')) {
			//   const hash = /hash="(.+?)"/g.exec(chat.msg)[1]
			//   const div = document.querySelector(`[hash="${hash}"]`)
			//   div.onclick = function() {
			//     if (this.hasAttribute('fullscreen')) {
			//       this.removeAttribute('fullscreen')
			//     } else {
			//       this.setAttribute('fullscreen', 'true')
			//     }
			//   }
			// }
		},

		_streamChange(value) {
			window.streams = value
			this.streams = value
		},

		_peersChange(peers) {
			this.peersLength = peers.length
		},
		getChatFileProgress(e) {
			//{pendingSize, size,isSelf, user,fileName}
			let chat = this.chats.find(it => it.hash === e.desc.hash)

			if (!chat) {
				chat = { ...e.desc, percent: e.percent }
				this.chats.push(chat)
			}
			chat.percent = e.percent

			// if (chat.type === 'file') {
			//   return fileLoad({ data: chat.file, name: chat.fileName })
			// } else if (chat.type === 'video') {
			//   await new Promise(this.$nextTick)

			//   const video = document.querySelector(`[hash="${chat.hash}"]`)
			//   video.src = URL.createObjectURL(new Blob([chat.file]))
			// }
		}
	},
	created() {
		rtcManager
			.on('streams', this._streamChange)

			// .on('chat-img', this.getImg)
			// .on('chat-img:progress', this.getChatFileProgress)
			// .on('chat:progress', this._getchatprogress)
			.on('peers:change', this._peersChange)

		rtcManager.dcData.on('chat', this.getChatText)
		rtcManager.dcFile.on('chat-file', this.getFile)
		rtcManager.dcFile.on('chat-file:progress', this.getChatFileProgress)
	}
}
</script>

<style lang="scss">
.web-rtc.rtc-mobile {
	grid-template-columns: 1fr;
	padding: 20px;
	.chat-enter {
		transform: translateY(100%);
	}
	.chat-enter-to {
		transform: translateY(0);
	}
	.chat-leave {
		transform: translateY(0);
	}
	.chat-leave-to {
		transform: translateY(100%);
	}
	.chat {
		position: fixed;
		top: 0;
		right: 0;
		left: 0;
		bottom: 0;
		background: #fff;
		display: flex;
		flex-direction: column;
		padding: 20px;
		transition: all 0.3s;

		nav {
			display: flex;
			justify-content: flex-end;
			margin-bottom: 10px;
		}
		.content {
			min-height: 200px;
			height: auto;
			flex: 3 1 200px;
		}
		.edit-content {
			flex: 1;
		}
	}
	.play-enter,
	.play-leave-to {
		transform: translateX(100%);
	}
	.play-enter-to,
	.play-leave {
		transform: translateX(0);
	}
	div.play {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		transition: all 0.3s;
		padding: 20px;

		.back {
			margin-bottom: 10px;
			color: #666;
		}
	}
}

.web-rtc {
	max-width: 1553px;
	margin: 0 auto;
	.chat {
		grid-column: 3/4;
		display: flex;
		flex-direction: column;
		img {
			width: 200px;
		}
		.chat-img-div {
			width: 100px;
			&[fullscreen] {
				background: #000;
				left: 0;
				top: 0;
				bottom: 0;
				right: 0;
				width: 100%;
				position: fixed;
				z-index: 100;
				display: flex;
				flex-direction: column;
				justify-content: center;
			}
		}
		.chat-img {
			width: 100%;
		}
		.file-icon {
			font-size: 50px;
			color: grey;
		}
		.file {
			width: 25px;
			opacity: 0.8;
			margin-left: 10px;
		}
		.chat-file {
			text-align: left;
			min-width: 160px;
		}
		.input-file {
			opacity: 1;
			position: absolute;
			width: 30px;
			opacity: 0;
			left: 4px;
		}
		.chat-area {
			width: 100%;
			height: calc(100% - 80px);
			outline: none;
			border: none;
			box-sizing: border-box;
			resize: none;
			padding: 5px;
			color: #333;
			overflow: auto;
			word-break: break-all;
		}

		.edit-content {
			border: 1px solid #ccc;
			border-top: none;
			position: relative;
			flex: 0.5 1 200px;
			max-height: 250px;
			.button-div {
				text-align: right;
				padding: 5px;
			}
			button {
				border: none;
				outline: none;
				background: #67c23a;
				padding: 5px 20px;
				border-radius: 4px;
				color: #fff;
				cursor: pointer;
			}
		}
		.content {
			flex: 1 1 400px;
			border: 1px solid #ccc;
			padding: 4px 10px;
			overflow: auto;
		}
		.msg-content {
			display: flex;
			justify-content: flex-start;
			margin: 5px 20px 0 30px;
		}
		.file-icon {
			// color: #fff;
		}
		.msg {
			background: #f56730;
			color: #fff;
			padding: 4px 6px;
			border-radius: 5px;
			word-break: break-all;
		}
		.user {
			color: #999;
			font-size: 12px;
		}
		li {
			margin-bottom: 20px;
			&.is-self {
				text-align: right;
				.msg-content {
					justify-content: flex-end;
				}
			}
		}
	}
	padding: 40px;
	display: grid;
	grid-template-columns: 200px 4fr 400px;
	grid-gap: 0 10px;
	.play {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		min-width: 460px;
		border: 1px solid #ccc;
		.self-btns {
			position: absolute;
			bottom: 0;
			width: 100%;
			height: 36px;
		}
		nav {
			display: flex;
			justify-content: space-between;
			width: 100%;
		}
		.rtc-video {
			background: #000;
			margin: 5px;
			position: relative;
			width: 320px;
		}
	}

	.rtc-room {
		height: calc(100vh - 90px);
	}
}
</style>
