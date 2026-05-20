import express from "express";
import cors from "cors";
import routes from "./routes/incidents.js";
import userRoutes from "./routes/users.js";
import { db } from "./db/db.js";
import fs from "fs";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import { seedDatabase } from "./db/seed.js";

const app = express();

app.use(express.json());

app.use(cors({

 origin: "http://localhost:5173",

 methods: [
  "GET",
  "POST",
  "PUT",
  "DELETE"
 ],

 allowedHeaders: [
  "Content-Type"
 ]
}));

const schemaPath = path.resolve("db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

db.exec(schema, (err) => {

 if (err) {
  console.error(err);

 } else {

  console.log("Schema created");

  seedDatabase();
 }
});

app.use("/api/v1/incidents", routes);
app.use("/api/v1/users", userRoutes);

app.use(errorHandler);

app.listen(3000, () => {
 console.log("Server running on port 3000");
});