#!/bin/bash
# 乌托邦测试 — 服务器部署脚本
# 适用于 Ubuntu 22.04 / CentOS 7.9

set -e

echo "=== 乌托邦测试 部署 ==="

# 安装 Python3（如未安装）
if ! command -v python3 &>/dev/null; then
    echo "安装 Python3..."
    if command -v apt &>/dev/null; then
        apt update && apt install -y python3 python3-pip python3-venv git nginx
    else
        yum install -y python3 python3-pip git nginx
    fi
fi

# 克隆项目
PROJECT_DIR=/opt/utopia-test
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git pull
else
    git clone https://github.com/AragornDaoZhen/Utopia-Test.git "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# 安装依赖
pip3 install -r requirements.txt

# 创建 systemd 服务
cat > /etc/systemd/system/utopia-test.service << 'EOF'
[Unit]
Description=Utopia Test Flask App
After=network.target

[Service]
User=root
WorkingDirectory=/opt/utopia-test
ExecStart=/opt/utopia-test/venv/bin/python3 app.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable utopia-test
systemctl restart utopia-test

# Nginx 反向代理（可选）
cat > /etc/nginx/sites-available/utopia-test << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/utopia-test /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
