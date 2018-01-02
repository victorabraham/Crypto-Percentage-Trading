require('dotenv').config();
var path = require('path');
var express = require('express');
const cors = require('cors');
var request = require('request');
var moment = require('moment-timezone');
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies
app.use(cors());
app.options('*', cors());

var staticPath = path.join(__dirname, '/public');
app.use(express.static(staticPath));

//CONSTANTS
var TRACKED_COINS = ['BTC', 'ETH', 'LTC'];
const Bittrex = require('./exchanges/bittrex');
// const Database = require('./database');

//Database.initializeDb();
let bit = new Bittrex();

// bit.getSummary()
//     .then((result) => {
//         console.log(result);
//     });

var topCoins = [];
var topSet = [];
var purchaseObj = {};


function getAggregates() {
    request('https://api.coinmarketcap.com/v1/ticker/?limit=100', function (error, response, data) {
        var coinList = JSON.parse(data);
        coinList.sort(function (a, b) {
            var a1h = parseFloat(a.percent_change_1h);
            var b1h = parseFloat(b.percent_change_1h);
            return a1h > b1h ? -1 : 1;
        });
        topCoins = coinList;
        let count = 0;
        for (let i = 0; i < 20; i++) {
            // (!purchaseObj['BTC-' + topCoins[i].symbol] || purchaseObj['BTC-' + topCoins[i].symbol].totalHoldings == 0)
            console.log('BTC-' + topCoins[i].symbol);
            if (marketArray.indexOf('BTC-' + topCoins[i].symbol) != -1 &&
                topCoins[i].percent_change_1h > 0.5 && 
                topCoins[i].percent_change_24h > 1 && count <= 10) {
                count++;
                console.log('BTC-' + topCoins[i].symbol, '    ', topCoins[i].percent_change_1h, '    ', topCoins[i].percent_change_24h, '    ',topCoins[i].rank, '   ', topCoins[i].price_btc);
                let buyObj = {};
                buyObj.time = new Date();
                buyObj.count = 0.1 / topCoins[i].price_btc;
                buyObj.buyPrice = topCoins[i].price_btc;
                if (!purchaseObj['BTC-' + topCoins[i].symbol]) {
                    purchaseObj['BTC-' + topCoins[i].symbol] = {
                        buys: [],
                        sells: []
                    };
                }
                if (!purchaseObj['BTC-' + topCoins[i].symbol].buys) {
                    purchaseObj['BTC-' + topCoins[i].symbol].buys = [];
                }
                purchaseObj['BTC-' + topCoins[i].symbol].buys.push(buyObj);
            }
        }
        Object.keys(purchaseObj).forEach(function (key) {
            let totalHoldings = 0;

            purchaseObj[key].buys.forEach(function (buyObj) {
                totalHoldings += buyObj.count;
            });
            purchaseObj[key].buys.forEach(function (sellObj) {
                totalHoldings += sellObj.count;
            });
            purchaseObj[key].totalHoldings = totalHoldings;
        });
    });
}

let marketArray = [];

function getMarkets() {
    fs.readFile('./data/markets.json', 'utf-8', function (err, data) {
        var marketList = JSON.parse(data);
        marketList.forEach(function (market) {
            if (market.MarketName.indexOf('BTC-') == 0) {
                marketArray.push(market.MarketName);
            }
        });
        getAggregates();
        setInterval(function () {
            console.log('#############################')
            getAggregates();
        }, 60*1000);
    });
}

getMarkets();

//ROUTES
app.get('/tickers', function (req, res) {
    res.send(TRACKED_COINS);
});

app.get('/top', function (req, res) {
    res.send(topCoins.slice(0, 10));
});

app.get('/buys', function (req, res) {
    res.send(purchaseObj);
});


app.listen(9000, function () {
    console.log('listening');
});