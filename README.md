# OpenBot

OpenBot 是一个用于快速查看交易所账户情况的工具。

## 项目定位

通过交易所 API Key，快速、方便地查看账户的关键信息，包括：

- 账户余额
- 当前持仓
- 当前订单

## 要解决的问题

在一些场景下，用户持有交易所账户的 API Key，但没有该账户的登录权限，无法直接进入交易所后台查看账户情况。

OpenBot 希望为这类场景提供一个简单直接的查看入口，让用户无需登录交易所账号，也能通过已有的 API Key 快速了解账户状态。

## 安装与运行

用户无需手动下载和配置项目，通过一条命令即可拉取代码、安装环境依赖、构建项目，并使用 PM2 运行：

```bash
curl -fsSL https://raw.githubusercontent.com/JeromeYangtao/OpenBot/main/install.sh | bash
```

部署脚本支持 Linux，并检查以下环境依赖：

- Node.js 20 或更高版本
- pnpm
- PM2

常用运维命令：

```bash
pm2 status
pm2 logs openbot
pm2 restart openbot
```

如需服务器重启后自动恢复服务，请执行 `pm2 startup`，按其输出完成系统配置后再执行 `pm2 save`。

## 本地开发

项目后端基于 [NestJS](https://nestjs.com/) 和 TypeScript。

```bash
pnpm install
cp config/env.example.json config/env.json
pnpm start:dev
```

服务默认运行在 `http://localhost:5005`。

配置模板位于 `config/env.example.json`。复制为 `config/env.json` 后按需修改；实际配置文件已被 Git 忽略，不会提交到仓库。部署脚本会在配置不存在时自动从模板创建，并保留服务器上已有的配置。

部署时也可通过同名环境变量覆盖配置，例如使用 `PORT=8080` 指定服务端口。

### 支持的交易所

- [ ] Gate
