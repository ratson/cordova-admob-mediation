import _ from 'lodash'
import 'loud-rejection/register'
import jsonfile from 'jsonfile-promised'
import pathExists from 'path-exists'

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

async function writePluginXml(network) {
  const {name, pkg, pkgDirJoin} = network
  const filename = pkgDirJoin('plugin.xml')
  const version = await readPackageVersion(network)
  if (await pathExists(filename)) {
    return
  }

  return writeTemplate(filename, 'plugin.xml', {
    id: pkg,
    name: pkg,
    description: `Cordova AdMob Mediation Plugin for ${name}`,
    version,
    android: {
      sourceFiles: [],
    },
    ios: {
      headerFiles: [],
      sourceFiles: [],
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
