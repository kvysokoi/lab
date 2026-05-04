import express from "express";
import routes from "./routes/incidents.js";
import userRoutes from "./routes/users.js";
import { db } from "./db/db.js";
import fs from "fs";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

const schemaPath = path.resolve("db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
console.log(schema);

db.exec(schema, (err) => {
 if (err) console.error(err);
 else console.log("Schema created");
});

app.use("/api/v1/incidents", routes);
app.use("/api/v1/users", userRoutes);

app.use(errorHandler);

app.listen(3000, () => {
 console.log("Server running on port 3000");
});