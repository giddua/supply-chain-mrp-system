import { SQLDatabase } from "encore.dev/storage/sqldb";

export const demandDB = new SQLDatabase("demand", {
  migrations: "./migrations",
});
