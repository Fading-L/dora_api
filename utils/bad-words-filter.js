const badWordsFilter = require('bad-words-chinese');
const path = require('path');
const fs = require('fs');

// 自行新增敏感词
let blacklist = {
    englishList: ['big', 'fat', 'pig'],
    chineseList: ['大', '胖', '豬']
}
// 读取敏感词文件
fs.readFileSync(path.join(__dirname, 'bad-words.txt'), 'utf8', (err, data) => {

    const tempArr = data.split(",");
    let chineseList = [];
    let englishList = [];
    const reg = /^[\u4e00-\u9fa5]+$/;
    tempArr.forEach(item => {
        reg.test(item) ? chineseList.push(item) : englishList.push(item);

    });
    blacklist = {chineseList,englishList};
    // return {chineseList,englishList};
});


filter = new badWordsFilter(blacklist);

// 过滤敏感词
function filterWords(words){
       return filter.isProfane(words);
}

module.exports = {filterWords};
