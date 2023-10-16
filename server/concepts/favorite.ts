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
    const favoriteItemIds = await this.getFavoriteItemIds(user);
    const favoriteItemIdStrings = favoriteItemIds.map((id) => id.toString());

    if (favoriteItemIdStrings.includes(item.toString())) {
      throw new DuplicateFavoriteError(user, item);
    }

    const _id = await this.favorites.createOne({ user, item });

    return { msg: "Post successfully added to favorites!", favorite: await this.favorites.readOne({ _id }) };
  }

  async removeFromFavorites(user: ObjectId, item: ObjectId) {
    //const _favoriteId = await this.favorites.readOne({ user, item });
    const favoriteItemIds = await this.getFavoriteItemIds(user);
    const favoriteItemIdStrings = favoriteItemIds.map((id) => id.toString());

    if (!item.toString() || !favoriteItemIdStrings.includes(item.toString())) {
      throw new FavoriteDoesNotExistError(user, item);
    }

    await this.favorites.deleteOne({ user, item });
    return { msg: "Post deleted successfully from favorites!" };
  }

  async getFavorites(query: Filter<FavoriteDoc>) {
    const posts = await this.favorites.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getFavoriteItemIds(user: ObjectId) {
    const favorites = await this.getByUser(user);

    return favorites.map((favorite) => favorite.item);
  }

  async getByUser(user: ObjectId) {
    return await this.getFavorites({ user: user });
  }

  async getByItem(item: ObjectId) {
    return await this.getFavorites({ item });
  }

  async countItemFavorites(item: ObjectId) {
    return await this.favorites.count({ item });
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
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user associated with favorite {1}!", user, _id);
  }
}

export class DuplicateFavoriteError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly itemId: ObjectId,
  ) {
    super("{0} is already favorited by user {1}!", itemId, user);
  }
}

export class FavoriteDoesNotExistError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly itemId: ObjectId,
  ) {
    super("{0} is not in user {1}'s favorites!", itemId, user);
  }
}
