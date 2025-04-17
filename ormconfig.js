// ormconfig.js
module.exports = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV !== "production",
  entities: ["dist/entities/**/*.js"],
  migrations: ["dist/migrations/**/*.js"],
  subscribers: ["dist/subscribers/**/*.js"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migrations",
    subscribersDir: "src/subscribers",
  },
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false, // Required for Heroku Postgres
        }
      : false,
};
