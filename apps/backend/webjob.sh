#!/bin/bash
set -euo pipefail

APP_DIR="/home/site/wwwroot"
LOG_DIR="/home/LogFiles/webjobs"
mkdir -p "$LOG_DIR"

# Optional: make sure we're in the app directory
cd "$APP_DIR"

# Start Laravel queue worker
php "$APP_DIR/artisan" queue:work --tries=3 --sleep=3 --timeout=90 >> "$LOG_DIR/queue.log" 2>&1 &
QUEUE_PID=$!

# Start scheduler loop (runs every 60s)
(
  while true; do
    php "$APP_DIR/artisan" schedule:run >> "$LOG_DIR/schedule.log" 2>&1
    sleep 60
  done
) &
SCHED_PID=$!

echo "Started job queue (pid=$QUEUE_PID) and scheduler (pid=$SCHED_PID)" >> "$LOG_DIR/runner.log"

# Graceful shutdown when WebJob stops/restarts
trap 'kill "$QUEUE_PID" "$SCHED_PID" 2>/dev/null || true; wait 2>/dev/null || true' SIGTERM SIGINT

# Keep the WebJob alive; if one dies, stop the other and exit
wait -n "$QUEUE_PID" "$SCHED_PID" || true
kill "$QUEUE_PID" "$SCHED_PID" 2>/dev/null || true
wait 2>/dev/null || true
