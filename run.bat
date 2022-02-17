@echo The website is being served at http://127.0.0.1:3000
@echo.
@echo If the website did not automatically open in your browser,
@echo copy the link and paste it into the address bar of your web browser.
@echo If it still doesn't work, make sure that NodeJS is installed and
@echo available through the PATH. You can ensure that Node is working by
@echo opening up the command line and typing 'node -v', which should display
@echo the currently installed version of Node.
@echo.
@echo The website is contained locally to your computer. No information goes
@echo out or comes in from the internet. You may even run the website without
@echo a connection to the internet. If you use any of the facilities that were
@echo designed for online use, such as making a user account, the account will
@echo remain local to your instance of the website/repository and is not shared
@echo online.
@echo.
@echo Do not close this window until you are ready to stop the server.

@echo off
rundll32 url.dll,FileProtocolHandler http://127.0.0.1:3000/
cd ./nodejs_server
node main
