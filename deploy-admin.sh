#!/bin/bash

# 管理后台部署脚本
# 使用方法: ./deploy-admin.sh

# 设置变量
BUILD_DIR="dist/build/h5"
SERVER_IP="121.40.195.102"
SERVER_USER="root"
REMOTE_DIR="/usr/local/nginx/html-admin/h5"

# 输出彩色信息
function info() {
    echo -e "\033[32m[INFO] $1\033[0m"
}

function error() {
    echo -e "\033[31m[ERROR] $1\033[0m"
    exit 1
}

function warn() {
    echo -e "\033[33m[WARN] $1\033[0m"
}

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
    error "构建目录 $BUILD_DIR 不存在，请先执行 npm run build:h5"
fi

# 开始部署
info "开始部署管理后台到 $SERVER_IP..."

# 检查远程目录是否存在，不存在则创建
info "检查远程目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# 上传文件
info "上传文件到服务器..."
rsync -avz --delete $BUILD_DIR/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 设置权限
info "设置文件权限..."
ssh $SERVER_USER@$SERVER_IP "chmod -R 755 $REMOTE_DIR"

# 重启Nginx
info "重启Nginx服务..."
ssh $SERVER_USER@$SERVER_IP "nginx -s reload"

info "部署完成！管理后台已部署到 https://admin.andiusblog.xyz"
info "如果遇到问题，请检查Nginx配置和日志"