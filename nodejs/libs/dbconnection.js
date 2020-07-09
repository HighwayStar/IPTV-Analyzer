var mysql = require('mysql');

function check_versions(_self, err) {
    if (err && (err.errno == 1146)) {
        console.log('Database not initialised! Run the intialisation script(s) first: ' + err);
        process.exit(0);
    }
}

var DbConnection = function(connection) {
    this.connection = mysql.createPool(connection);
    var callback = check_versions.bind(undefined, this);
    this.connection.query('SHOW tables', callback);
}

module.exports = DbConnection;                        

function cb_query(_self, closing_callback, callback, err, rows) {
    callback(err, rows);
}

DbConnection.prototype.query = function() {
    var cb = null;
    switch(arguments.length) {
        case 4:   // closing_callback, query, variable, callback
            cb = cb_query.bind(undefined, this, arguments[0], arguments[3])
            this.connection.query(arguments[1], arguments[2], cb);
            break;
        case 3:   // closing_callback, query, callback òf query, variable, callback
            if (typeof arguments[0] == 'function') {  // closing_callback, query, callback
                cb = cb_query.bind(undefined, this, arguments[0], arguments[2])
                this.connection.query(arguments[1], cb);
            }
            else { // query, variable, callback
                cb = cb_query.bind(undefined, this, null, arguments[2])
                this.connection.query(arguments[0], arguments[1], cb);
            }
            break;
        case 2:   // query, variable
            cb = cb_query.bind(undefined, this, null, arguments[1])
            this.connection.query(arguments[0], cb);
            break;
        default:
            console.log('dbconnection: wrong amount of variables!');
    }
} 

DbConnection.prototype.end = function() {
    this.connection.end();
} 

