```
const rtcChat = new WebRTCChart(pc)

const chat= rtcChat.createDataChannel('file')
```

#### one side
`chat.emit('eventKey', 'i am data channel message', 'i am message description')`
#### another side 

```
chat.on('eventKey', function(data, desc) {
  console.log(data,desc) // 'i am data channel message', 'i am message description'
})

// or
chat.onmessage(function({ eventKey, data, desc }) {
  ...
})
```
#### evt 
* eventKey `string`，emit function first argument
* buffer `arraybuffer`, progress sended or got buffer
* total `number`, message all buffer size
* type `number`, message data type
* sendSize `number` message  sended buffer size 
* getBytes `number` message got buffer size
* desc `any` message description 

#### get progress
`
chat.onprogress = function(evt) {
    ...
}

#### send progress
const sendProgress = chat.emit('eventkey', data, {someData})
sendProgress(function progress(evt) {
...
})
```
