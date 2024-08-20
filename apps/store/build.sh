#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install
nvm use
ng build -c='production'

# Define o diretório de origem e de destino
diretorio_origem="./dist/whatsmenu"
diretorio_destino="../site/public/profile2"

# Verifica se o diretório de destino existe
if [ -d "$diretorio_destino" ]; then
    # Se o diretório de destino existir, o remove
    rm -r "$diretorio_destino"
    echo "Diretório de destino existente removido em $diretorio_destino"
fi

# Cria o diretório de destino
mkdir -p "$diretorio_destino"
echo "Diretório de destino criado em $diretorio_destino"

# Copia todos os arquivos do diretório de origem para o diretório de destino
cp -r "$diretorio_origem"/* "$diretorio_destino/"

echo "Arquivos copiados com sucesso para $diretorio_destino"