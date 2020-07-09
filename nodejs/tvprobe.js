'use strict'

global.config = require('./config');

var http_pages = [
	{ path: '/', view: 'index', title: 'Home' }
    ];

var rest_interface = [
		'/v1/probes',
		'/v1/channels',
		'/v1/periods',
		'/v1/buckets'
	];
	
var http_port = config.http_port || 80,
    views_path = config.views_path || config.app_path + '/views',
    static_path = config.static_path || __dirname + '/static',
    static_url = config.static_url || '/static',
    favicon_file = config.favicon || __dirname + '/static/favicon.ico',
    log_path = config.log_path || './logs',
    log_level = config.log_level || 'info';
    
var http_app = null,
    http_server = null;
global.connection = null,
global.logger = null;

var favicon = require('serve-favicon'),
    express = require('express'),
    mysql = require('mysql'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash');

var html = require('./libs/html');
var fs = require('fs');

logger = require('./libs/logger').init({
    log_path: log_path, 
    log_level: log_level
});

if (config.db_host && config.db_user && config.db_password && config.db_database) {
    global.connection = new mysql.createConnection({
        host              : config.db_host,
        user              : config.db_user,
        password          : config.db_password,
        database          : config.db_database,
        multipleStatements: true
    });
}

var init_app = function(pages) {
    var app = express();
    var package_file = JSON.parse(fs.readFileSync(config.app_path + '/package.json'));
    config.version = package_file.version;
    
    if (!fs.existsSync(favicon_file)) {
    	config.favicon_loaded = false;
    	logger.info('No fav icon found: ' + favicon_file);
    }
    else {
    	config.favicon_loaded = true;
    	app.use(favicon(favicon_file));
    }
    app.use(bodyParser.json());       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
      extended: true
    }));
    
    app.use(cookieParser());
    app.use(flash());
       
    app.set('views', [__dirname + '/views', views_path]);
    app.set('view engine', 'pug');
    app.locals.basedir = __dirname + '/views';
  
    app.use(static_url, express.static(static_path));
               
    for (let index in pages) {
        !function outer(page) {
	        logger.info('Adding page: "' + page.path + '"');
	        app.get(page.path, function(req, res) { html.render(req, res, { page: page.view, title: page.title }); });
        }(pages[index]);
    }
    return app;
}



logger.info('Initialising http server');
http_app = init_app(http_pages); 
    
logger.info('Initialising rest interface');
for (let index in rest_interface) {
    logger.info('Adding page: "' + rest_interface[index] + '"');
    require(config.app_path + '/routes' + rest_interface[index]).init(http_app, rest_interface[index]);

}
 
http_app.get(static_url + '/*', function(req,res) { 
res.statusCode = 404;
    res.send();
});   
http_app.get('*', function(req,res) { 
	logger.info('Unhandled request get \'' + res.req.url + '\'');
	res.statusCode = 404;
    res.send();
});
   
http_server = http_app.listen(http_port, function() {
    logger.info('Webserver listening at http://%s:%s', http_server.address().address, http_server.address().port);
    if (config.linux_user && (process.platform !== 'win32')) {
        try {
            console.log('Old user ID: ' + process.getuid() + ', old group ID: ' + process.getgid());
            process.setgid(config.linux_group);
            process.setuid(config.linux_user);
            logger.debug('New user ID: ' + process.getuid() + ', new group ID: ' + process.getgid());
        } catch (err) {
            console.log(err);
            console.log('Refusing to keep the process alive as root.');
            process.exit(1);
        }
    }
});
