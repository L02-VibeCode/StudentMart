import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { loadConfig } from "../config/env";
import { databaseOptions } from "./database-options";

export default new DataSource(databaseOptions(loadConfig()));
