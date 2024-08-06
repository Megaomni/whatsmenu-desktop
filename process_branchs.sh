#!/bin/bash

# Verifica se o repositório remoto foi passado como argumento
if [ -z "$1" ]; then
  echo "Uso: $0 <remote>"
  exit 1
fi

remote=$1
prefix="$2" # Adicionando um prefixo de caminho para evitar conflitos
branches=$(git branch -r | grep $remote/ | grep -v '\->' | sed "s|$remote/||")

echo "Remote: $remote"
echo "Prefix: $prefix"

# Itera sobre cada branch
for branch in $branches; do
  echo "Processando branch: $branch"
  # Cria uma nova branch a partir da branch remota
  git checkout -b $remote/$branch
  sleep 2
  # Adiciona a subtree
  git subtree add --prefix=$prefix $remote $branch --squash
   # Publica a branch nova no repositório principal
  git push origin $remote/$branch
  # Volta para a branch principal
  git checkout main
done
