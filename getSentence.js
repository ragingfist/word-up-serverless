'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(word) {
    return axios.get(`http://sentence.yourdictionary.com/${word}`)
        .then((resp) => {
            let $ = cheerio.load(resp.data);
            let sentences = [];
            $('.li_content').each(function() {
                sentences.push($(this).text());
            });
            console.log(sentences);
            return sentences;
        });
};
