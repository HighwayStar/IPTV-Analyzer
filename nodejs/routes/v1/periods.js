
var get_periods_from_channel = function(req, res) {
    var q = 'SELECT probe_id, ';
    q += 'daemon_session_id, ';
    q += 'probes.distance, ';
    q += 'probes.name, ';
    q += 'probes.switch, ';
    q += 'probes.shortloc, ';
    q += 'multicast_dst, ';
    q += 'sum(delta_skips) as skips, ';
    q += 'sum(delta_discon) as drops, ';
    q += 'count(multicast_dst) as records, ';
    q += 'UNIX_TIMESTAMP(min(record_time)) * 1000 as time_min, ';
    q += 'UNIX_TIMESTAMP(max(record_time)) * 1000 as time_max, ';
    q += 'TIMESTAMPDIFF(SECOND, min(record_time), max(record_time)) * 1000 as period ';
    q += 'FROM log_event, probes ';
    q += 'WHERE  probe_id = probes.id ';
    q += 'AND  multicast_dst = ? ';
    q += 'AND UNIX_TIMESTAMP(record_time) * 1000 BETWEEN ? AND ? ';
    q += 'GROUP BY daemon_session_id, probe_id ';
    q += 'ORDER BY probes.distance, probe_id, time_min';
    var params = [req.params.channel, req.query.time_from, req.query.time_to];
    connection.query(q, params, function(err, result) {
        if (err) {
        	res.StatusCode = 500;
            res.send('Error retrieving probes: '+ err);
            return;
        }
        res.send({periods: result});
    });
}


exports.init = function(app, url) {
    app.get(url + '/:channel', function(req, res) { get_periods_from_channel(req, res); });
}