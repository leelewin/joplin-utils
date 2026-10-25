import { logger } from './logger'

/**
 * mark-magic 的 Content 结构，仅声明本文件需要读写的字段。
 * 完整类型由 @mark-magic/core 提供，其余字段通过展开运算符原样透传。
 */
export interface NoteContent {
  id: string
  name: string
  content: string
  path: string[]
  extra: { tags?: string[] } & Record<string, unknown>
}

/** 笔记正文中 <!-- publish --> 指令块解析后的结果 */
export interface NoteDirective {
  title?: string
  tags?: string[]
  categories?: string[]
}

/**
 * 匹配正文中的指令块。
 *
 * 刻意不采用 --- YAML front-matter 形式：plugin-joplin 在正文不以 "#+ " 开头时，
 * 会先插入一行 "# <标题>" 再交给 transform，front-matter 因此不再位于首行而失效。
 * HTML 注释不受位置影响，且在 Joplin 预览中不可见。
 */
const DIRECTIVE_RE = /<!--\s*publish\s*\r?\n([\s\S]*?)-->/

const FIELD_RE = /^([\w-]+)[ \t]*:[ \t]*(.*)$/

const QUOTE_RE = /^(['"])([\s\S]*)\1$/

const KNOWN_KEYS = ['title', 'tags', 'categories']

function unquote(value: string): string {
  return value.replace(QUOTE_RE, '$2')
}

/** 同时支持 "a, b" 与 "[a, b]" 两种写法 */
function parseList(raw: string): string[] {
  return raw
    .trim()
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter((item) => item.length > 0)
}

/**
 * 解析正文中的第一个指令块；不存在时返回 undefined。
 * 未识别的字段会写入日志，避免因拼写错误而静默失效。
 */
export function parseDirective(content: string): NoteDirective | undefined {
  const matched = content.match(DIRECTIVE_RE)
  if (!matched) {
    return undefined
  }
  const directive: NoteDirective = {}
  const unknownKeys: string[] = []
  for (const line of matched[1].split(/\r?\n/)) {
    const field = line.trim().match(FIELD_RE)
    if (!field) {
      continue
    }
    const key = field[1]
    const rawValue = field[2]
    if (key === 'title') {
      directive.title = unquote(rawValue.trim())
    } else if (key === 'tags') {
      directive.tags = parseList(rawValue)
    } else if (key === 'categories') {
      directive.categories = parseList(rawValue)
    } else if (!KNOWN_KEYS.includes(key)) {
      unknownKeys.push(key)
    }
  }
  if (unknownKeys.length > 0) {
    logger.warn(`[directive] ignored unknown field(s): ${unknownKeys.join(', ')}`)
  }
  return directive
}

/**
 * 允许在单篇笔记正文中覆盖发布后的标题、标签与分类。
 *
 * 用法，写在 Joplin 笔记正文任意位置（建议开头）：
 *
 *     <!-- publish
 *     title: 发布到博客时使用的标题
 *     tags: [OpenGL, 图形学]
 *     categories: [技术, 图形]
 *     -->
 *
 * 三个字段均可省略：省略时分别沿用笔记标题、笔记标签（已由 plugin-joplin 剔除
 * 发布标签）、以及笔记所在笔记本的层级路径。写成 "tags: []" 或 "categories: []"
 * 可显式清空。指令块本身会在落盘前从正文中移除，只有第一个指令块生效。
 *
 * 关于 categories 的实现约束：plugin-hexo 取 content.path.slice(0, -1) 作为分类，
 * 因此覆盖时必须保留末位元素（原本是 filenamify(title) + '.md'）作为占位。
 * 该占位不会被写入磁盘——plugin-hexo 覆盖了 contentPath，落盘文件名只取 content.id。
 * 注意 Hexo 将数组解释为层级（后者是前者的子分类），且 Hugo 输出没有 categories 字段。
 */
export function publishTransform() {
  return {
    name: 'publisher-note-directive',
    async transform(content: NoteContent): Promise<NoteContent> {
      const directive = parseDirective(content.content)
      if (!directive) {
        return content
      }
      const tail = content.path.length > 0 ? content.path[content.path.length - 1] : `${content.name}.md`
      const next: NoteContent = {
        ...content,
        content: content.content.replace(DIRECTIVE_RE, '').trimStart(),
        name: directive.title || content.name,
        path: Array.isArray(directive.categories) ? [...directive.categories, tail] : content.path,
        extra: { ...content.extra, tags: directive.tags ?? content.extra?.tags },
      }
      logger.info(
        `[directive] ${content.id} title="${next.name}" tags=${JSON.stringify(
          next.extra.tags,
        )} categories=${JSON.stringify(next.path.slice(0, -1))}`,
      )
      return next
    },
  }
}
