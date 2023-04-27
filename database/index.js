const mysql = require('mysql');

// 连接 MySQL 数据库
const connection = mysql.createConnection({
    host: '47.108.80.134',
    port: 3306,
    user: 'dora',
    password: 'YP5MZY5smhCmKAYG',
    database: 'dora'
});

module.exports.connection = connection;