import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Comment, Favorite, Friend, Post, Profile, Review, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { ReviewDoc } from "./concepts/review";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);

    const created = await User.create(username, password);

    if (created.user) {
      await Profile.create(created.user._id); // automatically creates profile for user
    }

    return created;
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);

    await Profile.delete(user); // should delete user profile once user is deleted

    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    if (created.post) {
      await Profile.addPost(user, created.post._id);
    }

    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    await Profile.removePost(user, _id);

    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/comments/item/:_itemId")
  async getCommentsByItem(_itemId: ObjectId) {
    return await Comment.getByAssociatedItem(_itemId);
  }

  @Router.post("/comments/item/:_itemId")
  async addComment(session: WebSessionDoc, text: string, _itemId: ObjectId) {
    // Posts comment
    // session: identifies user
    // text: message in the comment
    // _id: ID of the item to add comment on
    const user = WebSession.getUser(session);
    const created = await Comment.create(user, text, _itemId);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }
  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    // Deletes comment
    // session: identifies user
    // _id: ID of the comment to remove
    const user = WebSession.getUser(session);
    await Comment.isAuthor(user, _id);
    return Comment.delete(_id);
  }
  @Router.post("/favorites/:_postId")
  async savePost(session: WebSessionDoc, _postId: ObjectId) {
    // Adds post to user's favorites (and automatically adds to user profile)
    // session: identifies user
    // _id: ID of the item (such as post) to save
    const user = WebSession.getUser(session);
    console.log("reaches here");
    await Profile.addFavorite(user, _postId);

    return await Favorite.addToFavorites(user, _postId);
  }
  @Router.delete("/favorites/:_postId")
  async unsavePost(session: WebSessionDoc, _postId: ObjectId) {
    // Removes post from user's favorites (and automatically deletes from user profile)
    // session: identifies user
    // _id: ID of the item to unsave
    console.log("reaches here");
    const user = WebSession.getUser(session);
    await Profile.removeFavorite(user, _postId);

    return await Favorite.removeFromFavorites(user, _postId);
  }

  @Router.get("/posts/numSaves/:_postId")
  async getNumberSavesByPost(_postId: ObjectId) {
    return await Favorite.countItemFavorites(_postId);
  }

  @Router.get("/favorites")
  async getFavorites(username?: string) {
    let favorites;
    if (username) {
      const id = (await User.getUserByUsername(username))._id;
      favorites = await Favorite.getByUser(id);
    } else {
      favorites = await Favorite.getFavorites({});
    }
    return Responses.favorites(favorites);
  }

  @Router.get("/reviews")
  async getReviews(author?: string) {
    let reviews;
    if (author) {
      try {
        const id = (await User.getUserByUsername(author))._id;
        reviews = await Review.getByAuthor(id);
      } catch (error) {
        reviews = await Review.getByStore(author);
      }
    } else {
      reviews = await Review.getReviews({});
    }
    return Responses.reviews(reviews);
  }

  @Router.get("/reviews/store")
  async getReviewsByStore(storeName?: string) {
    let reviews;
    if (storeName) {
      reviews = await Review.getByStore(storeName);
    } else {
      console.log("hi");
      reviews = await Review.getReviews({});
      console.log(reviews);
    }
    return Responses.reviews(reviews);
  }

  @Router.post("/reviews")
  async createReview(session: WebSessionDoc, link: string, content: string, rating: number, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Review.create(user, link, content, rating, options);

    if (created.review) {
      await Profile.addReview(user, created.review._id);
    }

    return { msg: created.msg, review: await Responses.review(created.review) };
  }

  @Router.patch("/reviews/:_id")
  async updateReview(session: WebSessionDoc, _id: ObjectId, update: Partial<ReviewDoc>) {
    const user = WebSession.getUser(session);
    await Review.isAuthor(user, _id);

    return await Review.update(_id, update);
  }

  @Router.delete("/reviews/:_id")
  async deleteReview(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Review.isAuthor(user, _id);
    await Profile.removeReview(user, _id);

    return Review.delete(_id);
  }

  @Router.get("/profile/:username")
  async getProfile(session: WebSessionDoc, username: string) {
    // Should only be able to view someone's profile if you're friends with them.
    // Can always view your own profile
    const currentUser = WebSession.getUser(session);
    const userToView = await User.getUserByUsername(username);
    const currentUserFriends = await Friend.getFriends(currentUser);
    const currentUserFriendStrings = currentUserFriends.map((friend) => friend.toString());

    if (currentUser.toString() !== userToView._id.toString() && !currentUserFriendStrings.includes(userToView._id.toString())) {
      return { msg: `Cannot view profile, you and ${username} are not friends` };
    }

    return Profile.getProfileByUser(userToView._id);
  }

  @Router.patch("/profile/:username")
  async updateProfile(session: WebSessionDoc, username: string, update: Partial<PostDoc>) {
    const currentUser = WebSession.getUser(session);

    const profileUser = await User.getUserByUsername(username);
    const profile = await Profile.getProfileByUser(profileUser._id);
    await Profile.isUser(currentUser, profile._id);

    return await Profile.update(profile._id, update);
  }
}

export default getExpressRouter(new Routes());
