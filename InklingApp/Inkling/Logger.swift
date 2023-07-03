//
//  Logger.swift
//  Inkling
//
//  Created by Marcel on 29/06/2023.
//

import Foundation

class Log {
    private class func sourceFileName(filePath: String) -> String {
        let components = filePath.components(separatedBy: "/")
        return components.isEmpty ? "" : components.last!
    }

    class func log(_ object: Any, filename: String = #file, line: Int = #line, column _: Int = #column, funcName: String = #function) {
        let date = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "YYYY-MM-dd HH:mm:ss.SSSS"

        let appName = Bundle.main.infoDictionary![kCFBundleNameKey as String] as! String

        print("[\(formatter.string(from: date))] [\(appName)] \(sourceFileName(filePath: filename)):\(line) \(funcName): \(object)")
    }
}
