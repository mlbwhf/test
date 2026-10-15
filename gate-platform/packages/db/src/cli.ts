import { createPool } from "./pool.js";
import { migrate } from "./migrate.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const pool = createPool(url);
migrate(pool)
  .then((ran) => {
    console.log(ran.length ? `applied: ${ran.join(", ")}` : "up to date");
    return pool.end();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
