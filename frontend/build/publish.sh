 
read -p '确认发布前端代码请入ok: ' qd
if [ $qd != 'ok' ]
then
  echo '取消发布'
  exit 0
fi

echo '2、打包'
npm run build

echo '3、传送'
scp -r dist root@gusheng123.top:/root/webrtc


message='cd /root/webrtc && rm -rf frontend/* && mv dist/* frontend/ && rm -rf dist'
echo '4、执行远程命令：' $message

ssh root@gusheng123.top $message
echo '前端代码发布完成'