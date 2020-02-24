
class Functor{
  constructor(val) {
    this.value = val
  }
  map(fn) {
    return new Functor(fn(this.value)) 
  }
  static of(val) {
    return new Functor(val)
  }
}

export class R extends Functor{
  constructor(data) {
    super(data)
    this.value = data
  }

  static async pipe(...fn) {
    return async function(data) {
      for (let i = 0 ; i < fn.length; i++) {
        data = await fn[i](data)
      }
      return data
      // return fn.reduce((last, now) => now(last), data)
    }
  }
  
}
