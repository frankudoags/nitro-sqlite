import type { HybridObject } from 'react-native-nitro-modules'

export type Row = Record<string, string | number | boolean | null>

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
    params?: (string | number | boolean | null)[]
  ): QueryResult
  transaction(queries: string[]): void
}
