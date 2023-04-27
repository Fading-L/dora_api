const express = require('express');
const bodyParser = require('body-parser');
const {connection} = require('./database/index');
const app = express();
const { port, secretKey }= require('./config');
const jwt = require('jsonwebtoken');
const verifyToken = require('./utils/token');

const { gptUrl } = require('./config');

// 使用 body-parser 中间件解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// 会员登录
app.post('/members/login', async (req, res) => {
    const { name, password } = req.body;
    const sql = `SELECT * FROM members WHERE name = ? AND password = ?`;
    const values = [name, password];
    connection.query(sql, values, (error, results) => {
        console.log(results);
        if(error){
            return res.status(404).send({ message: '用户名或密码错误' });
        }
        const token = jwt.sign({ name }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ message: '登录成功', token });
    });
});

app.use(verifyToken);
// 调用支付宝接口
app.post('/members/:id/alipay', (req, res) => {


})

// 调用微信接口
app.post('/members/:id/wechat', (req, res) => {


})

// 获取会员列表

app.get('/members', (req, res) => {

})

// 获取单个会员剩余积分
app.get('/members/:id/points', (req, res) => {

})

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

// 向 GPT-3 提交 API 请求
app.post('/gpt', (req, res) => {
    const { prompt } = req.body;
    const url = `${gptUrl}`;
    const body = { prompt };
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            console.log(response)
            response.json();
        })
        .then(data => res.send(data))
        .catch(error => res.status(500).send(error));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});