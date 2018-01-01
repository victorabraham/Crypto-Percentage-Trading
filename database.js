var file = "coins";  
var db = new sqlite3.Database(file);  
// var db = new sqlite3.Database(':memory:'); 

exports.initializeDb = function() {
    db.serialize(function() {  
        db.run("CREATE TABLE IF NOT EXISTS Candles (coin TEXT, low REAL, high REAL, open REAL, close REAL, volume REAL, bVolume REAL, dt TEXT)"); 
        db.run("CREATE TABLE IF NOT EXISTS Prices (exchange TEXT, coin TEXT, value REAL, dt TEXT)");  
        db.run("CREATE TABLE IF NOT EXISTS DayTrade (exchange TEXT, MarketName TEXT, High REAL, Low REAL, Volume REAL, "+
                                                     "Last REAL, BaseVolume REAL, TimeStamp TEXT, Bid REAL, Ask REAL, "+
                                                     "OpenBuyOrders REAL, OpenSellOrders REAL, PrevDay REAL, Created TEXT)"); 
        db.run("CREATE TABLE IF NOT EXISTS HourlySymmary (exchange TEXT, MarketName TEXT, High REAL, Low REAL, Volume REAL, "+
                                                     "Last REAL, BaseVolume REAL, TimeStamp TEXT, Bid REAL, Ask REAL, "+
                                                     "OpenBuyOrders REAL, OpenSellOrders REAL, PrevDay REAL, Created TEXT)");  
    }); 
} 

