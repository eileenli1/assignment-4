import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  user: ObjectId;
  profilePicture?: string; // image url pointing to profile pic
  posts: ObjectId[]; // posts associated with this user
  reviews: ObjectId[]; // reviews associated with this user
  favorites: ObjectId[]; // collection of posts user has saved
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(user: ObjectId, profilePicture?: string) {
    // When creating profile, always start out with no posts/reviews/favorites
    const posts: ObjectId[] = [];
    const reviews: ObjectId[] = [];
    const favorites: ObjectId[] = [];

    const _id = await this.profiles.createOne({ user, profilePicture, posts, reviews, favorites });
    return { msg: "Profile successfully created!", profile: await this.profiles.readOne({ _id }) };
  }

  async getProfiles(query: Filter<ProfileDoc>) {
    const profiles = await this.profiles.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return profiles;
  }

  async getProfileByUser(user: ObjectId) {
    return await this.getProfiles({ user });
  }

  async update(_id: ObjectId, update: Partial<ProfileDoc>) {
    this.sanitizeUpdate(update);
    await this.profiles.updateOne({ _id }, update);
    return { msg: "Profile successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.profiles.deleteOne({ _id });
    return { msg: "Profile deleted successfully!" };
  }

  async getPosts(user: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    return profile.posts;
  }

  async getReviews(user: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    return profile.reviews;
  }

  async getFavorites(user: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    return profile.favorites;
  }

  async addPost(user: ObjectId, post: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const posts = await this.getPosts(user);
    posts.push(post);

    await this.profiles.updateOne({ user }, { posts: posts });
    return { msg: "Successfully added post to profile!" };
  }

  async addReview(user: ObjectId, review: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const reviews = await this.getReviews(user);
    reviews.push(review);

    await this.profiles.updateOne({ user }, { reviews: reviews });
    return { msg: "Successfully added review to profile!" };
  }

  async addFavorite(user: ObjectId, favorite: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const favorites = await this.getFavorites(user);
    favorites.push(favorite);

    await this.profiles.updateOne({ user }, { favorites: favorites });
    return { msg: "Successfully added favorite to profile!" };
  }

  async removePost(user: ObjectId, post: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const posts = await this.getPosts(user);
    const postIndex = posts.indexOf(post);
    if (postIndex == -1) {
      throw new NotFoundError(`Post with the given id: ${post} is not associated with this profile`);
    }
    posts.splice(postIndex, 1);

    await this.profiles.updateOne({ user }, { posts: posts });
    return { msg: "Successfully deleted post from profile!" };
  }

  async removeReview(user: ObjectId, review: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const reviews = await this.getReviews(user);
    const reviewIndex = reviews.indexOf(review);
    return { msg: `this is the returned ${reviews} and ${reviewIndex}` };
    // if (reviewIndex == -1) {
    //   throw new NotFoundError(`Review with the given id: ${review} is not associated with this profile`);
    // }
    // reviews.splice(reviewIndex, 1);

    // await this.profiles.updateOne({ user }, { reviews: reviews });
    // return { msg: "Successfully deleted review from profile!" };
  }

  async removeFavorite(user: ObjectId, favorite: ObjectId) {
    const profile = await this.profiles.readOne({ user });

    if (!profile) {
      throw new NotFoundError(`Profile for the given user: ${user} doesn't exist`);
    }
    const favorites = await this.getFavorites(user);
    const favoriteIndex = favorites.indexOf(favorite);
    if (favoriteIndex == -1) {
      throw new NotFoundError(`Favorite with the given id: ${favorite} is not associated with this profile`);
    }
    favorites.splice(favoriteIndex, 1);

    await this.profiles.updateOne({ user }, { favorites: favorites });
    return { msg: "Successfully deleted favorite from profile!" };
  }

  private sanitizeUpdate(update: Partial<ProfileDoc>) {
    // Make sure the update can only update the profile picture.
    // Posts/Favorites/etc. should be automatically populated (can't manually update)
    const allowedUpdates = ["profilePicture"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
