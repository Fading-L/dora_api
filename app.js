const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

// 连接 MySQL 数据库
const connection = mysql.createConnection({
    host: '47.108.80.134',
    port: 3306,
    user: 'dora',
    password: 'YP5MZY5smhCmKAYG',
    database: 'dora'
});

// 使用 body-parser 中间件解析请求体
app.use(bodyParser.json());

// 注册会员
app.post('/members', (req, res) => {
    const { name, email, password } = req.body;
    const sql = `INSERT INTO members (name, email, password) VALUES (?, ?, ?)`;
    const values = [name, email, password];
    connection.query(sql, values, (error, result) => {
        if (error) {
            return res.status(500).send(error);
        }
        const member = { id: result.insertId, name, email, password, points: 0 };
        res.send(member);
    });
});

// 充值签到获得积分
app.post('/members/:id/recharge', (req, res) => {
    const { id } = req.params;
    const { points } = req.body;
    const sql = `SELECT * FROM members WHERE id = ?`;
    connection.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).send(error);
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'Member not found' });
        }
        const member = results[0];
        member.points += points;
        const updateSql = `UPDATE members SET points = ? WHERE id = ?`;
        const updateValues = [member.points, id];
        connection.query(updateSql, updateValues, (error, result) => {
            if (error) {
                return res.status(500).send(error);
            }
            res.send(member);
        });
    });
});

// 消耗积分提交 API 次数
app.post('/members/:id/submit', (req, res) => {
    const { id } = req.params;
    const { points } = req.body;
    const sql = `SELECT * FROM members WHERE id = ?`;
    connection.query(sql, [id], (error, results) => {
        if (error) {
            return res.status(500).send(error);
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'Member not found' });
        }
        const member = results[0];
        if (member.points < points) {
            return res.status(400).send({ message: 'Not enough points' });
        }
        member.points -= points;
        const updateSql = `UPDATE members SET points = ? WHERE id = ?`;
        const updateValues = [member.points, id];
        connection.query(updateSql, updateValues, (error, result) => {
            if (error) {
                return res.status(500).send(error);
            }
            res.send(member);
        });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});