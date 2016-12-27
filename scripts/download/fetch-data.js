import assert from 'assert'
import path from 'path'

import _ from 'lodash'
import cheerio from 'cheerio'
import got from 'got'
import jsonfile from 'jsonfile-promised'

function toPackageName(name) {
  const suffix = name.toLowerCase()
  .replace('crosschannel (mdotm)', 'crosschannel')
  .replace('fuse powered', 'fusepowered')
  .replace('hunt mobile ads', 'huntmads')
  .replace('i-mobile for sp', 'imobile')
  .replace('lifestreet media', 'lifestreet')
  .replace('lg u+ad', 'uplus')
  .replace('one by aol: mobile (millennial media)', 'millennialmedia')
  .replace('one by aol: mobile (nexage)', 'nexage')
  .replace('t ad (sk planet)', 'tad')
  .replace('tapit by phunware', 'tapit')
  .replace('tencent gdt', 'tencent')
  .replace('tremor video', 'tremor')
  .replace('unity ads', 'unity')
  .replace('vserv (emerging markets)', 'vserv')
  assert(suffix.length > 0)
  assert(suffix.indexOf(' ') === -1)
  return `cordova-admob-${suffix}`
}

function normalizeUrl(url) {
  if (url && url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

function fetchData() {
  return got('https://firebase.google.com/docs/admob/android/mediation-networks')
  .then(res => cheerio.load(res.body))
  .then($ => $('h2:contains("Supported ad networks")')
    .siblings('table')
    .first()
    .find('tr')
    .not(':first-child')
    .map((i, elm) => {
      const $tr = $(elm)

      const name = $tr
      .find('td')
      .first()
      .text()
      .trim()

      const url = $tr
      .find('td:nth-child(2)')
      .find('a:contains("Partner page")')
      .not(':contains("Japanese")')
      .each(i => assert(i === 0))
      .attr('href')

      return {
        name,
        pkg: toPackageName(name),
        url: normalizeUrl(url),
        android: {
          adapter: normalizeUrl($tr
            .find('td:nth-child(4)')
            .find('a:contains("Adapter for Android")')
            .attr('href')),
        },
        ios: {
          adapter: normalizeUrl($tr
            .find('td:nth-child(4)')
            .find('a:contains("Adapter for iOS")')
            .attr('href')),
        },
      }
    })
    .get()
    .filter(({name}) => name !== 'AdMob'))
}

function refreshData(filename) {
  return fetchData()
  .then((networks) => {
    const data = {networks}
    return jsonfile.writeFile(filename, data, {
      spaces: 2,
    }).then(() => data)
  })
}

function enhanceData(data) {
  data.networks.push({
    name: 'AdBuddiz',
    pkg: 'cordova-admob-adbuddiz',
    url: 'https://publishers.adbuddiz.com/pub_portal/login?path=/pub_portal/sdk/admob',
  })

  data.networks = data.networks.map((network) => {
    const {pkg} = network
    const pkgDir = path.join(__dirname, '../../packages', pkg)
    return {
      ...network,
      id: _.last(pkg.split('-')),
      pkgDir,
      pkgDirJoin: (...args) => path.join(pkgDir, ...args),
    }
  })

  return data
}

export default () => {
  const filename = path.join(__dirname, 'data.json')

  if (process.env.REFRESH_DATA) {
    return refreshData(filename).then(enhanceData)
  }

  return jsonfile.readFile(filename)
  .catch(() => refreshData(filename))
  .then(enhanceData)
}
