# Joplin Publisher

## 简介

发布 Joplin 笔记到 GitHub，并通过 GitHub Actions 来自动化构建部署。

## 使用

### GitHub

1. 如果你还没有的话，[注册](https://github.com/signup)一个 GitHub 账户。
2. 使用模版项目 [joplin-blog-template](https://github.com/joplin-utils/joplin-blog-template) 作为模版创建一个新的仓库，名字是 `<github username>.github.io`
   ![create 1](/images/joplin-publisher-github-create-1.png)
   ![create 2](/images/joplin-publisher-github-create-2.png)
   ![create 3](/images/joplin-publisher-github-create-3.png)
3. 修改 Settings > Pages > Build and deployment，选择 GitHub Actions
   ![setting 1](/images/joplin-publisher-github-setting-1.png)
4. [创建](https://github.com/settings/personal-access-tokens/new)一个 github token，至少选择 content 和 `<github username>.github.io` 仓库的权限，创建完成之后复制得到的 token
   ![setting 2](/images/joplin-publisher-github-setting-2.png)

### Joplin

1. 安装插件 <https://joplinapp.org/plugins/plugin/rxliuli.joplin-publisher/>
2. 打开 Joplin > Settings > Plugins > Publisher，分别设置 GitHub token/username/repo
   ![setting 1](/images/joplin-publisher-joplin-setting-1.png)
3. 选择一个笔记，添加标签 **blog**
   ![setting 2](/images/joplin-publisher-joplin-setting-2.png)
4. 点击 Tools > Publish to GitHub 发布
   ![publish 1](/images/joplin-publisher-joplin-publish-1.png)

稍等两分钟，就可以前往 `<github username>.github.io` 查看你发布的笔记了。
(注：国内用户因网络问题导致 clone 或 pull 失败的，可管理员权限下运行 VPN 同时打开 TUN 模式)

![blog](/images/joplin-publisher-joplin-blog-1.png)

你可以继续为希望发布的笔记添加标签 blog，然后重新运行 **Publish to GitHub**，这会将笔记更新到网站上。

## 自定义标题与标签

默认情况下，发布结果的元数据直接来自 Joplin：

| 字段 | 来源                                                          |
| ---- | ------------------------------------------------------------- |
| 标题 | 笔记标题（开头的 `# ` 会被去掉）                              |
| 标签 | 笔记的全部标签，其中用于触发发布的标签（默认 `blog`）会被剔除 |
| 分类 | 笔记所在笔记本的层级路径                                      |
| 日期 | 笔记的创建时间与最后修改时间                                  |

如果希望某篇笔记在博客上使用不同的标题或标签，可以在**笔记正文**中添加一个指令块：

```markdown
<!-- publish
title: OpenGL 入门：坐标系与变换
tags: [OpenGL, 图形学]
categories: [技术, 图形]
-->
```

指令块使用 HTML 注释，因此在 Joplin 的预览中不可见，发布前也会被自动移除，不会出现在文章正文里。

### 字段说明

| 字段         | 是否必填 | 说明                                                       |
| ------------ | -------- | ---------------------------------------------------------- |
| `title`      | 否       | 发布到博客时使用的标题，省略时沿用笔记标题                 |
| `tags`       | 否       | 发布到博客时使用的标签，省略时沿用笔记标签                 |
| `categories` | 否       | 发布到博客时使用的分类，省略时沿用笔记所在笔记本的层级路径 |

- 三个字段都可以省略，只需写想覆盖的那些。
- `tags` 与 `categories` 都支持 `[a, b]` 与 `a, b` 两种写法，写成 `tags: []` 或 `categories: []` 表示清空。
- `title` 的值可以包含冒号，例如 `title: 设计模式: 创建型`。
- 值两侧的引号会被自动去掉。
- 未识别的字段会被忽略，并记录到日志文件中。
- 一篇笔记中只有第一个指令块生效。

### 说明

- Hexo 会把 `categories: [a, b]` 解释为层级关系（b 是 a 的子分类），这与默认的笔记本层级行为一致；只需一层分类时写一个值即可。
- 使用 Hugo 时 `categories` 不生效，因为 Hugo 的元数据中没有该字段。
- 文件名与链接地址由笔记 ID 决定，修改标题不会导致已有链接失效。
- 指令块中不能包含 `-->`，否则会提前结束注释。

## 配置

由于使用 Hexo 进行渲染，所以可以在创建的 GitHub 仓库中配置。目前使用的主题是 Fluid，也可以修改对应的主题配置。

例如，想要修改站点的标题，可以修改 `_config.yml` 中的 `title`

![hexo-setting-1](/images/joplin-publisher-hexo-setting-1.png)

如果想要更新首页的背景图，可以修改 `_config.fluid.yml` 中的 `index.banner_img`

![hexo-setting-2](/images/joplin-publisher-hexo-setting-2.png)

参考

- hexo 文档：<https://hexo.io/>
- fluid 主题的文档：<https://hexo.fluid-dev.com/docs/en/guide/>
