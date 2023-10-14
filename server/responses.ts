import { User } from "./app";
import { CommentDoc } from "./concepts/comment";
import { FavoriteDoc } from "./concepts/favorite";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { ReviewDoc } from "./concepts/review";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Convert CommentDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await User.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Convert ProfileDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async profile(profile: ProfileDoc | null) {
    if (!profile) {
      return profile;
    }
    const user = await User.getUserById(profile.user);
    return { ...profile, user: user.username };
  }

  /**
   * Convert ReviewDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async review(review: ReviewDoc | null) {
    if (!review) {
      return review;
    }
    const author = await User.getUserById(review.author);
    return { ...review, user: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Same as {@link post} but for an array of ReviewDoc for improved performance.
   */
  static async reviews(reviews: ReviewDoc[]) {
    const authors = await User.idsToUsernames(reviews.map((review) => review.author));
    return reviews.map((review, i) => ({ ...review, author: authors[i] }));
  }

  /**
   * Same as {@link post} but for an array of FavoriteDoc for improved performance.
   */
  static async favorites(favorites: FavoriteDoc[]) {
    const users = await User.idsToUsernames(favorites.map((favorite) => favorite.user));
    return favorites.map((favorite, i) => ({ ...favorite, user: users[i] }));
  }

  /**
   * Same as {@link post} but for an array of CommenteDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await User.idsToUsernames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
