import fs from 'fs'
import path from 'path'
import type { BuildOptions, UserConfig as ViteUserConfig } from 'vite'
import { defineConfig } from 'vite'
import banner from 'vite-plugin-banner'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

export const globals = {
  '@oplayer/core': 'OPlayer',
  '@oplayer/ui': 'OUI',
  '@oplayer/hls': 'OHls',
  'hls.js': 'Hls',
  'hls.js/dist/hls.light.min.js': 'Hls',
  'hls.js/dist/hls.min.js': 'Hls',
  dashjs: 'dashjs',
  '@oplayer/torrent': 'OTorrent',
  '@oplayer/mpegts': 'OMpegts',
  'mpegts.js/dist/mpegts.js': 'mpegts',
  'shaka-player/dist/shaka-player.compiled': 'shaka',
  'webtorrent/webtorrent.min.js': 'WebTorrent',
  '@oplayer/danmaku': 'ODanmaku',
  react: 'React'
}

const babelPlugins = [
  'syntax-trailing-function-commas',
  // These use loose mode which avoids embedding a runtime.
  // TODO: Remove object spread from the source. Prefer Object.assign instead.
  ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
  ['@babel/plugin-transform-template-literals', { loose: true }],
  // TODO: Remove array spread from the source. Prefer .apply instead.
  ['@babel/plugin-transform-spread', { loose: true, useBuiltIns: true }],
  '@babel/plugin-transform-parameters',
  // TODO: Remove array destructuring from the source. Requires runtime.
  ['@babel/plugin-transform-destructuring', { loose: true, useBuiltIns: true }]
]

const makeExternalPredicate = (externalArr: string[]) => {
  if (externalArr.length === 0) return () => false
  return (id: string) => new RegExp(`^(${externalArr.join('|')})($|/)`).test(id)
}

export const libFileName = (format: string) => `index.${{ es: 'es', umd: 'min' }[format]}.js`

function getBabelConfig() {
  return {
    allowAllFormats: true,
    babelrc: false,
    configFile: false,
    presets: [],
    plugins: [...babelPlugins]
  }
}

export const rollupPlugins: any[] = [getBabelOutputPlugin(getBabelConfig())]

export const viteBuild = (packageDirName: string, options: BuildOptions = {}): BuildOptions => {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `packages/${packageDirName}/package.json`), {
      encoding: 'utf-8'
    })
  )
  return mergeDeep<BuildOptions>(
    {
      minify: 'terser',
      sourcemap: true,
      commonjsOptions: {
        sourceMap: false
      },
      lib: {
        entry: resolvePath(`packages/${packageDirName}/src/index.ts`),
        name: `oplayer_${packageDirName}`,
        fileName: libFileName,
        formats: ['es', 'umd']
      },
      rollupOptions: {
        external: makeExternalPredicate([
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {})
        ]),
        output: {
          dir: resolvePath(`packages/${packageDirName}/dist`),
          globals
        },
        plugins: rollupPlugins as any
      }
    },
    options
  )
}

export const viteConfig = (packageDirName: string, options: ViteUserConfig = {}) => {
  const vitePlugins = options.plugins ?? []
  const { name, version, description, author, homepage } = JSON.parse(
    fs.readFileSync(resolvePath(`packages/${packageDirName}/package.json`), { encoding: 'utf-8' })
  )
  return defineConfig({
    ...options,
    build: viteBuild(packageDirName, options.build),
    plugins: [
      ...vitePlugins,
      ...rollupPlugins,
      banner(
        `/**\n * name: ${name}\n * version: v${version}\n * description: ${description}\n * author: ${author}\n * homepage: ${homepage}\n */`
      )
    ] as any,
    define: { __VERSION__: `'${version}'` }
  })
}

export default defineConfig({})

const resolvePath = (str: string) => path.resolve(__dirname, str)

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item))
}

function mergeDeep<T>(target: T, ...sources: T[]): T {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key] as T, source[key] as T)
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}
