# Setting up REMS as Systemd Services

Follow these steps to set up the REMS application as systemd services:

## 1. Create a dedicated user for the application

```bash
sudo useradd -r -m -d /home/rems -s /bin/bash rems
