import path from 'path'

import _ from 'lodash'
import jsonfile from 'jsonfile-promised'
import pathExists from 'path-exists'

import fetchData from './fetch-data'
import writeTemplate from './write-template'

function readPackageVersion(network) {
  const {pkdDirJoin} = network
  const filename = pkdDirJoin('package.json')
  return jsonfile.readFile(filename)
  .then(({version}) => version)
  .catch(() => '0.0.0')
}

async function writePackageJson(network) {
  const {name, pkg, pkdDirJoin} = network
  const filename = pkdDirJoin('package.json')
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
  const {name, pkg, pkdDirJoin} = network
  const filename = pkdDirJoin('plugin.xml')
  const version = await readPackageVersion(network)

  return writeTemplate(filename, 'plugin.xml', {
    id: pkg,
    name: pkg,
    description: `Cordova AdMob Mediation Plugin for ${name}`,
    version,
  })
}

async function writeReadme(network) {
  const {name, pkdDirJoin} = network
  const filename = pkdDirJoin('README.md')
  if (await pathExists(filename)) {
    return
  }
  return writeTemplate(filename, 'README.md', {
    title: `Cordova AdMob Mediation Plugin for ${name}`,
  })
}

fetchData()
.then(({networks}) => Promise.all(networks.map((network) => {
  const {pkg} = network
  network.pkdDir = path.join(__dirname, '../../packages', pkg)
  network.pkdDirJoin = (...args) => path.join(network.pkdDir, ...args)

  return Promise.all([
    writePackageJson(network),
    writePluginXml(network),
    writeReadme(network),
  ])
})))
