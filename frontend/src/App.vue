<template>
  <div>
    <router-view />
    <input type="file" @change="filechange" />
  </div>
</template>

<script>
import pako from 'pako'
window.p = pako
import {reader} from '@/plugins/webrtc-chat/tool'
export default {
  name: 'App',
  methods: {
    filechange(e) {
      let file = e.target.files[0]
      console.log(file)
      reader.readAsArrayBuffer(file).then(res => {
        let after = pako.deflate(res)
        console.log(after.byteLength, file.size, '减小', file.size- after.byteLength)
      })
    }
  }
}
</script>
