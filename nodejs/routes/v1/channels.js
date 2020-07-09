
var get_channels = function(req, res) {
    var q = 'SELECT distinct(multicast_dst) FROM log_event ORDER BY INET_ATON(multicast_dst)';
    connection.query(q, function(err, result) {
        if (err) {
        	res.StatusCode = 500;
            res.send('Error retrieving channels: '+ err);
            return;
        }
        res.send({channels: result});
    });
}


exports.init = function(app, url) {
    app.get(url, function(req, res) { get_channels(req, res); });
}