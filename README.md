# Inkling Prototyping Platform

Quick 'n dirty ink prototypes on the iPad.
1. Compile and run InklingApp from Xcode,
2. Add your prototype to the Prototypes folder
3. Add a link to the online and local development URLs in index.html

### Play nice, Xcode
The included Xcode project expects your AppleID to be a member of a _specific team_. If you're not a member of said team, you'll need to change the Team setting (in Signing & Capabilities). After doing so, you will likely want to run the following to make git ignore this change: `git update-index --assume-unchanged InklingApp/Inkling.xcodeproj/project.pbxproj`.
