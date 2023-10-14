import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FavoriteDoc extends BaseDoc {
  user: ObjectId;
  item: ObjectId; // generic, can represent posts, etc.
}

export default class FavoriteConcept {
  public readonly favorites = new DocCollection<FavoriteDoc>("favorites");

  async addToFavorites(user: ObjectId, item: ObjectId) {
    const _id = await this.favorites.createOne({ user, item });
    return { msg: "Post successfully added to favorites!", favorite: await this.favorites.readOne({ _id }) };
  }

  async getFavorites(query: Filter<FavoriteDoc>) {
    const posts = await this.favorites.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getByUser(user: ObjectId) {
    return await this.getFavorites({ user });
  }

  async getByItem(item: ObjectId) {
    return await this.getFavorites({ item });
  }

  async countItemFavorites(item: ObjectId) {
    return await this.favorites.count({ item });
  }

  async removeFromFavorites(user: ObjectId, _id: ObjectId) {
    await this.favorites.deleteOne({ user, _id });
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
