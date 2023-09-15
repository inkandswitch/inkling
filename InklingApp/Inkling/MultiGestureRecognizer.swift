//
//  MultiGestureRecognizer.swift
//  Inkling
//
//  Created by Marcel on 29/06/2023.
//

import UIKit
import WebKit

class MultiGestureRecognizer: UIGestureRecognizer {
    var webView: WKWebView?
    var touches: [String: UITouch] = [:]

    override init(target: Any?, action: Selector?) {
        super.init(target: target, action: action)

        // allows pen + touch input at the same time
        requiresExclusiveTouchType = false
    }

    private func touchToDict(touch: UITouch) -> [String: Any] {
        let location = touch.preciseLocation(in: view)
        let azimuth = touch.azimuthAngle(in: view)

        return [
            "position": [
                "x": location.x,
                "y": location.y,
            ],
            "timestamp": touch.timestamp,
            "altitude": touch.altitudeAngle,
            "azimuth": azimuth,
            "radius": touch.majorRadius,
            "pressure": touch.force,
            "type": touch.type == .pencil ? "pencil" : "finger",
            
            // These fields are for backwards compatability with older prototypes
            "force": touch.force,
            "x": location.x,
            "y": location.y,
        ]
    }

    private func getTouchKey(touch: UITouch) -> String {
        let interpolation = "\(touch)"
        let parts = interpolation.split(separator: " ", maxSplits: 3, omittingEmptySubsequences: true)
        let touchKey = String(parts[1].dropLast())
        return touchKey
    }

    private func multipleTouchesToJSON(type: String, touches: Set<UITouch>, event: UIEvent) {
        var dict: [String: [Any]] = Dictionary()

        if type == "began" {
            for touch in touches {
                let key = getTouchKey(touch: touch)
                self.touches[key] = touch
            }
        }

        for touch in touches {
            let key = getTouchKey(touch: touch)
            dict[key] = []

            if let coalesced = event.coalescedTouches(for: touch) {
                for touch in coalesced {
                    dict[key]?.append(touchToDict(touch: touch))
                }
            } else {
                dict[key]?.append(touchToDict(touch: touch))
            }
        }

        if type == "cancelled" || type == "ended" {
            for touch in touches {
                let key = getTouchKey(touch: touch)
                self.touches.removeValue(forKey: key)
            }
        }

        let json = try? JSONSerialization.data(withJSONObject: dict, options: [])
        let jsonString = String(data: json!, encoding: String.Encoding.utf8)

        webView?.evaluateJavaScript("nativeEvent(\"" + type + "\", " + jsonString! + ")", completionHandler: nil)
    }

    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "began", touches: touches, event: event)
    }

    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "moved", touches: touches, event: event)
    }

    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "cancelled", touches: touches, event: event)
    }

    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "ended", touches: touches, event: event)
    }
}
