'use strict';
const CronJob = require('cron').CronJob;
const request = require('request');
const http = require('http');
const sourceURL = 'https://tw.rter.info/json.php?t=currency&q=cash&iso=JPY&_=1468308169217';
const telegramBot = process.env.BOT;
const MAXBANK = 5;

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
            parse_mode: 'Markdown'
        }
    }, (err, res, body) => {
        if( !err && res.statusCode === 200 ){
            console.log('Send Successfully');
            return true;
        }
        console.log(err);
        console.log(body);
        let time = new Date(body.result.date)
        console.log(`Something wrong ${time}`);
    })
}
new CronJob('*/3 * * * * *', function() {
    getData((rate) => {
        if (rate === null) return 0

        let message = "銀行名稱-買入匯率-買出匯率-更新時間-備註\n"
        rate.data = rate.data.sort((a, b) => {
            let a_buy = parseFloat(a[2]),
                b_buy = parseFloat(b[2]);
            return a_buy - b_buy
        })

        let count = 0;
        for (let item of rate.data) {
            if( count >= MAXBANK ) break;

            let bank_name = item[0].split('>')[2].split('<')[0],
            buy_rate = item[1],
            sell_rate = item[2],
            update_time = item[3],
            note = item[4].split('<br>').join();

            message += `${bank_name}-${buy_rate}-${sell_rate}-${update_time}-${note}\n`
            count += 1;
        }
        sendMessage(message)
    })
}, null, true, 'America/Los_Angeles');
