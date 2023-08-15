# Inkling Prototyping Platform

Quick 'n dirty ink prototypes on the iPad.
1. Compile and run InklingApp from Xcode,
2. Add your prototype to the Prototypes folder
3. Add a link to the online and local development URLs in index.html

### Play nice, Xcode
The included Xcode project expects your AppleID to be a member of a _specific team_. If you're not a member of said team, you'll need to change the Team setting (in Signing & Capabilities). After doing so, you will likely want to run the following to make git ignore this change: `git update-index --assume-unchanged InklingApp/Inkling.xcodeproj/project.pbxproj`.


### Snapshots
There is a handy little script to make it easier for us to take snapshots of our prototypes. Here's how it works:

(1) cd into the Prototypes directory
(2) `./take-snapshot  <commit> <src-dir> <dest-dir>`

E.g., `./take-snapshot b963db1850e6ea82b7ebab25c9e885bb341c6a63 FormalInkIntegrated FormalInkIntegrated-jul-28-23` will revert the code to the way it was as of commit `b963db1850e6ea82b7ebab25c9e885bb341c6a63`, then copy whatever was in the `FormalInkIntegrated` directory into `FormalInkIntegrated-jul-28-23`, and finally fast-forward "back to the future".

Finally you have to modify index.html to add a link to the prototype.


### Auto-formatting and fixing of linter errors

The main application, which lives in the InkbaseV2 folder, uses `gts`. To get the most of gts:

* Enable formatting on save by opening up the settings menu on vscode, typing "format on save", and checking the appropriate box.
* To automatically fix linter errors, run `yarn fix` at the command line.
