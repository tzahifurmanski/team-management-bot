import { DataSource } from "typeorm";
import { Team } from "../entities/Team";
import { AskChannel } from "../entities/AskChannel";
import { ZendeskIntegration } from "../entities/ZendeskIntegration";
import { CodeReviewChannel } from "../entities/CodeReviewChannel";
import { logger } from "../settings/server_consts";
import path from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// Create AppDataSource as a global instance
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  entities: [Team, AskChannel, ZendeskIntegration, CodeReviewChannel],
  migrations: [path.join(__dirname, "../migrations/*.{js,ts}")],
  migrationsTableName: "typeorm_migrations",
  logging: process.env.DATABASE_LOGGING === "true" || false,
  synchronize: false,
  // Use snake_case naming strategy
  namingStrategy: new SnakeNamingStrategy(),
});

// Function to initialize the database connection
export async function initializeDatabase(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    logger.info("Database connection established successfully");
    return true;
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    return false;
  }
}
