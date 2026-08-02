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

OpenBot 计划提供一键安装脚本。用户无需手动下载和配置项目，通过一条命令即可完成安装并运行：

```bash
curl -fsSL https://raw.githubusercontent.com/JeromeYangtao/OpenBot/main/install.sh | bash
```
