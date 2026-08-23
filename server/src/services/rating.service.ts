import { Types } from "mongoose";
import { Rating } from "../models/rating.model.js";
import { Lineup } from "../models/lineup.model.js";

export interface RatingAggregates {
  averageRating: number;
  ratingsCount: number;
  distribution: Record<number, number>;
}

export async function recomputeRatingAggregates(
  lineupId: Types.ObjectId | string,
): Promise<RatingAggregates> {
  const id = new Types.ObjectId(String(lineupId));

  const result = await Rating.aggregate<{
    _id: number;
    count: number;
  }>([
    { $match: { lineup: id } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of result) {
    distribution[row._id] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }

  const averageRating = total === 0 ? 0 : Math.round((sum / total) * 10) / 10;

  await Lineup.updateOne(
    { _id: id },
    {
      averageRating,
      ratingsCount: total,
      ratingDistribution: distribution,
    },
  );

  return { averageRating, ratingsCount: total, distribution };
}
