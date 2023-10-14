import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ReviewOptions {
  backgroundColor?: string;
}

export interface ReviewDoc extends BaseDoc {
  author: ObjectId;
  link: string; // contains the url of the clothing item this review is for
  content: string; // a written review of the clothing item
  rating: number; // a rating (out of 10)
  options?: ReviewOptions;
}

export default class ReviewConcept {
  public readonly reviews = new DocCollection<ReviewDoc>("reviews");

  async create(author: ObjectId, link: string, content: string, rating: number, options?: ReviewOptions) {
    const _id = await this.reviews.createOne({ author, link, content, rating, options });
    return { msg: "Review successfully created!", review: await this.reviews.readOne({ _id }) };
  }

  async getReviews(query: Filter<ReviewDoc>) {
    const reviews = await this.reviews.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return reviews;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getReviews({ author });
  }

  async update(_id: ObjectId, update: Partial<ReviewDoc>) {
    this.sanitizeUpdate(update);
    await this.reviews.updateOne({ _id }, update);
    return { msg: "Review successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.reviews.deleteOne({ _id });
    return { msg: "Review deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const review = await this.reviews.readOne({ _id });
    if (!review) {
      throw new NotFoundError(`Review ${_id} does not exist!`);
    }
    if (review.author.toString() !== user.toString()) {
      throw new ReviewAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<ReviewDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "options", "link", "rating"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ReviewAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of review {1}!", author, _id);
  }
}
