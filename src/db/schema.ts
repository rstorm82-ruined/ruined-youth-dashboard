import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const platformEnum = pgEnum("platform", [
  "instagram",
  "tiktok",
  "twitter",
  "facebook",
  "youtube",
  "threads",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "pending_approval",
  "scheduled",
  "posting",
  "posted",
  "failed",
]);

export const profileGroups = pgTable("profile_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  groupId: integer("group_id").references(() => profileGroups.id),
  platform: platformEnum("platform").notNull(),
  zernioAccountId: varchar("zernio_account_id", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  healthStatus: varchar("health_status", { length: 50 }).default("healthy"),
  lastPostedAt: timestamp("last_posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hashtagGroups = pgTable("hashtag_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  captionTemplate: text("caption_template").notNull(),
  hashtagGroupId: integer("hashtag_group_id").references(() => hashtagGroups.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array().default([]),
  status: postStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  postedAt: timestamp("posted_at"),
  profileIds: integer("profile_ids").array().notNull(),
  failureReason: text("failure_reason"),
  zernioJobId: varchar("zernio_job_id", { length: 255 }),
  recycleAfterDays: integer("recycle_after_days"),
  isRecycled: boolean("is_recycled").default(false),
  originalPostId: integer("original_post_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postAnalytics = pgTable("post_analytics", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .references(() => posts.id)
    .notNull(),
  profileId: integer("profile_id")
    .references(() => profiles.id)
    .notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const dms = pgTable("dms", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .references(() => profiles.id)
    .notNull(),
  platform: platformEnum("platform").notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  senderAvatarUrl: text("sender_avatar_url"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  zernioMessageId: varchar("zernio_message_id", { length: 255 }),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type ProfileGroup = typeof profileGroups.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type HashtagGroup = typeof hashtagGroups.$inferSelect;
export type DM = typeof dms.$inferSelect;
