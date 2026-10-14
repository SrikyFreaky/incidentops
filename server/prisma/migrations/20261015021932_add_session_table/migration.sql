-- Hand-written (not derived from schema.prisma) — this table is owned and
-- queried by connect-pg-simple, not by Prisma Client, so it has no model
-- in the schema. It's included as a real migration instead of relying on
-- connect-pg-simple's own `createTableIfMissing` because that option
-- creates the table lazily on the server's first request, which races:
-- the very first request to hit a fresh environment can 500 while the
-- table is still being created. Creating it up front via migration means
-- it always exists before the app ever serves traffic.
-- DDL copied from connect-pg-simple's own documented table/HTTPS.md.
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS = FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
