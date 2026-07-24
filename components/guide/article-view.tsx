import Link from "next/link"
import { ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GUIDE_CATEGORIES, articlesForCategory, type GuideArticle } from "@/lib/guide-data"

export function ArticleView({ article }: { article: GuideArticle }) {
  const category = GUIDE_CATEGORIES.find((c) => c.id === article.categoryId)
  const related = articlesForCategory(article.categoryId)
    .filter((a) => a.id !== article.id)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/guide" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
        ← Back to Guide
      </Link>

      <div className="flex flex-col gap-2">
        {category && (
          <Badge variant="secondary" className="w-fit">
            {category.label}
          </Badge>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
      </div>

      <div className="flex flex-col gap-4">
        {article.body.map((paragraph, index) => (
          <div key={index} className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-foreground">{paragraph}</p>
            {index === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-muted-foreground">
                <ImageIcon className="size-6" />
                <span className="text-xs">Screenshot placeholder</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <div className="flex flex-col gap-3 border-t pt-6">
          <h2 className="text-sm font-semibold tracking-tight">Related articles</h2>
          <div className="flex flex-col gap-1">
            {related.map((a) => (
              <Link
                key={a.id}
                href={`/guide/${a.id}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
