import { execSync } from "child_process";

// Função para exibir o uso
function showUsage() {
  console.log(
    "\x1b[1m\x1b[31m",
    "Especifique a versão entre as opções:",
    "\x1b[37m",
    "[patch | minor | major]"
  );
  process.exit(1);
}

// Verifica se o tipo de versão foi fornecido
if (process.argv.length !== 3) {
  showUsage();
}

// Tipo de versão a ser incrementada (patch, minor, major)
const versionType = process.argv[2];

// Obtém a mensagem do commit anterior
const previousCommitMsg = execSync("git log -1 --pretty=%B").toString().trim();

// Incrementa a versão do package.json e faz o commit com a mensagem combinada
const npmVersionCmd = `npm version ${versionType} -m "${
  previousCommitMsg.split("- Bump de versão")[0]
} - Bump de versão v%s"`;
try {
  execSync(npmVersionCmd, { stdio: "inherit" });
} catch (error) {
  console.error(error);
}

// Mensagem de sucesso
console.log("\x1b[32m", `Versão incrementada com sucesso para ${versionType}.`);
