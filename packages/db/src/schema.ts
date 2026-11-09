import { boolean, inet, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  reputationScore: integer("reputation_score").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const ips = pgTable("ips", {
  id: uuid("id").defaultRandom().primaryKey(),
  ipAddress: inet("ip_address").notNull().unique(),
  asnProvider: varchar("asn_provider", { length: 255 }),
  threatWeight: integer("threat_weight").notNull().default(0)
});
export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  serialNumber: varchar("serial_number", { length: 255 }).notNull().unique(),
  issuer: text("issuer"),
  threatWeight: integer("threat_weight").notNull().default(0)
});
export const domHashes = pgTable("dom_hashes", {
  id: uuid("id").defaultRandom().primaryKey(),
  hashValue: varchar("hash_value", { length: 64 }).notNull().unique(),
  threatWeight: integer("threat_weight").notNull().default(0)
});
export const threatEvents = pgTable("threat_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  domainName: varchar("domain_name", { length: 255 }).notNull().unique(),
  reportedBy: uuid("reported_by").references(() => users.id, { onDelete: "set null" }),
  ipId: uuid("ip_id").references(() => ips.id, { onDelete: "set null" }),
  certId: uuid("cert_id").references(() => certificates.id, { onDelete: "set null" }),
  domHashId: uuid("dom_hash_id").references(() => domHashes.id, { onDelete: "set null" }),
  aiConfidenceScore: integer("ai_confidence_score").notNull().default(0),
  impersonatedBrand: varchar("impersonated_brand", { length: 100 }),
  verdict: varchar("verdict", { length: 32 }).notNull().default("suspicious"),
  trustScore: integer("trust_score").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const threatRelations = relations(threatEvents, ({ one }) => ({
  ip: one(ips, { fields: [threatEvents.ipId], references: [ips.id] }),
  certificate: one(certificates, { fields: [threatEvents.certId], references: [certificates.id] }),
  domHash: one(domHashes, { fields: [threatEvents.domHashId], references: [domHashes.id] })
}));
