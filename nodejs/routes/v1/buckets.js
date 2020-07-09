
var get_buckets_id = function(req, res) {
    var params = [];
    var q = 'SELECT UNIX_TIMESTAMP(record_time) DIV ? as bucket,';
    params.push(req.query.bucket);
    q += 'sum(delta_skips)  as skips,';
    q += 'sum(delta_discon) as drops,';
    q += 'sum(packets) as packets, ';
    q += 'sum(payload_bytes) as payload_bytes, ';
    q += 'probes.name,';
    q += 'UNIX_TIMESTAMP(record_time) * 1000 as timestamp,';
    q += 'UNIX_TIMESTAMP(min(record_time)) * 1000 as time_min,';
    q += 'UNIX_TIMESTAMP(max(record_time)) * 1000 as time_max,';
    q += 'TIMESTAMPDIFF(SECOND, min(record_time), max(record_time)) * 1000 as period,';
    q += 'count(record_time) as records ';
    q += 'FROM log_event, probes ';
    q += 'WHERE probes.id = probe_id ';
    q += 'AND probes.id = ? ';
    params.push(req.params.probe_id);
    q += 'AND UNIX_TIMESTAMP(record_time) * 1000 BETWEEN ? AND ? ';
    params.push(req.query.time_from, req.query.time_to);
    //q += 'AND multicast_dst NOT IN ($str_elems) ';
    q += 'GROUP BY bucket ';
    q += 'ORDER BY timestamp';
    connection.query(q, params, function(err, result) {
        if (err) {
        	res.StatusCode = 500;
            res.send('Error retrieving probes: '+ err);
            return;
        }
        res.send({buckets: result});
    });
}


var get_buckets_channel = function(req, res) {
    var params = [];
    var q = 'SELECT UNIX_TIMESTAMP(record_time) DIV ? as bucket, ';
    q += 'probe_id, ';
    params.push(req.query.bucket);
    q += 'multicast_dst, ';
    q += 'sum(delta_skips)  as skips, ';
    q += 'sum(delta_discon) as drops, ';
    q += 'sum(packets) as packets, ';
    q += 'sum(payload_bytes) as payload_bytes, ';
    q += 'UNIX_TIMESTAMP(record_time) * 1000 as timestamp, ';
    q += 'UNIX_TIMESTAMP(min(record_time)) * 1000 as time_min, ';
    q += 'UNIX_TIMESTAMP(max(record_time)) * 1000 as time_max, ';
    q += 'TIMESTAMPDIFF(SECOND, min(record_time), max(record_time)) * 1000 as period, ';
    q += 'count(multicast_dst) as records ';
    q += 'FROM log_event ';
    q += 'WHERE  multicast_dst = ? ';
    params.push(req.params.channel);
    if (req.query.probe_id) {
        q += 'AND probe_id = ? ';
        params.push(req.query.probe_id);
    }
    q += 'AND UNIX_TIMESTAMP(record_time) * 1000 BETWEEN ? AND ? ';
    params.push(req.query.time_from, req.query.time_to);
    q += 'GROUP BY bucket ';
    q += 'ORDER BY probe_id, timestamp ';
    connection.query(q, params, function(err, result) {
        if (err) {
        	res.StatusCode = 500;
            res.send('Error retrieving probes: '+ err);
            return;
        }
        res.send({buckets: result});
    });
}


exports.init = function(app, url) {
    app.get(url + '/id/:probe_id', function(req, res) { get_buckets_id(req, res); });
    app.get(url + '/channel/:channel', function(req, res) { get_buckets_channel(req, res); });
}