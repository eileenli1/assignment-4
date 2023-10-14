import CommentConcept from "./concepts/comment";
import FavoriteConcept from "./concepts/favorite";
import FriendConcept from "./concepts/friend";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import ReviewConcept from "./concepts/review";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Comment = new CommentConcept();
export const Favorite = new FavoriteConcept();
export const Review = new ReviewConcept();
export const Profile = new ProfileConcept();
