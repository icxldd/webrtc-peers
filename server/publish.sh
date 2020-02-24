 
read -p '确认发布后端代码输入ok: ' t
if [ $t != 'ok' ]
then
  echo '取消发布'
  exit 0
fi

echo '2、代码上传'

git add .
git commit -m '发布代码'
git push
message='cd /root/app/backend && git pull && pm2 restart all'
echo '执行远程命令：' $message

ssh root@gusheng123.top $message