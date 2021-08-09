const parse = require('hast-util-raw')
const toString = require('hast-util-to-string')
const visit = require('unist-util-visit')

/**
 * @see https://github.com/mapbox/rehype-prism/blob/main/index.js
 */
function attacher(options) {
  /** @type {import('shiki').Highlighter} */
  const highlighter = options.highlighter
  const loadedLanguages = highlighter.getLoadedLanguages()
  const bgColor = highlighter.getBackgroundColor()
  const ignoreUnknownLanguage =
    options.ignoreUnknownLanguage == null ? true : options.ignoreUnknownLanguage

  return transformer

  async function transformer(tree) {
    visit(tree, 'element', visitor)

    function visitor(node, _index, parent) {
      if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
        return
      }

      const lang = getLanguage(node)

      if (
        lang === null ||
        (ignoreUnknownLanguage && !loadedLanguages.includes(lang))
      ) {
        parent.properties.style = `background-color: ${bgColor}`
        return
      }

      /**
       * There probably is a better way than parsing the html string returned by shiki.
       * E.g. generate hast with `hastscript` from tokens returned by `highlighter.codeToThemedTokens`.
       */
      const code = parse({
        type: 'raw',
        value: highlighter.codeToHtml(toString(node), lang),
      })

      parent.properties = code.properties
      parent.children = code.children

      parent.properties.className = (parent.properties.className || []).concat(
        'language-' + lang,
      )
    }
  }
}

function getLanguage(node) {
  const className = node.properties.className || []

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === 'language-') {
      return classListItem.slice(9).toLowerCase()
    }
  }

  return null
}

module.exports = attacher
