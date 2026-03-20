# Teral UV - Packaged EXE Notes
=============================

This folder contains the packaged Windows executables for the Python UV setup.

Files
-----
- TeralUVLauncher.exe
    Starts the static frontend and the Wisp backend.
- TeralUVDownloader.exe
    Downloads or refreshes the UV browser assets.
- static\
    Required frontend assets used by the launcher.

Important
---------
The launcher expects the "static" folder to stay beside TeralUVLauncher.exe.

Do NOT move:
- TeralUVLauncher.exe
away from:
- static\

Recommended folder layout
-------------------------
This folder should look like:

  TeralUVLauncher.exe
  TeralUVDownloader.exe
  static\
    uv\
    baremux\
    epoxy\
    libcurl\

First-time setup
----------------
1. Run TeralUVDownloader.exe
2. Wait for asset downloads to finish
3. Make sure the static folder is still present
4. Run TeralUVLauncher.exe

Normal usage
------------
1. Double-click TeralUVLauncher.exe
2. Wait for the launcher window to start the local servers
3. Open your browser if it does not open automatically
4. Visit:

   http://127.0.0.1:8080

Default addresses
-----------------
Frontend:
  http://127.0.0.1:8080

Wisp backend:
  ws://127.0.0.1:4000/

Notes
-----
- Some sites work better than others.
- Simpler sites are usually easier to proxy.
- Discord-like apps may still be unreliable.
- If assets are missing or outdated, run TeralUVDownloader.exe again.

Troubleshooting
---------------
If the launcher opens but pages do not work:
1. Make sure the static folder exists beside the EXE
2. Run TeralUVDownloader.exe again
3. Restart TeralUVLauncher.exe

If port 8080 is already in use:
- Close anything else using that port
- Or rebuild/run a version configured for another port

If the Wisp backend cannot start:
- Another app may already be using port 4000
- Close the conflicting app and try again

If nothing happens when opening the EXE:
- Try right-click > Run as administrator
- Make sure your antivirus did not quarantine the EXE
- Make sure Python-based runtime dependencies were bundled correctly during build

Best practice
-------------
Keep this whole folder together when copying it to another machine.
Do not separate the EXE files from the static folder.

Enjoy your Teral UV launcher.
