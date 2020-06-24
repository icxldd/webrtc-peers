// 若有文件夹（含多个嵌套），则第一层文件夹中必须index.js，第一层文件夹名将被注册成vue组件名，组件内容为index.js导出的内容
import Vue from 'vue';

const reqs = require.context('./', true, /(\.vue)|(index\.js)$/); // 目录,找子目录,文件匹配
const paths = reqs.keys();
paths.forEach(path => {
  if (path === './index.js') return;

  let path2 = path.replace('./', '');

  let pathArr = path2.split('/');

  if (
    path2.includes('/') &&
    (path2.endsWith('.vue') || pathArr.length > 2 || pathArr[1] !== 'index.js')
  ) {
    return;
  }

  let name = pathArr[0].replace('.vue', '');
  name = name.charAt(0).toUpperCase() + name.slice(1);
  name = name.replace(/-[a-zA-Z]{1}/gi, function(data) {
    return data.replace('-', '').toUpperCase();
  });
  const mod = reqs(path); // 组件信息
  Vue.component(name, mod.default || mod);
});
