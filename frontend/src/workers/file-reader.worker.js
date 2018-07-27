import { fileReader } from '@/tools'

onmessage = async function({ data: {type,data} }) {
  console.log(type, data)
 const result =  await fileReader({ data, type })
 self.postMessage(result)
}
