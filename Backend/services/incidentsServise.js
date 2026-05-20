import { db } from "../db/db.js";

export function getAll(callback) {

 db.all(`
 SELECT * FROM incidents
 ORDER BY id DESC
 `, callback);
}

export function getOne(id, callback) {

 db.get(`
 SELECT * FROM incidents
 WHERE id=${id}
 `, callback);
}

export function create(data, callback) {

 db.run(`
 INSERT INTO incidents(
  date,
  tag,
  severity,
  comments,
  reporter,
  user_id
 )
 VALUES(
  '${data.date}',
  '${data.tag}',
  '${data.severity}',
  '${data.comments}',
  '${data.reporter}',
  ${data.user_id}
 )
 `, callback);
}

export function remove(id, callback) {

 db.run(`
 DELETE FROM incidents
 WHERE id=${id}
 `, callback);
}

export function getStats(callback) {

 db.get(`
 SELECT COUNT(*) as total
 FROM incidents
 `, callback);
}

export function getFull(callback) {

 db.all(`
 SELECT
  incidents.id,
  incidents.tag,
  incidents.severity,
  users.username
 FROM incidents
 JOIN users
 ON incidents.user_id = users.id
 ORDER BY incidents.id DESC
 `, callback);
}

export function search(tag, callback) {

 db.all(`
 SELECT *
 FROM incidents
 WHERE tag='${tag}'
 `, callback);
}

export function getCountBySeverityForUser(userId, callback) {

 db.all(`
 SELECT
  severity,
  COUNT(*) as count
 FROM incidents
 WHERE user_id = ${userId}
 GROUP BY severity
 `, callback);
}