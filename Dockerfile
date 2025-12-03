# 多阶段构建 Dockerfile
# 阶段1：构建阶段
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制go.mod和go.sum
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 编译Go程序（静态编译，不依赖外部库）
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o snake-server .

# 阶段2：运行阶段
FROM alpine:latest

# 安装ca证书（用于HTTPS请求）
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN addgroup -g 1000 snakeuser && \
    adduser -D -u 1000 -G snakeuser snakeuser

# 设置工作目录
WORKDIR /home/snakeuser

# 从构建阶段复制编译好的二进制文件
COPY --from=builder /app/snake-server .

# 复制静态文件
COPY --from=builder /app/static ./static

# 修改文件所有权
RUN chown -R snakeuser:snakeuser /home/snakeuser

# 切换到非root用户
USER snakeuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# 运行程序
CMD ["./snake-server"]
