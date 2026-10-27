#!/usr/bin/env bash
# The `install-browsers` task on CI: installs the browsers, and their system dependencies with apt
set -euo pipefail

echo '::group::Install browsers'

# see the comment in this file
sudo cp .github/apt.conf /etc/apt/apt.conf

# apt only moves on to the next mirror in /etc/apt/apt-mirrors.txt after an error,
# so any mirror that keeps sending data, however slowly, stalls it:
# https://github.com/actions/runner-images/issues/14823
# Instead, Playwright's `apt-get install` only downloads the packages here, in attempts of 30 seconds,
# as they normally take about 10. After an attempt that downloads less than 10 MB, the next one switches
# between .github/apt-mirrors.txt and the runner image's mirrors, and the fifth such attempt fails.
# Each attempt keeps the packages that the previous ones downloaded, and stopping one can't interrupt dpkg.
mirror_lists=(.github/apt-mirrors.txt "$(mktemp)")
cp /etc/apt/apt-mirrors.txt "${mirror_lists[1]}"
echo 'APT::Get::Download-Only "true";' | sudo tee /etc/apt/apt.conf.d/download-only > /dev/null
list=0
stalls=0
while true; do
  sudo cp "${mirror_lists[list]}" /etc/apt/apt-mirrors.txt
  downloaded=$(sudo du -sm /var/cache/apt/archives | cut -f1)
  if timeout 30 playwright install-deps; then
    break
  fi
  echo "::warning::Downloading the browsers' dependencies failed or took over 30 seconds"
  # the time limit stops Playwright, and sudo only relays it to the shell running apt-get
  sudo pkill -KILL -x apt-get || true
  while pgrep -x apt-get > /dev/null; do sleep 1; done
  if (($(sudo du -sm /var/cache/apt/archives | cut -f1) - downloaded < 10)); then
    if ((++stalls == 5)); then
      exit 1
    fi
    list=$((1 - list))
  fi
done
sudo rm /etc/apt/apt.conf.d/download-only

# installs the downloaded packages
playwright install --no-shell --with-deps

echo '::endgroup::'
