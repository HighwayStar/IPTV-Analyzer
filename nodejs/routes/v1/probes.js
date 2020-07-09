
var get_probes = function(req, res) {
    var q = 'SELECT *, id as probe_id FROM probes WHERE  probes.hidden <> "yes" ORDER BY probes.distance';
    connection.query(q, function(err, result) {
        if (err) {
        	res.StatusCode = 500;
            res.send('Error retrieving probes: '+ err);
            return;
        }
        if (result.length === 0) {
        	res.statusCode = 404;
        	res.send();
        	return;
        }
        res.send({probes: result});
    });
}

exports.init = function(app, url) {
    app.get(url, function(req, res) { get_probes(req, res); });
}