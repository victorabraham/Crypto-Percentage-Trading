'use strict';

const Promise = require('bluebird');

class Bittrex {
	constructor(apiKey, apiSecret) {
		this.name = 'bittrex';
		this.api = Promise.promisifyAll(require('node-bittrex-api'));
		this.api.options({
				'apikey': process.env.BAPI,
				'apisecret': process.env.BKEY,
				'baseUrlv2' : 'https://bittrex.com/Api/v2.0'
			});
	};

	getBTCinUSD() {
		let pair = 'USDT-BTC';
		return new Promise((resolve, reject) => {
			this.api.getticker({
				market: pair
			}, data => {
				let result = {
					exchange: 'bittrex',
					symbol: 'BTC',
					price: data.result.Ask,
					available: true
				};
				resolve(result);
			});
		});
	};

	getCandles(market, startTime) {
		return new Promise((resolve, reject) => {
			this.api.getcandles({
				marketName: market,
				tickInterval: 'fiveMin', // intervals are keywords 
				starTimestamp: startTime // start timestamp 
				}, function( data, err ) {
					if(err) {
						reject(err);
					}else {
						resolve(data);
					}
				});
		});
	}

	getPriceInBTC(symbol) {
		if (symbol == 'BTC') {
			return Promise.reject('Use getBTCinUSD to get BTC price.');
		} else {
			return new Promise((resolve, reject) => {
				let pair = 'BTC-' + symbol;
				this.api.getticker({
					market: pair
				}, data => {
					if (!data.success) {
						resolve({
							exchange: 'bittrex',
							symbol: symbol,
							available: false
						});
					} else {
						let result = {
							exchange: 'bittrex',
							symbol: symbol,
							priceBTC: data.result.Ask,
							available: true
						};
						resolve(result);
					};
				});
			});
		};
	}

	getTickerPrice(symbol) {
		return new Promise((resolve, reject) => {
			let pair = 'BTC-' + symbol;
			this.api.getticker({
				market: pair
			}, data => {
				if (!data.success) {
					reject('Not able to get ticker');
				} else {
					resolve(data);
				};
			});
		});
	}

	getBalances() {
		var self = this;
		return new Promise((resolve, reject) => {
			self.api.getbalances(function(data) {
				if (!data.result){
					let result = {
						market: self.name,
						available: false
					}
					resolve(result);
				} else {
					let balances = {};
					if (data.result) {
						data.result.forEach(balance => {
							balances[balance.Currency] = balance.Balance;
						});
					}
					let result = {
						market: self.name,
						available: true,
						funds: balances
					}
					resolve(result);
				}
			});
		});
	};

	getOrderHistory(market) {
		var options = {};
		if (market) options.market = market;

		return new Promise((resolve, reject) => {
			this.api.getorderhistory(options, function(data) {
				if (!data.success) {
					reject(data.message);
				} else {
					resolve(data.result);
				}
			});
		});
	};

	getSummary() {
		return new Promise((resolve, reject) => {
			this.api.getmarketsummaries(data => {
				if (!data.success) {
					reject(data.message);
				} else {
					resolve(data.result);
				}
			});
		});
	}

	sellNCoins(symbol, count) {
		var self = this;
		let orderNumber;
		let rate;
		return new Promise((resolve, reject) => {
			this.api.getmarketsummaries(data => {
					if (!data.success) {
						reject(data.message);
					} else {
						data.result.forEach(market => {
							if (symbol === market.MarketName.slice(4)) {
								console.log(market);
								rate = parseFloat(market.Bid)*2;
								//rate = 0.00018980;
								console.log(rate);
							}
						});
						if(rate) {
							var options = {
								market: 'BTC-' + symbol,
								quantity: count,
								rate: rate
							}
							console.log('Going to sell with==>', options);
							self.api.selllimit(options, function(data) {
								if (!data.success) {
									reject(data.message);
								} else {
									orderNumber = data.result.uuid;
									self.getOrderHistory('BTC-' + symbol)
									resolve();
								}
							});
						}
						//resolve(data);
					}
			});
		})
		.then(data => {
			return self.getOrderHistory('BTC-' + symbol);
		})
		.then(orderHistory => {
			let order = orderHistory.find(order => {
				console.log(order);
				return (order.OrderUuid == orderNumber);
			});
			return order;
		});
	}
	

	getCoinsForBTC(symbol, btcAmount) {
		var self = this;
		let orderNumber;
		let numCoinsToBuy;
		let rate;
		return new Promise((resolve, reject) => {
			this.api.getmarketsummaries(data => {
					if (!data.success) {
						reject(data.message);
					} else {
						resolve(data);
						// data.result.forEach(market => {
						// 	if (market.MarketName == 'BTC-' + symbol) {
						// 		rate = parseFloat(market.Ask);
						// 	}
						// });
					}
			});
		});
	}

	buy(symbol, USDAmount) {
		var self = this;
		let orderNumber;
		let numCoinsToBuy;
		let rate;
		let btcUSD;

		return new Promise((resolve, reject) => {
				this.api.getmarketsummaries(data => {
					if (!data.success) {
						reject(data.message);
					} else {
						data.result.forEach(market => {
							if (market.MarketName == 'USDT-BTC') {
								btcUSD = market.Ask;
							} else if (market.MarketName == 'BTC-' + symbol) {
								rate = parseFloat(market.Ask);
							}
						});
						numCoinsToBuy = (USDAmount / (rate * btcUSD)).toFixed(8);
						//console.log('btcUSD', btcUSD);
						//console.log('rate', rate);
						//console.log('numCoinsToBuy', numCoinsToBuy);

						var options = {
							market: 'BTC-' + symbol,
							quantity: numCoinsToBuy,
							rate: rate
						}
						self.api.buylimit(options, function(data) {
							if (!data.success) {
								reject(data.message);
							} else {
								orderNumber = data.result.uuid;
								self.getOrderHistory('BTC-' + symbol)

								resolve();
							}
						});
					}
				});
			})
			.then(data => {
				return self.getOrderHistory('BTC-' + symbol);
			})
			.then(orderHistory => {
				let order = orderHistory.find(order => {
					return (order.OrderUuid == orderNumber);
				});
				let result = {
					market: 'bittrex',
					orderNumber: orderNumber,
					numCoinsBought: order.Quantity,
					rate: order.PricePerUnit,
					complete: (order.QuantityRemaining == 0),
					usdValue: order.PricePerUnit * order.Quantity * btcUSD
				}
				return result;
			});
	}
};

module.exports = Bittrex;
