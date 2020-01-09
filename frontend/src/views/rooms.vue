<template>
  <nav class="rtc-room">
    <div class="btns">
      <el-button type="text" @click="dialogVisible = true">创建房间</el-button>
      <el-button type="text" @click="jion">加入房间</el-button>
    </div>
    <ul v-if="rooms" class="rooms">
      <li v-for="(val, key) in rooms" @dblclick="jion" :key="key" @click="picked=key" :class="{picked: picked === key}">
        <div class="info">
          <div class="name">
            {{val.explain.name}}
          </div>
          <div class="tips">
            {{val.explain.tips}}
          </div>
        </div>
        <img src="~assets/lock.svg" v-if="val.explain.secret" class="lock">
      </li>
    </ul>
    <el-dialog title="创建房间" :visible.sync="dialogVisible">
      <v-row class="room-name">
        <span slot="left">房间名:</span>
        <v-input slot="right" v-model="name"></v-input>
      </v-row>
      <v-row class="room-tips">
        <span slot="left">房间描述:</span>
        <v-input slot="right" v-model="tips"></v-input>
      </v-row>
      <v-row class="room-tips">
        <span slot="left">密码:</span>
        <v-input slot="right" v-model="secret"></v-input>
      </v-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="createRoom">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="输入密码" :visible.sync="secretDialog">
      <v-input  v-model="fillSecret" :error.sync="secretError"></v-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="secretDialog = false">取 消</el-button>
        <el-button type="primary" @click="confSecret">确 定</el-button>
      </span>
    </el-dialog>

  </nav>
</template>

<script>
import socket from '@/socket'
import uuid from 'uuid/v4'
export default {
  computed: {
    user() {
      return this.$store.state.user
    }
  },
  data() {
    return {
      rooms: null,
      dialogVisible: false,
      name: this.user && (this.user.nickName || this.user.account),
      tips: '',
      picked: '',
      secret: '',
      fillSecret: '',
      secretDialog: false,
      secretError: ''
    }
  },
  methods: {
    createRoom() {
      let name = this.name
      if (!name) {
        name = this.user.nickName || this.user.account
      }
      this.picked = uuid()
      this.inRoomid = this.picked
      this.dialogVisible = false
      this.$emit('create-room', {
        explain: { name, tips: this.tips, secret: this.secret },
        roomid: this.picked
      })
    },

    jion() {
      if (!this.picked) {
        return this.$message('请先选择房间')
      }

      const data = this.rooms[this.picked]
      if (this.inRoomid === this.picked) {
        return this.$emit('show-video')
      }

      if (this.fillSecret !== data.explain.secret) {
        return (this.secretDialog = true)
      }
      this.secretDialog = false
      this.inRoomid = this.picked
      this.$emit('call', { roomid: this.picked, socketIds: data.socketIds })
    },

    confSecret() {
      const data = this.rooms[this.picked]
      if (this.fillSecret !== data.explain.secret) {
        return (this.secretError = '密码错误')
      }
      this.jion()
    }
  },
  created() {
    this._rooms = rooms => {
      this.rooms = rooms
    }
    socket.on('rooms', this._rooms)
  },
  beforeDestroy() {
    socket.off('rooms', this._rooms)
  }
}
</script>
<style lang="scss">
.rtc-room {
  .el-dialog {
    min-width: 320px !important;
  }
  .rooms {
    border: 1px solid #ccc;
    min-height: 300px;
    li {
      padding: 5px 10px;
      border-radius: 3px;
      height: 40px;
      cursor: pointer;
      position: relative;
      .lock {
        width: 30px;
        position: absolute;
        right: 5px;
        top: 10px;
      }
      &:hover,
      &.picked {
        background: #ccc;
        color: #fff;
        .tips {
          color: #fff;
        }
      }
    }
  }

  .name {
    font-size: 16px;
  }
  .tips {
    font-size: 12px;
    color: #999;
  }
  .btns {
    display: flex;
    justify-content: space-around;
    .el-button + .el-button {
      margin-left: 0;
    }
  }
  input {
    height: 30px;
  }

  .v-row {
    grid-template-columns: 70px 1fr;
  }
  .el-dialog {
    max-width: 600px;
    min-width: 360px;
    width: 80%;
  }
  .room-tips {
    margin-top: 20px;
  }
}
</style>
