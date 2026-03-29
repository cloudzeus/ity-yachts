import { db } from "@/lib/db"
import { ReviewsClient } from "./reviews-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Reviews — IYC Admin" }

export default async function ReviewsPage() {
  const [reviews, total] = await Promise.all([
    db.review.findMany({
      orderBy: { sortOrder: "asc" },
      take: 50,
    }),
    db.review.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Customer Reviews
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {total} total reviews — drag rows to reorder
          </p>
        </div>
      </div>

      <ReviewsClient initialData={{
        reviews: reviews.map((r) => ({
          ...r,
          content: r.content as Record<string, string>,
          date: r.date.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        total,
      }} />
    </div>
  )
}
