//
//  ViewController.swift
//  Inkling
//
//  Created by Marcel on 26/06/2023.
//

import CoreData
import UIKit
import WebKit

class ViewController: UIViewController, WKScriptMessageHandler, WKUIDelegate, UIGestureRecognizerDelegate, UIScrollViewDelegate {
    let isBlockingScroll = true
    var multiGestureRecognizer: MultiGestureRecognizer?
    var webView: WKWebView?
    var timer = Timer()

    let container = (UIApplication.shared.delegate as! AppDelegate).persistentContainer
    let context = (UIApplication.shared.delegate as! AppDelegate).persistentContainer.viewContext

    let baseUrl = "https://wolkenmachine.github.io/Inkling/"

    override func viewDidLoad() {
        super.viewDidLoad()

        let contentController = WKUserContentController()
        contentController.add(self, name: "messages")

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController

        let deviceId = UIDevice.current.identifierForVendor!.uuidString

        let url = URL(string: baseUrl + "?inWrapper=true&deviceId=" + deviceId)!
        Log.log("loading: \(url.absoluteString)")
      
        // Clear cache
        URLCache.shared.removeAllCachedResponses()
        URLCache.shared.diskCapacity = 0
        URLCache.shared.memoryCapacity = 0

        
        // Load webview
        webView = WKWebView(frame: view.frame, configuration: configuration)
        webView!.load(URLRequest(url: url))
        webView!.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      
        // Disable magnifying glass
        webView!.configuration.preferences.isTextInteractionEnabled = false
        
        // Enable remote inspection via Safari — required as of iOS 16.4
        webView!.isInspectable = true

        if isBlockingScroll {
            webView!.scrollView.isScrollEnabled = false
            webView!.scrollView.delegate = self
        }

        multiGestureRecognizer = MultiGestureRecognizer(target: nil, action: nil)
        multiGestureRecognizer!.webView = webView
        multiGestureRecognizer!.delegate = self
        webView!.addGestureRecognizer(multiGestureRecognizer!)

        view.addSubview(webView!)
    }

    override var prefersStatusBarHidden: Bool {
        return true
    }

    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    // this allows multiple gestures to happen at the same time - webview and our multigesture recogniser working together
    func gestureRecognizer(_: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith _: UIGestureRecognizer) -> Bool {
        return true
    }

    func userContentController(_: WKUserContentController, didReceive message: WKScriptMessage) {
      if let msg = message.body as? String {
          if msg == "mgr on" {
              multiGestureRecognizer!.isEnabled = true
              Log.log("turned on mgr");
          } else if msg == "mgr off" {
              multiGestureRecognizer!.isEnabled = false
              Log.log("turned off mgr");
          } else {
              Log.log("huh? " + msg);
          }
      }
    }
}
