import type { HybridObject } from 'react-native-nitro-modules'

export interface RowValue {
  stringValue: string | null
  numberValue: number | null
  boolValue: boolean | null
}

export interface Row {
  columnName: string
  value: RowValue
}

export interface QueryResult {
  rows: Row[]
  rowsAffected: number
  insertId?: number
}

export interface Sqlite extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  open(path: string): void
  close(): void
  execute(
    query: string,
    params: string[]
  ): QueryResult
  transaction(queries: string[]): void
}
