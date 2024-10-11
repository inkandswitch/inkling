# Inkling

Inkling is a now-archived **research project**. We do not offer support for it. We can't help you get it running. We will not be adding features, fixing the *numerous* bugs, or porting it to other platforms. If you break it you can keep both halves.

# Getting Started

You can use Inkling in one of two ways.

* We *highly* recommend using an iPad and Apple Pencil, if you have those available. It takes a bit more effort to get up and running, but then you'll get to experience the system as it was meant to be used.
* Alternatively, you can run the app on a desktop computer in a web browser. It's quick and easy to run, but a royal pain in the butt to use.

Ironically, Inkling doesn't work in the browser on mobile devices.

### Running on iPad
You'll need a Mac with Xcode, an iPad, and an Apple Pencil.

In a terminal, `cd` into the `App` folder, run `npm install` to fetch a few deps, then run `npm exec vite` to spin up the web app. Make note of the network URL it shows you.

Open the `Wrapper` folder and the Inkling Xcode project within it. Select the Inkling project at the root of the file browser, then pick the Inkling Target, and set your developer profile under Signing & Certificates. You might also need to change the bundle identifier to something unique. Open `Inkling.swift`, look for the `URL` variable near the top, and set that to the network URL that Vite used. Then, build the app for your iPad.

Your Mac and iPad need to be on the same network, and Vite needs to be running whenever you launch the iPad app.

### Running on Desktop

In a terminal, `cd` into the `App` folder, run `npm install` to fetch a few deps, then run `npm exec vite` to spin up the web app. Make note of the local URL, and open that path in your browser.

# User Interface

Inkling has a lot of UI, but most of it is invisible. There's going to be a bit of a learning curve.

### Pseudo

We have a special kind of gesture called a "pseudo mode", or "pseudo" for short, usually mentioned with a number (eg: "2-pseudo"). To do a "pseudo", you place a certain number of fingers on the screen in empty space, and then do the action.

For example, to erase, you *2-pseudo draw*. This means you put 2 fingers down on the screen, and then draw with the pencil.

Pseudo gestures are almost always intended to be a 2-handed gesture. You'll use your off hand for the pseudo fingers, then your dominant hand to perform the action.

We use the presence of these fingers to *temporarily* switch to a different mode, like a different tool for the pencil or a different rate of change when scrubbing a number. Once you memories the handful pseudo modes in the system, you'll be able to work at the *speed of feeling*.

### iPad Input

The pencil is for drawing and creating new things.

Your fingers are for moving and changing things.

### Desktop Input

By default, the mouse acts like a finger, for moving and changing things.

Press and hold spacebar to make the mouse act like a pencil, for drawing and creating new things.

Press and hold the number 1, 2, 3, or 4 while using the mouse (or spacebar+mouse) to activate pseudo fingers. For instance, for a "2-pseudo draw", you'll press and hold both the number 2 and the spacebar, then click and drag with the mouse.

### The Bulb

There's only one on-screen UI element — the Bulb.

Tap the bulb to toggle between **Ink mode** and **Meta mode**.
* In Ink mode, you draw and play.
* In Meta mode, you construct and assemble.

You can drag the bulb with your finger and drop it in any of the four corners. Don't be shy — it waits until you've dragged a good distance before it starts to move.

### Drawing

In Ink Mode, you draw with the pencil. If you've made any handles, move them with your fingers.

2-pseudo draw to erase.

### Handles

In Meta mode, tap an ink stroke with your finger to give it handles.

Use your finger to move handles, which scales and rotates the ink stroke.

Handles can be snapped together. 3-pseudo finger drag to separate them. (That is: put 3 fingers down somewhere on the screen, then with another finger touch some snapped-together handles and drag away. On desktop, press and hold the 3 key, then drag the mouse on a handle.)

Handles can be repositioned relative to their stroke with a 2-pseudo finger drag. (This works reliably only when the handles aren't snapped to other handles)

Tap the handles to pin them in place.

### Gizmo

In Meta mode, draw with the pencil to create a gizmo.

A gizmo has a handle at each end, which behaves just like the handles on ink strokes.

Tap the sigil at the center of the gizmo to cycle through four constraint modes:
* Unconstrained
* Distance
* Distance & angle
* Angle

### Wiring

In Meta mode, place the pencil anywhere on a gizmo, then draw outward to create a wire. Release the pencil somewhere in empty space, and a property picker will appear at that spot. Use the pencil or your finger to select a property. If you draw outward from the property and release somewhere in empty space you'll create a number token.

You can move pickers and tokens with your finger.

You can wire existing objects together. If you try to wire something in a way that's invalid or nonsensical, the system will scold you.

You can wire 2 gizmos directly together. This constrains both their lengths and angles to be equal.

Erase pickers and wires by 2-pseudo drawing.

### Number Token

Pseudo, then finger-drag to scrub a number. Add more pseudo fingers for finer control.

Draw out from a number to wire to other numbers or properties.

Tap a number with your finger to lock the value. If the number is connected to a property, locking the value means exactly the same thing as constraining the property. So, for example, a locking/unlocking a number that's wired to the length of a gizmo is exactly the same as toggling the length constraint by tapping the sigil.

### Linear Token

In Meta mode, tap the pencil in empty space to create a linear token (y=mx+b). This token creates a relationship between four values. Use this simple formula to create wild constructions with gizmos. That's all there is to it.

### Go Everywhere

4-pseudo finger tap a handle to tell it to "go everywhere". Repeat this gesture to cycle through the "go everywhere" modes:
* continuous
* snapshot
* off

When a handle is told to "go everywhere", the system will try to move that handle to a bunch of different places on the screen, and then draw a dot wherever the handle wound up. So if you have a gizmo with a locked distance, pin one handle, and "go everywhere" with the other, it'll draw a circle. If you change the locked distance to locked angle, it'll draw a line.

### Extras

The Bulb's tap has a big radius and is very forgiving — you can mash your thumb anywhere in that corner of the screen, or slide your thumb outward off the side. Let it feel good.

When using Inkling on a desktop computer, you can press the Tab key to switch modes.

You can also pseudo tap the bulb to cycle through color themes:
* Light Color
* Dark Color
* Light Mono
* Dark Mono

You can customize these themes in `style.css`, and add/remove themes in `index.html`

You can 2-pseudo draw to erase the bulb, which triggers a reload. Handy.