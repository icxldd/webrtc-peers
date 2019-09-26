 
read -p '确认发布前端代码请入ok: ' qd
if [ $qd != 'ok' ]
then
  echo '取消发布'
  exit 0
fi

echo '2、打包'
npm run build

message="cd /root/app/webrtc/frontend && rm -rf *"

echo '3、执行远程命令：' "$message"
ssh root@gusheng123.top "$message"

echo '4、传送'
scp -r dist/* root@gusheng123.top:/root/app/webrtc/frontend

echo '前端代码发布完成'