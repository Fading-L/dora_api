const express = require('express');
const bodyParser = require('body-parser');
const {connection} = require('./database/index');
const app = express();
const { port, secretKey }= require('./config');
const jwt = require('jsonwebtoken');
const verifyToken = require('./utils/token');
const axios = require('axios');
const { gptUr,host } = require('./config');
const {filterWords}= require('./utils/bad-words-filter');

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
// 获取单个会员剩余积分
app.get('/members/:id/points', (req, res) => {

    const { id } = req.params;
    const sql = `SELECT * FROM members WHERE id = ?`;
    connection.query(sql, [id], (error, results) => {
        results = results[0];
        if (error) {
            return res.status(500).send({ message: '查询错误' });
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'Member not found' });
        }
        res.send({ points: results.points });
    })
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
    console.log(filterWords(prompt));
    filterWords(prompt)?
        res.status(400).send({message:'包含敏感词'}):
    axios.post(url, body).then(result=>{
        // console.log(result.data);
        res.send(result.data);
    }).catch(err=>{
        return res.status(500).send(err);
    })
});

// 启动服务器
app.listen(port,host, () => {
    console.log(`Server listening at http://${host}:${port}`);
});



