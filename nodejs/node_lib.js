var https_port = config.https_port || 443,
    http_port = config.http_port || 80,
    https_key = config.https_key || __dirname + '/encryption/https-key.pem',
    https_cert = config.https_cert || __dirname + '/encryption/https-cert.pem',
    languages = config.languages || ['en'],
    locales = config.locales || __dirname + '/locales',
    default_language = config.default_language || 'en',
    views_path = config.views_path || config.app_path + '/views',
    static_path = config.static_path || __dirname + '/static',
    static_url = config.static_url || '/static',
    favicon_file = config.favicon || __dirname + '/static/favicon.ico',
    session_secret = config.session_secret || 'node lib framework',
    log_path = config.log_path || './logs',
    log_level = config.log_level || 'info',
    log_table = config.log_table,
    swagger_port = config.swagger_port || 3000,
    buildin_rest = [ '/v1/login', '/v1/logout', '/v1/users' ],
    swagger_files = [];
    


var https_app = null,
    https_server = null,
    http_app = null,
    http_server = null,
    connection = null,
    logger = null,
    httpskey = null,
    httpscert = null;

authentication = require('./libs/authentication');
fs = require('fs');

//locals
var favicon = require('serve-favicon'),
    express = require('express'),
    i18next = require('i18next'),
    FilesystemBackend = require('i18next-node-fs-backend'),
    i18nextMiddleware = require('i18next-express-middleware'),
    mysql = require('mysql'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash'),
    https = require('https'),
    https_app = null,
    http_app = null,
    https_ready = false,
    http_ready = false,
    httpskey = fs.readFileSync(https_key),
    httpscert = fs.readFileSync(https_cert);

html = require('./libs/html');
logger = require('./libs/logger').init({
    log_path: log_path, 
    log_level: log_level,
    log_table: log_table
});

process.on('uncaughtException', (err) => {
    logger.error('Fatal uncaught exception crashed application', err, function() {
        process.exit(1);
    });
});

connection = null;   
if (config.db_host && config.db_user && config.db_password && config.db_database) {
    var dbconnection = require('./libs/dbconnection');
    connection = new dbconnection({
        connectionLimit   : 5,
        host              : config.db_host,
        user              : config.db_user,
        password          : config.db_password,
        database          : config.db_database,
        multipleStatements: true
    });
    logger.add_mysql(connection);
}

init_app = function(pages) {
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
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
      extended: true
    }));
    
    app.use(cookieParser());
    app.use(flash());
    app.use(require('express-session')({
        secret: session_secret,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true }
    }));
        
    app.set('views', [__dirname + '/views', views_path]);
    app.set('view engine', 'pug');
    app.locals.basedir = __dirname + '/views';

    i18next
      .use(i18nextMiddleware.LanguageDetector)
      .use(FilesystemBackend)
      .init( {
                backend: {
                    loadPath: locales + '/{{lng}}/{{ns}}.json',
                    addPath: locales + '/{{lng}}/{{ns}}.missing.json'
                },
                fallbackLng: default_language,
                preload: languages,
                saveMissing: true,
                api: {
					'__': 'translate',  
					'__n': 'translateN' 
				},
        });
    app.use(i18nextMiddleware.handle(i18next)); 

    authentication.init(app);
   
    app.use(static_url, express.static(static_path));
    app.use('/node_lib', express.static(__dirname  + '/static'));
    
    if (config.public_page)
        app.use(config.public_page.page, express.static(config.public_page.path));
            
    for (index in pages) {
        !function outer(page) {
	        logger.info('Adding page: "' + page.path + '"');
	        app.get(page.path, function(req, res) { html.render(req, res, { page: page.view, title: page.title }); });
        }(pages[index]);
    }
    app.get('/logout', function(req, res) { html.render(req, res, { page: 'logout' }); });


    return app;
}

change_user = function() {
    if (config.linux_user && (process.platform !== 'win32')) {
        try {
            // don't use logging as this can change the ownership of the log files!
            console.log('Old user ID: ' + process.getuid() + ', old group ID: ' + process.getgid());
            process.setgid(config.linux_group);
            process.setuid(config.linux_user);
            logger.debug('New user ID: ' + process.getuid() + ', new group ID: ' + process.getgid());
        } catch (err) {
            // don't use logging as this can change the ownership of the log files!
            console.log(err);
            console.log('Cowardly refusing to keep the process alive as root.');
            process.exit(1);
        }
    }
}

server_callback = function() {
    if (https_ready && http_ready) {
        change_user();
    }
}

init_https = function(options) {
    logger.info('Initialising secure server');
    https_app = init_app(options.https_pages); 
    
    if (options.rest_interface) {
    	logger.info('Initialising build-in rest interface');
    	for (index in buildin_rest) {
	        logger.info('Adding page: "' + buildin_rest[index] + '"');
	        require(__dirname + '/routes'+ buildin_rest[index]).init(https_app, buildin_rest[index]);
	        swagger_files.push(__dirname + '/routes'+ buildin_rest[index] + '.js');
	    }

    	logger.info('Initialising rest interface');
	    for (index in options.rest_interface) {
	        logger.info('Adding page: "' + options.rest_interface[index] + '"');
	        require(config.app_path + '/routes' + options.rest_interface[index]).init(https_app, options.rest_interface[index]);
	        swagger_files.push(config.app_path + '/routes' + options.rest_interface[index] + '.js');

	    }
    }

    https_app.get('/node_lib/*', function(req,res) { 
	res.statusCode = 404;
        res.redirect('/');
    }); 
    https_app.get(static_url + '/*', function(req,res) { 
	res.statusCode = 404;
        res.send();
    });   
    https_app.get('*', function(req,res) { 
    	logger.info('Unhandled request get \'' + res.req.url + '\'');
    	res.statusCode = 404;
        res.send();
    });
   
    https_server = https.createServer({key: httpskey, cert: httpscert}, https_app).listen(https_port, function () {
        logger.info('Secure webserver listening at https://%s:%s', https_server.address().address, https_server.address().port);
        https_ready = true;
        server_callback();
    });
}

init_http = function() {
    logger.info('Initialising http server');
    http_app = express();
    http_app.get('*', function(req,res) {
        if (https_server) {
            var ip = res.req.headers['x-forwarded-for'] || res.req.connection.remoteAddress;
            if (req.headers['host']) {
	            var new_url = 'https://'+ req.headers['host'].split(':')[0] + ':' +  https_port + res.req.url;
	            logger.info('Insecure request coming from: ' + ip + '. Redirecting to ' + new_url);
	            res.redirect(new_url);
	        }
	        else {
	        	logger.warn('Insecure request coming from: ' + ip + '. URL: "' + res.req.url + '". No host found in headers');
	        	res.statusCode = 404;
	        	res.send();
	        }
        }
    });
    http_server = http_app.listen(http_port, function() {
        logger.info('Webserver listening at http://%s:%s', http_server.address().address, http_server.address().port);
        http_ready = true;
        server_callback();
    });
}

exports.snmp = function(snmp_port) {
    var snmp = require('./libs/snmp');
    snmp.init(snmp_port);
    return snmp;
}

exports.init = function(options) {
    if (!options.https_pages)
        https_ready = true;
    if (!options.http_pages)
        http_ready = true;

    init_https(options);
    init_http();

	const swagger_app = express();
	const expressSwagger = require('express-swagger-generator')(swagger_app);
	let swagger_options = {
	    swaggerDefinition: {
	        info: {
	            description: 'Masterdoc rest server',
	            title: 'Masterdoc',
	            version: '1.0.0',
	        },
	        host: 'https://masterdoc',
	        basePath: '',
	        produces: [
	            "application/json"
	        ],
	        schemes: ['https']
	    },
	    basedir: __dirname, //app absolute path
	    files: swagger_files
	};
	expressSwagger(swagger_options);
	swagger_app.listen(swagger_port);
}

exports.connection = connection;
exports.logger = logger;
exports.change_user = change_user;