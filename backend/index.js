const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',  // Change this to your MySQL password
  database: 'mydatabase'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL!');
  }
});

// API route to add user
app.post('/addUser', (req, res) => {
  const { name, email } = req.body;
  const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.query(query, [name, email], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error inserting user');
    } else {
      res.status(200).send('User added successfully!');
    }
  });
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
