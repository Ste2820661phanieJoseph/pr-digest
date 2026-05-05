/**
 * Computes review-related statistics for a set of PRs.
 */

export interface ReviewStats {
  totalReviews: number;
  avgReviewsPerPR: number;
  avgTimeToFirstReviewHours: number | null;
  mostActiveReviewers: Array<{ login: string; count: number }>;
  prsWithNoReview: number;
}

export interface ReviewablePR {
  number: number;
  createdAt: string;
  mergedAt: string | null;
  firstReviewedAt?: string | null;
  reviewers: string[];
}

export function computeReviewStats(prs: ReviewablePR[]): ReviewStats {
  if (prs.length === 0) {
    return {
      totalReviews: 0,
      avgReviewsPerPR: 0,
      avgTimeToFirstReviewHours: null,
      mostActiveReviewers: [],
      prsWithNoReview: 0,
    };
  }

  const reviewerCounts: Record<string, number> = {};
  let totalReviews = 0;
  let prsWithNoReview = 0;
  const timeToFirstReviewHours: number[] = [];

  for (const pr of prs) {
    if (pr.reviewers.length === 0) {
      prsWithNoReview++;
    } else {
      totalReviews += pr.reviewers.length;
      for (const reviewer of pr.reviewers) {
        reviewerCounts[reviewer] = (reviewerCounts[reviewer] ?? 0) + 1;
      }
    }

    if (pr.firstReviewedAt) {
      const created = new Date(pr.createdAt).getTime();
      const firstReview = new Date(pr.firstReviewedAt).getTime();
      const hours = (firstReview - created) / (1000 * 60 * 60);
      if (hours >= 0) timeToFirstReviewHours.push(hours);
    }
  }

  const avgReviewsPerPR =
    prs.length > 0 ? Math.round((totalReviews / prs.length) * 10) / 10 : 0;

  const avgTimeToFirstReviewHours =
    timeToFirstReviewHours.length > 0
      ? Math.round(
          (timeToFirstReviewHours.reduce((a, b) => a + b, 0) /
            timeToFirstReviewHours.length) *
            10
        ) / 10
      : null;

  const mostActiveReviewers = Object.entries(reviewerCounts)
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalReviews,
    avgReviewsPerPR,
    avgTimeToFirstReviewHours,
    mostActiveReviewers,
    prsWithNoReview,
  };
}

export function formatReviewSummary(stats: ReviewStats): string {
  const lines: string[] = [];
  lines.push(`**Reviews:** ${stats.totalReviews} total, ${stats.avgReviewsPerPR} avg per PR`);
  if (stats.avgTimeToFirstReviewHours !== null) {
    lines.push(`**Avg time to first review:** ${stats.avgTimeToFirstReviewHours}h`);
  }
  if (stats.prsWithNoReview > 0) {
    lines.push(`**PRs merged without review:** ${stats.prsWithNoReview}`);
  }
  if (stats.mostActiveReviewers.length > 0) {
    const top = stats.mostActiveReviewers
      .map((r) => `${r.login} (${r.count})`)
      .join(", ");
    lines.push(`**Top reviewers:** ${top}`);
  }
  return lines.join("\n");
}
