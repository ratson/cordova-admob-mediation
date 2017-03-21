import fs from 'fs'
import path from 'path'

import _ from 'lodash'
import 'loud-rejection/register'
import got from 'got'
import mkdirp from 'mkdirp-promise'
import jsonfile from 'jsonfile-promised'
import pathExists from 'path-exists'
import unzip from 'unzipper'

import fetchData from './fetch-data'
import writeTemplate from './write-template'

function readPackageVersion(network) {
  const {pkgDirJoin} = network
  const filename = pkgDirJoin('package.json')
  return jsonfile.readFile(filename)
  .then(({version}) => version)
  .catch(() => '0.0.0')
}

async function writePackageJson(network) {
  const {name, pkg, pkgDirJoin} = network
  const filename = pkgDirJoin('package.json')
  const version = await readPackageVersion(network)

  return writeTemplate(filename, 'package.json', {
    name: pkg,
    description: `Cordova AdMob Mediation Plugin for ${name}`,
    version,
    keywords: [
      _.last(pkg.split('-')),
    ],
  })
}

const handlers = {
  inmobi: {
    android: {
      sourceFiles: [{
        src: 'src/android/libadapterinmobi.jar',
        target: 'libs',
      }],
      async download({pkgDirJoin, android: {adapter}}) {
        const jarFilename = pkgDirJoin(this.sourceFiles[0].src)
        await mkdirp(path.dirname(jarFilename))
        await got.stream(adapter)
        .pipe(unzip.ParseOne(/libadapterinmobi/))
        .pipe(fs.createWriteStream(jarFilename))
        .on('finish', () => {
          if (fs.statSync(jarFilename).size === 0) {
            throw new Error(`Empty file: ${jarFilename}`)
          }
        })
      },
    },
    ios: {
      headerFiles: [{
        src: 'src/ios/GADInMobiExtras.h',
      }, {
        src: 'src/ios/GADMAdapterInMobi.h',
      }],
      sourceFiles: [{
        src: 'src/ios/libAdapterInMobi.a',
        framework: true,
      }],
      async download({pkgDirJoin, ios: {adapter}}) {
        await mkdirp(pkgDirJoin('src/ios'))
        await got.stream(adapter)
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
          if (entry.path.indexOf('.') > 0) {
            entry.pipe(fs.createWriteStream(pkgDirJoin('src/ios', path.basename(entry.path))))
          } else {
            entry.autodrain()
          }
        })
      },
    },
  },
}

async function writePluginXml(network) {
  const {id, name, pkg, pkgDirJoin} = network
  const filename = pkgDirJoin('plugin.xml')
  const version = await readPackageVersion(network)
  if (handlers[id]) {
    await Promise.all([
      handlers[id].android.download(network),
      handlers[id].ios.download(network),
    ])
  }
  if (!handlers[id] && await pathExists(filename)) {
    return
  }

  return writeTemplate(filename, 'plugin.xml', {
    id: pkg,
    name: pkg,
    description: `Cordova AdMob Mediation Plugin for ${name}`,
    version,
    ...{
      android: {
        sourceFiles: [],
      },
      ios: {
        headerFiles: [],
        sourceFiles: [],
      },
      ...handlers[id],
    },
  })
}

async function writeReadme(network) {
  const {name, pkgDirJoin} = network
  const filename = pkgDirJoin('README.md')
  if (await pathExists(filename)) {
    return
  }
  return writeTemplate(filename, 'README.md', {
    title: `Cordova AdMob Mediation Plugin for ${name}`,
  })
}

fetchData()
.then(({networks}) => Promise.all(
  networks.map(network => Promise.all([
    writePackageJson(network),
    writePluginXml(network),
    writeReadme(network),
  ]),
)))
