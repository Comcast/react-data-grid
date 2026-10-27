#!/usr/bin/env bash
# The `install-browsers` task on CI: installs the browsers, and their system dependencies with apt
set -euo pipefail

echo '::group::Install browsers'

# see the comments in these files
sudo cp .github/apt.conf /etc/apt/apt.conf
image_mirrors=$(mktemp)
cp /etc/apt/apt-mirrors.txt "$image_mirrors"
sudo cp .github/apt-mirrors.txt /etc/apt/apt-mirrors.txt

# apt only fails over to the next mirror after an error, so any mirror that keeps sending data, however slowly, stalls it.
# The downloads normally take about 10 seconds, so after a minute, they're retried with the runner image's mirrors,
# keeping the packages already downloaded.
# Playwright's `apt-get install` only downloads the packages here, so stopping it can't interrupt dpkg.
echo 'APT::Get::Download-Only "true";' | sudo tee /etc/apt/apt.conf.d/download-only > /dev/null
if ! timeout 60 playwright install-deps; then
  echo "::warning::Downloading the browsers' dependencies failed or took over a minute, retrying with the runner image's apt mirrors"
  sudo cp "$image_mirrors" /etc/apt/apt-mirrors.txt
  timeout 60 playwright install-deps
fi
sudo rm /etc/apt/apt.conf.d/download-only

# installs the downloaded packages
playwright install --no-shell --with-deps

echo '::endgroup::'
