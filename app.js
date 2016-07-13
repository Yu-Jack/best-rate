'use strict';
require('./.env');
const CronJob = require('cron').CronJob;
const request = require('request');
const http = require('http');
const sourceURL = 'https://tw.rter.info/json.php?t=currency&q=cash&iso=JPY&_=1468308169217';
const telegramBot = process.env.BOT;
const MAXBANK = 5;
const Table = require('cli-table');

const getData = (callback) => {
    request.get(sourceURL, (err, res, body) => {
        let data;
        try {
            data = JSON.parse(body)
        } catch (e) {
            console.log(e);
            return callback(null)
        }
        return callback(data);
    })
}

const sendMessage = (message) => {
    request({
        method: 'post',
        url: telegramBot,
        headers:{
            'Content-Type': 'application/json'
        },
        json: {
            chat_id: '-1001068350683',
            text: message,
            parse_mode: 'HTML'
        }
    }, (err, res, body) => {
        if( !err && res.statusCode === 200 ){
            console.log('Send Successfully');
            return true;
        }
        console.log(err);
        console.log(body);
    })
}

const generateTable = (top_bank) => {
    // instantiate
    var table = new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
         , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
         , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
         , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: {
            head: [],
            border: []
        }
    });

    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    let count = 1;
    for (let bank of top_bank) {
        let message = '';
        message += `${bank.bank_name}\n`;
        message += `買入 : ${bank.buy_rate}\n`;
        message += `賣出 : ${bank.sell_rate}\n`;
        message += `${bank.note}\n\n`
        table.push([message]);
    }
    return `<code>${table.toString()}</code>`;
}

new CronJob('*/3 * * * * *', function() {
    getData((rate) => {
        if (rate === null) return 0

        rate.data = rate.data.sort((a, b) => {
            let a_buy = parseFloat(a[2]),
                b_buy = parseFloat(b[2]);
            return a_buy - b_buy
        })

        let count = 0,
            top_bank = [];
        for (let item of rate.data) {
            if( count >= MAXBANK ) break;

            let bank_name = item[0].split('>')[2].split('<')[0],
            buy_rate = item[1],
            sell_rate = item[2],
            update_time = item[3],
            note = item[4].split('<br>').join('\n');

            top_bank.push({
                bank_name: bank_name,
                buy_rate: buy_rate,
                sell_rate: sell_rate,
                note: note
            });
            count += 1;
        }
        sendMessage(generateTable(top_bank))
    })
}, null, true, 'America/Los_Angeles');
