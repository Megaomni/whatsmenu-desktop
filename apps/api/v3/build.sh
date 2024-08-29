#!/bin/bash

# Inicializa o NVM
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Isso carrega o NVM

# Extrai a versão desejada do Node.js do arquivo package.json
node_version=$(grep -o '"node": *"[^"]*"' package.json | grep -o '"[^"]*"$' | tr -d '"')

# Instala a versão desejada do Node.js usando NVM
if [ "$node_version" == "" ]; then
  nvm install --lts
  nvm use --lts
else
  nvm install "$node_version"
  nvm use "$node_version"
fi

# Instala pnpm globalmente
npm install -g pnpm

# Instala ou atualiza as dependências do projeto
pnpm install

node ace build
cd build
pnpm i --prod

# Cria o arquivo .env
ln -s ../.env

echo "Configuração concluída."
