# 博客后台管理系统部署指南

本指南将帮助您部署博客系统的后台管理界面。

## 目录结构说明

部署完成后，服务器上的目录结构如下：

```
/usr/local/nginx/html-admin/
├── h5/                    # 管理后台前端文件目录
│   ├── index.html
│   ├── static/
│   └── ...
├── Dockerfile             # Docker构建文件
├── nginx.conf             # Nginx配置文件
└── set.sh                 # 部署脚本
```

## 准备工作

1. 确保服务器已安装Docker：

```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash -s docker
```

2. 确保已创建Docker网络：

```bash
# 创建Docker网络（如果尚未创建）
docker network create andiusblog-network
```

3. 确保后端服务已经部署并正常运行。

## 部署步骤

### 使用脚本部署

1. 进入项目目录：

```bash
cd /path/to/uniapp-blog-main
```

2. 给部署脚本添加执行权限：

```bash
chmod +x set.sh
```

3. 运行部署脚本：

```bash
./set.sh
```

### 手动部署

如果您想手动执行部署步骤，可以参考以下命令：

1. 进入项目目录：

```bash
cd /path/to/uniapp-blog-main
```

2. 构建前端项目：

```bash
npm install
npm run build:h5
```

3. 创建目标目录并复制文件：

```bash
# 创建目录结构
mkdir -p /usr/local/nginx/html-admin/h5

# 复制前端文件
cp -r dist/build/h5/* /usr/local/nginx/html-admin/h5/

# 复制配置文件
cp Dockerfile nginx.conf set.sh /usr/local/nginx/html-admin/
```

4. 构建并运行Docker容器：

```bash
cd /usr/local/nginx/html-admin
docker build -t uniapp-blog-admin .
docker run -d -p 5174:80 -v /usr/local/nginx/html-admin:/usr/local/nginx/html-admin --name uniapp-blog-admin --network andiusblog-network uniapp-blog-admin
```

## 配置域名和SSL

1. 确保您已经为管理后台配置了域名（例如：admin.andiusblog.xyz）。

2. 将SSL证书文件放置在服务器上：
   - 证书文件：`/etc/ssl/andiusblog.xyz.pem`
   - 密钥文件：`/etc/ssl/andiusblog.xyz.key`

3. 如果您使用的是不同的证书文件，请修改`nginx.conf`中的证书路径。

## 访问管理后台

部署完成后，您可以通过以下地址访问管理后台：

- 本地开发环境：http://localhost:5174
- 生产环境：https://admin.andiusblog.xyz

## 常见问题

1. 如果网站无法访问，请检查：
   - Docker容器是否正常运行：`docker ps`
   - Nginx配置是否正确：`docker exec -it uniapp-blog-admin nginx -t`
   - 防火墙是否开放了5174端口

2. 如果API请求失败，请检查：
   - 后端服务是否正常运行
   - 网络配置是否正确，确保容器可以通过`andiusblog-network`网络相互通信
   - Nginx配置中的upstream服务器名称是否与后端容器名称一致

3. 如果需要重新部署：
   ```bash
   # 停止并删除容器
   docker stop uniapp-blog-admin
   docker rm uniapp-blog-admin
   
   # 重新构建并运行
   cd /usr/local/nginx/html-admin
   docker build -t uniapp-blog-admin .
   docker run -d -p 5174:80 -v /usr/local/nginx/html-admin:/usr/local/nginx/html-admin --name uniapp-blog-admin --network andiusblog-network uniapp-blog-admin
   ```

## 安全提示

1. 在生产环境中，建议配置更严格的访问控制。
2. 定期更新依赖包以修复潜在的安全漏洞。
3. 考虑使用环境变量管理敏感配置，而不是硬编码在配置文件中。 