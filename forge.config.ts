import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from "fs";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './src/images/app_icon.ico',
    extraResource: [],
    protocols: [
      {
        name: 'WhatsMenu WhatsApp Bot',
        schemes: ['whatsmenu-whatsapp-bot'],
      }
    ]
  },
  hooks: {
    postMake: async (ctx, makeResult) => {
      for (const makeTarget of makeResult) {
        makeTarget.artifacts.forEach((artifact) => {
          console.log("artifact", artifact);
          if (artifact.includes("RELEASES")) {
            const content = fs.readFileSync(artifact, 'utf8')
            const newDataRelease = content.split('whatsmenu_desktop').join(`whatsmenu_desktop_${makeTarget.arch}`)
            console.log(newDataRelease);
            fs.writeFileSync(artifact, newDataRelease, 'utf-8')
            
            fs.renameSync(artifact, `${artifact}_${makeTarget.arch}`)
          }
          if (artifact.includes(".nupkg")) {
            const splitStrint = `whatsmenu_desktop`
            fs.renameSync(artifact, artifact.split(splitStrint).join(`${splitStrint}_${makeTarget.arch}`))
          }
          if (artifact.includes(".exe")) {
            fs.renameSync(artifact, artifact.split(makeTarget.packageJSON.version).join(`${makeTarget.packageJSON.version}_${makeTarget.arch}`))
          } 
        });
      }
      return makeResult
    }
  },
  rebuildConfig: {},
  
  makers: [new MakerSquirrel({ setupIcon: './src/images/install_icon.ico', iconUrl: 'https://whatsmenu.com.br/favicon/app_icon.ico' }), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'megaomni',
          name: 'whatsmenu-desktop'
        },
        prerelease: true,
      }
    }
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
        {
          name: 'tab_window',
          config: 'vite.renderer.config.ts',
        },
        {
          name: 'bot_window',
          config: 'vite.renderer.config.ts',
        },
        {
          name: 'print_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
