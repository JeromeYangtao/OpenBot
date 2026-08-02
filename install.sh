#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_URL="https://github.com/JeromeYangtao/OpenBot.git"
readonly REPOSITORY_BRANCH="main"
readonly REQUIRED_NODE_MAJOR=20
readonly PNPM_VERSION="10.19.0"
readonly APP_NAME="openbot"
readonly INSTALL_DIR="${OPENBOT_INSTALL_DIR:-${HOME}/.openbot/app}"

log() {
  printf '[OpenBot] %s\n' "$*"
}

fail() {
  printf '[OpenBot] ERROR: %s\n' "$*" >&2
  exit 1
}

run_as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "安装系统依赖需要 root 权限，请使用 root 用户运行，或先安装 sudo。"
  fi
}

install_system_packages() {
  local packages=("$@")

  if command -v apt-get >/dev/null 2>&1; then
    run_as_root apt-get update
    run_as_root apt-get install -y "${packages[@]}"
  elif command -v dnf >/dev/null 2>&1; then
    run_as_root dnf install -y "${packages[@]}"
  elif command -v yum >/dev/null 2>&1; then
    run_as_root yum install -y "${packages[@]}"
  elif command -v apk >/dev/null 2>&1; then
    run_as_root apk add --no-cache "${packages[@]}"
  else
    fail "无法识别系统包管理器，请先手动安装：${packages[*]}"
  fi
}

ensure_base_dependencies() {
  local missing=()

  command -v curl >/dev/null 2>&1 || missing+=(curl)
  command -v git >/dev/null 2>&1 || missing+=(git)
  [[ -f /etc/ssl/certs/ca-certificates.crt ]] || \
    [[ -f /etc/pki/tls/certs/ca-bundle.crt ]] || missing+=(ca-certificates)

  if ((${#missing[@]} > 0)); then
    log "安装缺失的系统依赖：${missing[*]}"
    install_system_packages "${missing[@]}"
  fi
}

node_is_supported() {
  command -v node >/dev/null 2>&1 || return 1

  local node_major
  node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  [[ "${node_major}" =~ ^[0-9]+$ ]] && ((node_major >= REQUIRED_NODE_MAJOR))
}

install_node() {
  log "安装 Node.js 22 LTS"

  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | run_as_root bash -
    run_as_root apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | run_as_root bash -
    run_as_root dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | run_as_root bash -
    run_as_root yum install -y nodejs
  elif command -v apk >/dev/null 2>&1; then
    run_as_root apk add --no-cache nodejs npm
  else
    fail "无法自动安装 Node.js，请先安装 Node.js ${REQUIRED_NODE_MAJOR} 或更高版本。"
  fi

  node_is_supported || fail "Node.js 安装失败，或版本低于 ${REQUIRED_NODE_MAJOR}。"
}

ensure_node() {
  if node_is_supported; then
    log "Node.js 环境正常：$(node --version)"
  else
    install_node
  fi

  command -v npm >/dev/null 2>&1 || fail "未找到 npm，请重新安装包含 npm 的 Node.js 发行版。"
}

install_global_npm_package() {
  local package="$1"

  if [[ "$(id -u)" -eq 0 ]] || [[ -w "$(npm root --global)" ]]; then
    npm install --global "${package}"
  elif command -v sudo >/dev/null 2>&1; then
    sudo npm install --global "${package}"
  else
    fail "安装 ${package} 需要全局 npm 写入权限，请配置 sudo 或手动安装。"
  fi
}

ensure_node_tools() {
  if ! command -v pnpm >/dev/null 2>&1; then
    log "安装 pnpm ${PNPM_VERSION}"
    install_global_npm_package "pnpm@${PNPM_VERSION}"
  fi

  if ! command -v pm2 >/dev/null 2>&1; then
    log "安装 PM2"
    install_global_npm_package "pm2@latest"
  fi

  log "pnpm 环境正常：$(pnpm --version)"
  log "PM2 环境正常：$(pm2 --version)"
}

checkout_source() {
  if [[ -d "${INSTALL_DIR}/.git" ]]; then
    local current_origin
    current_origin="$(git -C "${INSTALL_DIR}" remote get-url origin 2>/dev/null || true)"
    [[ "${current_origin}" == "${REPOSITORY_URL}" ]] || \
      fail "${INSTALL_DIR} 已是 Git 仓库，但 origin 不是 OpenBot。"

    [[ -z "$(git -C "${INSTALL_DIR}" status --porcelain)" ]] || \
      fail "${INSTALL_DIR} 存在未提交修改，请处理后重新部署。"

    log "更新 OpenBot 源码"
    git -C "${INSTALL_DIR}" fetch origin "${REPOSITORY_BRANCH}"
    git -C "${INSTALL_DIR}" checkout "${REPOSITORY_BRANCH}"
    git -C "${INSTALL_DIR}" pull --ff-only origin "${REPOSITORY_BRANCH}"
  elif [[ -e "${INSTALL_DIR}" ]] && [[ -n "$(find "${INSTALL_DIR}" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    fail "安装目录 ${INSTALL_DIR} 已存在且不为空，请设置其他 OPENBOT_INSTALL_DIR。"
  else
    log "从 GitHub 拉取 OpenBot"
    mkdir -p "$(dirname "${INSTALL_DIR}")"
    git clone --branch "${REPOSITORY_BRANCH}" --single-branch "${REPOSITORY_URL}" "${INSTALL_DIR}"
  fi
}

deploy_application() {
  if [[ ! -f "${INSTALL_DIR}/config/env.json" ]]; then
    log "从模板创建配置文件"
    cp "${INSTALL_DIR}/config/env.example.json" "${INSTALL_DIR}/config/env.json"
  fi

  log "安装项目依赖"
  pnpm --dir "${INSTALL_DIR}" install --frozen-lockfile

  log "安装前端依赖"
  pnpm --dir "${INSTALL_DIR}/website" install --frozen-lockfile

  log "构建前端页面"
  pnpm --dir "${INSTALL_DIR}/website" deploy

  log "构建 OpenBot 后端"
  pnpm --dir "${INSTALL_DIR}" build

  log "通过 PM2 启动 OpenBot"
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    pm2 reload "${INSTALL_DIR}/config/ecosystem.config.cjs" --only "${APP_NAME}" --update-env
  else
    pm2 start "${INSTALL_DIR}/config/ecosystem.config.cjs" --only "${APP_NAME}"
  fi

  pm2 save
}

get_application_port() {
  node -e 'process.stdout.write(String(process.env.PORT || require(process.argv[1]).port))' \
    "${INSTALL_DIR}/config/env.json"
}

main() {
  log "开始部署"
  ensure_base_dependencies
  ensure_node
  ensure_node_tools
  checkout_source
  deploy_application
  log "部署完成：http://localhost:$(get_application_port)"
  log "运行 'pm2 status' 查看进程，运行 'pm2 logs ${APP_NAME}' 查看日志。"
  log "如需开机自启，请按当前用户执行 'pm2 startup' 输出的命令，然后再次运行 'pm2 save'。"
}

main "$@"
