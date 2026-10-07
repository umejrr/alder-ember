#!/usr/bin/env bash
# Start/stop the built server for local review. Usage: scripts/serve-dist.sh start|stop
PIDFILE=/tmp/ae-server.pid
case "$1" in
  start)
    [ -f "$PIDFILE" ] && kill "$(cat $PIDFILE)" 2>/dev/null
    HOST=127.0.0.1 PORT=${PORT:-4321} nohup node dist/server/entry.mjs >/tmp/ae-server.log 2>&1 &
    echo $! > "$PIDFILE"; sleep 1.5; echo "serving on :${PORT:-4321} (pid $(cat $PIDFILE))";;
  stop) [ -f "$PIDFILE" ] && kill "$(cat $PIDFILE)" 2>/dev/null && rm -f "$PIDFILE" && echo stopped;;
esac
