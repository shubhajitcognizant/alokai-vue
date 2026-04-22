import { onMounted, watch, isRef, type Ref } from 'vue'

interface MetaOptions {
  title: string | Ref<string>
  description?: string | Ref<string>
  ogImage?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function applyMeta(options: MetaOptions) {
  const titleVal = isRef(options.title) ? options.title.value : options.title
  const descVal  = options.description ? (isRef(options.description) ? options.description.value : options.description) : ''
  const siteTitle = 'ShopVue'

  document.title = titleVal ? `${titleVal} | ${siteTitle}` : siteTitle

  if (descVal) {
    upsertMeta('name', 'description', descVal)
    upsertMeta('property', 'og:description', descVal)
  }

  upsertMeta('property', 'og:title', titleVal || siteTitle)
  upsertMeta('property', 'og:site_name', siteTitle)
  upsertMeta('property', 'og:type', 'website')

  if (options.ogImage) {
    upsertMeta('property', 'og:image', options.ogImage)
  }
}

export function useMeta(options: MetaOptions) {
  onMounted(() => applyMeta(options))

  if (isRef(options.title)) {
    watch(options.title, () => applyMeta(options))
  }
  if (options.description && isRef(options.description)) {
    watch(options.description, () => applyMeta(options))
  }
}
