import Foundation
import NitroModules
import SQLite3

class HybridSqlite: HybridSqliteSpec {
    private var db: OpaquePointer? = nil
    
    func open(path: String) throws {
        if sqlite3_open(path, &db) != SQLITE_OK {
            throw NSError(domain: "HybridSqlite", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to open database"])
        }
    }
    
    func close() throws {
        if sqlite3_close(db) != SQLITE_OK {
            throw NSError(domain: "HybridSqlite", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to close database"])
        }
        db = nil
    }
    
    func execute(query: String, params: [String]) throws -> QueryResult {
        // Prepare the SQL statement
        var stmt: OpaquePointer? = nil
        // Check if the statement was prepared successfully
        if sqlite3_prepare_v2(db, query, -1, &stmt, nil) != SQLITE_OK {
            throw NSError(domain: "HybridSqlite", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to prepare statement"])
        }
        
        // Bind parameters to the statement
        for (index, param) in params.enumerated() {
            sqlite3_bind_text(stmt, Int32(index + 1), param, -1, nil)
        }

        // Execute the statement and collect results
        var results: [[String: Any]] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            var row: [String: Any] = [:]
            let columnCount = sqlite3_column_count(stmt)
            for i in 0..<columnCount {
                let columnName = String(cString: sqlite3_column_name(stmt, i))
                let columnType = sqlite3_column_type(stmt, i)
                switch columnType {
                case SQLITE_INTEGER:
                    row[columnName] = sqlite3_column_int64(stmt, i)
                case SQLITE_FLOAT:
                    row[columnName] = sqlite3_column_double(stmt, i)
                case SQLITE_TEXT:
                    row[columnName] = String(cString: sqlite3_column_text(stmt, i))
                case SQLITE_NULL:
                    row[columnName] = nil
                default:
                    row[columnName] = nil   
                }
            }
            results.append(row)
        }

    }
    
    func transaction(queries: [String]) throws {
        <#code#>
    }
}
