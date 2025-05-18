# 博客管理后台部署指南

## 环境要求

- Node.js 16+
- npm 或 yarn
- 服务器已配置Nginx
- 已有SSL证书

## 本地开发

1. 安装依赖：

```bash
npm install
# 或
yarn
```

2. 启动开发服务器：

```bash
npm run dev
# 或
yarn dev
```

3. 在浏览器中访问：`http://localhost:5174`

## 构建部署

### 方法一：手动部署

1. 构建项目：

```bash
npm run build:h5
# 或
yarn build:h5
```

2. 将 `dist/build/h5` 目录下的文件上传到服务器的 `/usr/local/nginx/html-admin/h5` 目录

3. 确保Nginx配置正确，并重启Nginx：

```bash
nginx -s reload
```

### 方法二：使用部署脚本

1. 构建项目：

```bash
npm run build:h5
# 或
yarn build:h5
```

2. 执行部署脚本：

```bash
# 确保脚本有执行权限
chmod +x deploy-admin.sh

# 执行部署
./deploy-admin.sh
```

## Nginx配置

管理后台使用子域名 `admin.andiusblog.xyz` 访问，Nginx配置文件位于服务器的 `/usr/local/nginx/conf/vhost/admin.andiusblog.xyz.conf`：

```nginx
server {
    listen       80;
    server_name  admin.andiusblog.xyz;
    
    # 重定向HTTP到HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen       443 ssl;
    server_name  admin.andiusblog.xyz;
    
    # SSL证书配置
    ssl_certificate      /usr/local/nginx/conf/ssl/andiusblog.xyz.pem;
    ssl_certificate_key  /usr/local/nginx/conf/ssl/andiusblog.xyz.key;
    
    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;
    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;
    
    # 管理后台静态文件目录
    root /usr/local/nginx/html-admin/h5;
    
    # 处理前端路由
    location / {
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # API请求转发到后端服务
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 访问管理后台

部署完成后，可通过以下地址访问管理后台：

- 管理后台：https://admin.andiusblog.xyz

## 常见问题

1. **管理后台无法访问**
   - 检查DNS解析是否正确
   - 检查Nginx配置是否正确
   - 检查服务器防火墙是否开放443端口

2. **API请求失败**
   - 检查后端服务是否正常运行
   - 检查CORS配置是否允许admin.andiusblog.xyz域名
   - 检查请求日志，查看具体错误信息

3. **登录失败**
   - 检查用户名密码是否正确
   - 检查后端日志，查看具体错误信息 