exports.render = function(req, res, options) {
    options.favicon_loaded = config.favicon_loaded;
    options.predefined_css = config.predefined_css;
    options.referrer = req.headers.referer;
    options.title = config.app_name + ' - ' + options.title;
    options.version = config.version;
    res.render(options.page, options);   
}

exports.error = function(res, message) {
    logger.error(message.toString());
    res.send({err: message.toString()});
}
