import { DataSource } from "typeorm";
import { Team } from "../entities/Team.js";
import { AskChannel } from "../entities/AskChannel.js";
import { ZendeskIntegration } from "../entities/ZendeskIntegration.js";
import { CodeReviewChannel } from "../entities/CodeReviewChannel.js";
import { logger } from "../settings/server_consts.js";
import path from "path";
import { fileURLToPath } from "url";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  migrations: [path.join(__dirname, "../migrations/*.{js,ts,cjs}")],
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
