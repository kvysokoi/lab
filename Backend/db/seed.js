import { db } from "./db.js";

export function seedDatabase() {

 
 db.run(`
 INSERT INTO users (username)
 VALUES ('student1')
 `);

 db.run(`
 INSERT INTO users (username)
 VALUES ('student2')
 `);

 // TAGS
 db.run(`
 INSERT INTO tags (name)
 VALUES ('phishing')
 `);

 db.run(`
 INSERT INTO tags (name)
 VALUES ('malware')
 `);

 // INCIDENTS
 db.run(`
 INSERT INTO incidents (
  date, tag, severity, reporter, user_id
 )
 VALUES (
  '2026-03-10', 'phishing', 'high', 'student1', 1
 )
 `);

 db.run(`
 INSERT INTO incidents (
  date, tag, severity, reporter, user_id
 )
 VALUES (
  '2026-03-11', 'malware', 'low', 'student1', 1
 )
 `);

 db.run(`
 INSERT INTO incidents (
  date, tag, severity, reporter, user_id
 )
 VALUES (
  '2026-03-12', 'phishing', 'medium', 'student1', 1
 )
 `);

 db.run(`
 INSERT INTO incidents (
  date, tag, severity, reporter, user_id
 )
 VALUES (
  '2026-03-13', 'malware', 'high', 'student2', 2
 )
 `);

 // COMMENTS
 db.run(`
 INSERT INTO comments (incident_id, text)
 VALUES (1, 'Suspicious email')
 `);

 db.run(`
 INSERT INTO comments (incident_id, text)
 VALUES (2, 'Virus detected')
 `);
 }
 