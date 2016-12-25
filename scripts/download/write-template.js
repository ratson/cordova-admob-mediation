import path from 'path'

import fs from 'mz/fs'
import mkdirp from 'mkdirp-promise'
import ejs from 'ejs'

function renderTemplate(templatePath, data, options) {
  const filename = path.join(__dirname, 'templates', templatePath)
  return new Promise((resolve, reject) => {
    ejs.renderFile(filename, data, options, (err, str) => {
      if (err) {
        reject(err)
      } else {
        resolve(str)
      }
    })
  })
}

export default async (filename, templatePath, templateContext) => {
  await mkdirp(path.dirname(filename))
  const s = await renderTemplate(templatePath, templateContext)
  await fs.writeFile(filename, s, 'utf8')
  return s
}
