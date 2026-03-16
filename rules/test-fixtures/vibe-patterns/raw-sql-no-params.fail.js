// ruleid: raw-sql-string-concat
db.query("SELECT * FROM users WHERE id = " + userId);

// ruleid: raw-sql-string-concat
db.query("SELECT * FROM users WHERE name = '" + name + "'");

// ruleid: raw-sql-string-concat
connection.execute("DELETE FROM sessions WHERE token = " + token);

// ruleid: raw-sql-template-literal
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ruleid: raw-sql-template-literal
pool.execute(`INSERT INTO logs (message) VALUES ('${message}')`);

// ruleid: raw-sql-string-concat
knex.raw("SELECT * FROM products WHERE category = " + category);

// ruleid: raw-sql-template-literal
knex.raw(`SELECT * FROM products WHERE price > ${minPrice}`);
