#/bin/bash

# clean up old logs
find /var/log/tvprobe/*.log  -mtime +14 -exec rm {} \; 2>/dev/null

# make dump of database
#mysqldump -u tvprobe -ptvprobe tvprobe > /backup/tvprobe/tvprobe_$(date +"%Y%m%d_%H%M").sql

# zip up and clean old dump files
#find /backup/tvprobe/tvprobe_*.sql -mtime +1 -exec gzip {} \; 2>/dev/null
#find /backup/tvprobe/tvprobe_*.sql.gz -mtime +14 -exec rm {} \; 2>/dev/null

