#!/bin/bash

# 停止并删除已存在的容器
if [ "$(docker ps -aq -f name=uniapp-blog-admin)" ]; then
    docker stop uniapp-blog-admin
    docker rm uniapp-blog-admin
fi

# 构建前端项目
npm run build:h5

# 确保目标目录存在
mkdir -p /usr/local/nginx/html-admin/h5

# 复制构建好的前端文件到目标目录
cp -r dist/build/h5/* /usr/local/nginx/html-admin/h5/

# 复制配置文件到html-admin目录
cp Dockerfile nginx.conf set.sh /usr/local/nginx/html-admin/

# 进入html-admin目录
cd /usr/local/nginx/html-admin

# 构建新镜像
docker build -t uniapp-blog-admin .

# 运行新容器，端口映射到5174，并挂载本地admin目录
docker run -d -p 5174:80 -v /usr/local/nginx/html-admin:/usr/local/nginx/html-admin --name uniapp-blog-admin --network andiusblog-network uniapp-blog-admin

# 显示运行中的容器
docker ps 