# My Family Album
An old sever and client side application written in JavaScript and NodeJS. Development began sometime in early 2019 and ended in mid 2019. I went through all physical family photos that my family had and bound them in protective binders with acid-free paper and plastic sleeves. I took the opportunity to scan all photos so that I could make them accessible online for other family members, distributed on a shared hosting platform. Although not every physical photo has been digitally processed yet, all available photos have been diligently enhanced and tagged with care and love for my family. The website also comes with a custom regular language that can be used to search and filter photos.

## How to Use
- [NodeJS](https://nodejs.org/) is required. The latest versions seem to work perfectly well.
- For Windows, make sure that the 'node' command is available in the PATH and you can simply double click on the 'run.bat' file to spin up the server. It should automatically open your browser to the website, which is locally being hosted on your machine.
- For other systems, you will need to manually execute the 'main.js' file in the 'nodejs_server' folder. Make sure that folder is the current working directory, and that 'run.bat' exists in the same directory.

## Changes
- The original backup of this application contained user data that has been completely scrubbed from this repository for their protection. All logs and all backups have also been removed for the same reason.
- The original server was designed to run on Linux and on a specific shared hosting platform that guaranteed availability of certain programs. Because those programs may be missing on your computer, some functionality will work unless a compatible version is installed and available on the PATH. The server may freeze or crash for example, when registering as a new user, which requires php, or when creating a zip of a photo album which requires a zipping program.

## Licenses
- I made great efforts to establish licenses and ownership for each font provided in this application and they can individually be found in their font folders on disk or by clicking the link in the info section of the website.
- Everything else including all code is owned by myself and my mother and its license is found at the top level of the repository.
