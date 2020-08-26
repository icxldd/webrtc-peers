one streamTrack.stop() 或者手动关闭摄像头，录屏等, 本地触发 stream.oninactive 。但是本地不会触发onmute
other RemoteMediaStream.getTracks()[n].onmute() 并且触发RomoteStream.oninactive


one removeTrack()
other pc.onremoveStream() & RemoteMediaStream.onremovetrack() 


track.enabled = true | false 会黑屏，不会触发事件
