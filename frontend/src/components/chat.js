// import { fileReader } from '@/tools'
import read from '@/workers/file-reader'

export default class {
  videos = []
  files = [] //所有结果
  autofiles = [] // 非video，img,的文件
  async addImg(file, area) {
    const dataurl = await read({ data: file })
    const hash = (Math.random() * 10 ** 17).toString()
    const img = `<div class="chat-img-div" hash="${hash}"><img class="chat-img"  src="${dataurl}" ><div>`
    area.innerHTML += img
  }
  async addVideo(file, area) {
    file = await read({ data: file, type: 'blob' })
    const url = URL.createObjectURL(file)
    const hash = (Math.random() * 10 ** 17).toString()
    let html = `<video id="video-js" data-setup="{}" hash="${hash}"  controls="controls" class="chat-video video-js" src="${url}"></video>`
    area.innerHTML += html
    this.videos.push({
      hash,
      file
    })
  }

  async addFile(file, area) {
    const name = file.name
    const hash = (Math.random() * 10 ** 17).toString()
    file = await read({ data: file, type: 'blob' })
    this.autofiles.push({
      file,
      hash,
      name
    })
    let html = `<div hash="${hash}"><i class="el-icon-document file-icon"></i><span class="file-name"> ${name}</span></div>`
    area.innerHTML += html

  }

  filterVideo(area) {
    this.videos.forEach(it => {
      const video = area.querySelector(`[hash="${it.hash}"]`)

      if (!video) return
      area.removeChild(video)

      this.files.push({
        type: 'video',
        file: it.file,
        hash: it.hash,
      })
    })
  }

  filterfile(area) {

    this.autofiles.forEach(it => {
      const file = area.querySelector(`[hash="${it.hash}"]`)
      if (!file) return
      const fileName = file.querySelector('.file-name').innerHTML
      area.removeChild(file)

      this.files.push({
        type: 'file',
        file: it.file,
        fileName,
        hash: it.hash,
      })
    })
  }

  filter(area) {
    area = area.cloneNode(true)
    this.filterVideo(area)
    this.filterfile(area)
    const text = area.innerHTML
    const files = [...this.files]
    this.clear()
    return {
      text,
      files
    }
  }

  clear() {
    this.autofiles = []
    this.files = []
    this.videos = []
  }
}
