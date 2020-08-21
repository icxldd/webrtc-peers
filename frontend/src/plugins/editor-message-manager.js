import { fileReader } from '@/tools'

export default class {
	files = new Map() //所有结果
	async addImg(file, area) {
    const {hash, blob,url} = await this._add(file)
		const img = `<img class="chat-img" data-hash="${hash}" contenteditable="false" src="${url}" ><br>`
		this.files.set(hash, {
			hash,
			file:blob,
			type: 'img',
		})
		area.innerHTML += img
	}
	async _add(file) {
		const blob = await fileReader({ data: file, type: 'blob' })
		const url = URL.createObjectURL(file)
		const hash = (Math.random() * 10 ** 17).toString()
		return {
			hash,
			blob,
			url,
		}
	}
	async addVideo(file, area) {
		const { hash, blob, url } = await this._add(file)
		let html = `<video  data-hash="${hash}" contenteditable="false"  controls class="chat-video" src="${url}"></video><br>`
		area.innerHTML += html
		this.files.set(hash, {
			hash,
			file: blob,
			type: 'video',
		})
	}

	async addFile(file, area) {
		const fileName = file.name
		const hash = (Math.random() * 10 ** 17).toString()
		let html = `<div data-hash="${hash}" class="eidtArea-file" contenteditable="false">
			<i class="iconfont icon-file file-icon"></i>
			<span class="file-name"> ${fileName}</span>
		</div><br>`
		this.files.set(hash, {
			file,
			hash,
			fileName,
      type:'file',
		})
		area.innerHTML += html
	}

	filter(area) {
		const replaceHash = (Math.random() * 10 ** 17).toString()
		function replaceWithHash(doms, hash) {
			return [].slice.call(doms).map(it => {
				it.replaceWith(document.createTextNode(hash))
				return it.dataset.hash
			})
		}
		const doms = area.querySelectorAll('[data-hash]')

		const hashs = replaceWithHash(doms, replaceHash)
		const files = hashs.map(it => {
			const file = this.files.get(it)
      return this.files.get(it)
    })
		const texts = area.innerHTML.split(replaceHash).filter(it => it && it.replace(/(^<br>|<br>$)/g, ''))
		setTimeout(()=> {
			area.innerHTML = ''	
		})
		this.clear()
		return {
			texts,
			files,
		}
	}

	clear() {

		this.files.clear()
	
	}
}
