const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);
const app = express();

// parse the body into JS Objects
app.use(express.json());

// Log the requests as they come in
app.use(require("morgan")("dev"));

// Create Notes - C
app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
            INSERT INTO notes (txt) 
            VALUES($1)
            RETURNING *
            `;
    const response = await client.query(SQL, [req.body.txt]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Read Notes - R
app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
            SELECT * FROM notes ORDER BY created_at DESC;
            `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {}
});

// Update Notes - U
app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE notes
        SET txt=$1, ranking=$2, updated_at= now()
        WHERE id=$3 RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete Notes - D
app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
            DELETE from notes
            WHERE id = $1
            `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// create and run the express app
const init = async () => {
  await client.connect();
  console.log("conneted to database");
  let SQL = `
    DROP TABLE IF EXISTS notes;
    CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(255)
    );
    `;
  await client.query(SQL);
  console.log("table created");

  SQL = `
        INSERT INTO notes (txt, ranking) VALUES('learn express', 5);
        INSERT INTO notes (txt, ranking) VALUES('write SQL queries', 4);
        INSERT INTO notes (txt, ranking) VALUES('create routes', 2);
    `;
  await client.query(SQL);
  console.log("data seeded");
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
};

init();
