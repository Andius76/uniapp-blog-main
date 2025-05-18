# 使用NGINX作为基础镜像
FROM nginx

# 创建目标目录结构
RUN mkdir -p /usr/local/nginx/html-admin/h5

# 将NGINX配置文件复制到容器中的NGINX配置目录
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建工作目录
WORKDIR /usr/local/nginx/html-admin 