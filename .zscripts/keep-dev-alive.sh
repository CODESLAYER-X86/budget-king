#!/bin/bash
# Restart dev server if it dies
while true; do
  if ! ss -tln 2>/dev/null | grep -q ":3000"; then
    echo "[$(date)] Dev server down, restarting via run-dev.sh..."
    /home/z/my-project/.zscripts/run-dev.sh > /tmp/dev-instance.log 2>&1 &
    disown
    sleep 15
  fi
  sleep 5
done
