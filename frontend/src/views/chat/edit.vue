<template>
	<div class="edit-content">
		<img src="~assets/folder.svg" class="file-pick" alt="选取文件" />
		<input type="file" class="input-file" @change="fileChange($event.target)" />
		<div
			class="chat-area"
			ref="edit"
			contenteditable="true"
			@keyup="keyup"
			@keydown="keydown"
			@drop.stop.prevent="drop"
		></div>
		<div class="button-div">
			<button @click="send">发送</button>
		</div>
	</div>
</template>

<script>
import EditorMessageManager from '@/plugins/editor-message-manager'
const editorMessageManager = new EditorMessageManager()
export default {
	methods: {
		keyup(e) {
			if (e.keyCode === 16) {
				this._isShiftDown = false
			}
		},
		async keydown(e) {
			console.log(e)
			if (e.keyCode === 16) {
				this._isShiftDown = true
				return
			}
			if (e.keyCode !== 13) return
			if (!this._isShiftDown) {
				return this.send()
			}
		},
		send() {
			const area = document.querySelector('.chat-area')
			this.$emit('send', editorMessageManager.filter(area))
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
			input.value = ''
		},
	},
}
</script>

<style lang="scss">
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
	.file-pick {
		width: 25px;
		opacity: 0.8;
		margin-left: 10px;
	}
	.eidtArea-file {
		width: 80%;
		border: 1px solid #e7e7e7;
		padding: 6px;
		margin: 3px 0;
	}
}
</style>
