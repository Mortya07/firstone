// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {integer,sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),owner:text('owner').notNull().unique(),name:text('name').notNull(),city:text('city').notNull(),specialty:text('specialty').notNull(),price:integer('price').notNull(),experience:integer('experience').notNull(),team:integer('team').notNull(),description:text('description').notNull(),phone:text('phone').notNull(),projects:text('projects').notNull().default('[]'),updatedAt:integer('updated_at').notNull()},t=>[index('idx_profiles_updated').on(t.updatedAt)]);
export const images=sqliteTable('images',{id:text('id').primaryKey(),owner:text('owner').notNull(),mime:text('mime').notNull(),createdAt:integer('created_at').notNull()});
export const rateLimits=sqliteTable('rate_limits',{id:text('id').primaryKey(),count:integer('count').notNull()});
