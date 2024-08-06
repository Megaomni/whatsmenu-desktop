# Liste todas as branches locais que não são a branch atual
branches=$(git branch | grep -v '\*')

# Exclua todas as branches listadas
for branch in $branches; do
  git branch -D "$branch"
done
