//
//  HoverGestureRecognizer.swift
//  Inkling
//
//  Created by Alessandro Warth on 7/3/23.
//

import UIKit
import WebKit

class HoverGestureRecognizer: UIHoverGestureRecognizer {
    var webView: WKWebView?
    var touches: [String: UITouch] = [:]

    private func touchToDict(touch: UITouch) -> [String: Any] {
        let location = touch.preciseLocation(in: view)
        let azimuth = touch.azimuthAngle(in: view)

        var type = "touch"

        if touch.type == .pencil {
            type = "pencil"
        } else if touch.type == .stylus {
            type = "stylus"
        }

        return [
            "x": location.x,
            "y": location.y,
            "timestamp": touch.timestamp,
            "altitude": touch.altitudeAngle,
            "azimuth": azimuth,
            "radius": touch.majorRadius,
            "force": touch.force,
            "type": type,
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
        multipleTouchesToJSON(type: "hoverBegan", touches: touches, event: event)
    }

    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "hoverMoved", touches: touches, event: event)
    }

    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "hoverCancelled", touches: touches, event: event)
    }

    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        multipleTouchesToJSON(type: "hoverEnded", touches: touches, event: event)
    }
}
