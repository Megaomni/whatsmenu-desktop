// import fs from 'fs';
// import path from 'path';

// function copyDirectoriesToPackages(sourceDirs, destination) {
//   if (!fs.existsSync(destination)) {
//     fs.mkdirSync(destination, { recursive: true });
//   }

//   console.log(sourceDirs);

//   sourceDirs.forEach((dir) => {
//     const dirName = path.basename(dir);
//     const destDir = path.join(dirName);

//     fs.readdirSync(dir).forEach((file) => {
//       console.log(path.join(dir, file));
//       fs.readdirSync(path.join(dir, file)).forEach((subFile) => {
//         console.log(subFile);

//       })
//     })


//     // fs.mkdirSync(destDir, { recursive: true });

//     // fs.readdirSync(dir).forEach((file) => {
//     //   const srcFile = path.join(dir, file);
//     //   const destFile = path.join(destDir, file);

//     //   console.log(`Copiando ${srcFile} para ${destFile}`);

//     //   fs.copyFileSync(srcFile, destFile);
//     // });
//   });
// }


// const destination = 'packages';
// copyDirectoriesToPackages(process.argv.slice(2).map((dir) => path.resolve(dir, "../../..", "packages")), destination);

import fs from 'fs/promises';
import path from 'path';

async function copyDirectory(source, destination) {
  try {
    // Copia recursivamente o conteúdo do diretório
    await fs.cp(source, destination, { recursive: true });
    console.log(`Diretório copiado de ${source} para ${destination}`);
  } catch (error) {
    console.error('Erro ao copiar o diretório:', error);
  }
}

// Exemplo de uso
copyDirectory(path.join('../../packages/entities/src'), 'packages/entities');
copyDirectory(path.join('../../packages/print-component/src'), 'packages/print-component');
