import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FavoriteDoc extends BaseDoc {
  user: ObjectId;
  post: ObjectId;
}

export default class FavoriteConcept {
  public readonly favorites = new DocCollection<FavoriteDoc>("favorites");

  async addToFavorites(user: ObjectId, post: ObjectId) {
    const _id = await this.favorites.createOne({ user, post });
    return { msg: "Post successfully added to favorites!", post: await this.favorites.readOne({ _id }) };
  }

  async getFavorites(query: Filter<FavoriteDoc>) {
    const posts = await this.favorites.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getByUser(author: ObjectId) {
    return await this.getFavorites({ author });
  }

  async removeFromFavorites(_id: ObjectId) {
    await this.favorites.deleteOne({ _id });
    return { msg: "Post deleted successfully from favorites!" };
  }

  async isUser(user: ObjectId, _id: ObjectId) {
    const favorite = await this.favorites.readOne({ _id });
    if (!favorite) {
      throw new NotFoundError(`Post ${_id} does not exist in ${user}'s favorites!`);
    }
    if (favorite.user.toString() !== user.toString()) {
      throw new FavoriteUserNotMatchError(user, _id);
    }
  }
}

export class FavoriteUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user associated with favorite {1}!", author, _id);
  }
}
