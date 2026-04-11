package com.margelo.nitro.nitropreferences

import com.margelo.nitro.core.NullType
import com.margelo.nitro.NitroModules
import com.margelo.nitro.nitrosqlite.HybridSqliteSpec
import com.margelo.nitro.nitrosqlite.QueryResult
import com.margelo.nitro.nitrosqlite.TransactionQuery


class HybridSqlite : HybridSqliteSpec() {
    override fun open(path: String) {
        TODO("Not yet implemented")
    }

    override fun close() {
        TODO("Not yet implemented")
    }

    override fun execute(
        query: String,
        params: Array<String>
    ): QueryResult {
        TODO("Not yet implemented")
    }

    override fun transaction(queries: Array<TransactionQuery>): Array<QueryResult> {
        TODO("Not yet implemented")
    }

}