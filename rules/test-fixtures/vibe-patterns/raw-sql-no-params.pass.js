// ok: raw-sql-string-concat
db.query("SELECT * FROM users WHERE id = $1", [userId]);

// ok: raw-sql-string-concat
db.query("SELECT * FROM users WHERE name = ? AND age > ?", [name, age]);

// ok: raw-sql-string-concat
connection.execute("DELETE FROM sessions WHERE token = $1", [token]);

// ok: raw-sql-template-literal
knex("users").where({ id: userId }).select("*");

// ok: raw-sql-template-literal
db.query("SELECT * FROM products WHERE active = true");

// ok: raw-sql-template-literal
prisma.user.findMany({ where: { id: userId } });
