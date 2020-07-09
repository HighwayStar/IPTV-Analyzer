var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

const { createLogger, format, transports } = require('winston');

require('winston-daily-rotate-file');

var log_file_datepattern = config.log_file_datepattern || 'YYYY-MM-DD',
    log_filename = config.log_filename || config.app_name;

exports.init = function(options) {
    const winston = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: { service: config.app_name }
    });
  
    if (options.log_path == null) {
        console.log('No log directory defined. Only logging to console.');
        winston.add(new transports.Console({
                format: format.combine(
                format.colorize(),
                format.simple()
            )
        }));
        return winston;
    }
    winston.add(new transports.Console({
            format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
   	if (!fs.existsSync(options.log_path)) {
    	console.log('Creating logs directory...');
	    mkdirp.sync(options.log_path, 0777)
   	}
	winston.add(new transports.DailyRotateFile({
		level: options.log_level,
		dirname: options.log_path,
		extension: '.log',
		filename: log_filename,
		datePattern: log_file_datepattern
	}));
	winston.add(new transports.DailyRotateFile({
		level: 'error',
		dirname: options.log_path,
		extension: '.log',
		filename: 'error',
		datePattern: log_file_datepattern
	}));

	return winston;
}



