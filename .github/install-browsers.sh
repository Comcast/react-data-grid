#!/usr/bin/env bash
# The `install-browsers` task on CI: installs the browsers, and their system dependencies with apt
set -euo pipefail

echo '::group::Install browsers'

# see the comment in this file
sudo cp .github/apt.conf /etc/apt/apt.conf

# apt only moves on to the next mirror in /etc/apt/apt-mirrors.txt after an error,
# so any mirror that keeps sending data, however slowly, stalls it:
# https://github.com/actions/runner-images/issues/14823
# The downloads normally take about 10 seconds, so after 30 seconds, they switch between
# the runner image's mirrors, which start with the runner region's Azure mirror, and archive.ubuntu.com.
# Playwright's `apt-get install` only downloads the packages here, so stopping it can't interrupt dpkg,
# and each attempt keeps the packages that the previous ones downloaded.
mirror_lists=("$(mktemp)" .github/apt-mirrors.txt)
cp /etc/apt/apt-mirrors.txt "${mirror_lists[0]}"
echo 'APT::Get::Download-Only "true";' | sudo tee /etc/apt/apt.conf.d/download-only > /dev/null
for attempt in 0 1 2 3; do
  sudo cp "${mirror_lists[attempt % 2]}" /etc/apt/apt-mirrors.txt
  if timeout 30 playwright install-deps; then
    break
  elif [ "$attempt" = 3 ]; then
    exit 1
  fi
  echo "::warning::Downloading the browsers' dependencies failed or took over 30 seconds, switching apt mirrors"
  # the time limit stops Playwright, and sudo only relays it to the shell running apt-get
  sudo pkill -KILL -x apt-get || true
  while pgrep -x apt-get > /dev/null; do sleep 1; done
done
sudo rm /etc/apt/apt.conf.d/download-only

# installs the downloaded packages
playwright install --no-shell --with-deps

echo '::endgroup::'
