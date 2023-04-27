const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).send({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Invalid token' });
    }
}

module.exports = verifyToken;