import { notFound } from "next/navigation"

import { ArticleView } from "@/components/guide/article-view"
import { GUIDE_ARTICLES, getGuideArticle } from "@/lib/guide-data"

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ articleId: article.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params
  const article = getGuideArticle(articleId)

  return {
    title: article ? `${article.title} — Guide — MyStoreGuard` : "Not found — MyStoreGuard",
  }
}

export default async function GuideArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params
  const article = getGuideArticle(articleId)

  if (!article) {
    notFound()
  }

  return <ArticleView article={article} />
}
