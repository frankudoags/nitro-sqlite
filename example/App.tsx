import { StatusBar } from "expo-status-bar";
// @ts-ignore Local example app may not include react type declarations.
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import sqlite, { type QueryResult, type Row } from "nitro-sqlite";

function extractPrimitive(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    // Handles direct Nitro spec shape: { stringValue, numberValue, boolValue }
    if (objectValue.stringValue !== null && objectValue.stringValue !== undefined) {
      return extractPrimitive(objectValue.stringValue);
    }
    if (objectValue.numberValue !== null && objectValue.numberValue !== undefined) {
      return extractPrimitive(objectValue.numberValue);
    }
    if (objectValue.boolValue !== null && objectValue.boolValue !== undefined) {
      return extractPrimitive(objectValue.boolValue);
    }

    // Handles tagged union shapes often emitted by native bridges.
    if (objectValue.value !== null && objectValue.value !== undefined) {
      return extractPrimitive(objectValue.value);
    }

    for (const nestedValue of Object.values(objectValue)) {
      const nestedPrimitive = extractPrimitive(nestedValue);
      if (nestedPrimitive !== null) {
        return nestedPrimitive;
      }
    }
  }

  return null;
}

function getRowPrimitive(row: Row): string | number | boolean | null {
  return extractPrimitive(row.value);
}

function formatRows(rows: Row[]): string {
  if (rows.length === 0) {
    return "No row values returned.";
  }
  return rows.map((row) => `${row.columnName}: ${String(getRowPrimitive(row))}`).join("\n");
}

function seedDemoData(): void {
  sqlite.execute(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER NOT NULL, active INTEGER NOT NULL)",
    [],
  );

  const countResult = sqlite.execute("SELECT COUNT(*) AS total FROM users", []);
  const countValue = countResult.rows[0] ? getRowPrimitive(countResult.rows[0]) : 0;
  const existingCount = Number(countValue ?? 0);

  if (existingCount === 0) {
    sqlite.transaction([
      { query: "INSERT INTO users (name, age, active) VALUES (?, ?, ?)", params: ["Ada", "36", "1"] },
      { query: "INSERT INTO users (name, age, active) VALUES (?, ?, ?)", params: ["Grace", "42", "0"] },
      { query: "INSERT INTO users (name, age, active) VALUES (?, ?, ?)", params: ["Linus", "31", "1"] },
      { query: "INSERT INTO users (name, age, active) VALUES (?, ?, ?)", params: ["Maya", "28", "1"] },
    ]);
  }
}

function parseParams(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value));
      }
    } catch {
      // Fall back to comma/newline parser.
    }
  }

  return trimmed
    .split(/,|\n/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function executeQuery(query: string, paramsText: string): QueryResult {
  const params = parseParams(paramsText);
  return sqlite.execute(query, params);
}

function useSqlitePlayground() {
  const [dbReady, setDbReady] = React.useState(false);
  const [status, setStatus] = React.useState("Booting SQLite playground...");
  const [query, setQuery] = React.useState("SELECT id, name, age, active FROM users ORDER BY id DESC");
  const [paramsText, setParamsText] = React.useState("");
  const [resultMeta, setResultMeta] = React.useState("No query run yet.");
  const [resultRows, setResultRows] = React.useState("Run a query to inspect raw rows.");

  React.useEffect(() => {
    let active = true;

    try {
      sqlite.open(":memory:");
      seedDemoData();

      const warmup = executeQuery("SELECT id, name, age, active FROM users ORDER BY id ASC", "");
      if (active) {
        setDbReady(true);
        setStatus("Ready. Write SQL and run it.");
        setResultMeta(
          `Warmup SELECT finished. values=${warmup.rows.length}, rowsAffected=${warmup.rowsAffected}, insertId=${warmup.insertId ?? "-"}`,
        );
        setResultRows(formatRows(warmup.rows));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (active) {
        setStatus(`SQLite init error: ${message}`);
      }
    }

    return () => {
      active = false;
      try {
        sqlite.close();
      } catch {
        // Ignore close errors during teardown.
      }
    };
  }, []);

  const run = React.useCallback(() => {
    if (!dbReady) {
      setStatus("Database is not ready yet.");
      return;
    }

    try {
      const result = executeQuery(query, paramsText);
      setStatus("Query executed.");
      setResultMeta(
        `values=${result.rows.length}, rowsAffected=${result.rowsAffected}, insertId=${result.insertId ?? "-"}`,
      );
      setResultRows(formatRows(result.rows));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`SQLite error: ${message}`);
      setResultMeta("Execution failed.");
      setResultRows("No rows due to execution error.");
    }
  }, [dbReady, query, paramsText]);

  const loadSelectPreset = React.useCallback(() => {
    setQuery("SELECT id, name, age, active FROM users WHERE active = ? ORDER BY age DESC");
    setParamsText("1");
  }, []);

  const loadInsertPreset = React.useCallback(() => {
    setQuery("INSERT INTO users (name, age, active) VALUES (?, ?, ?)");
    setParamsText("Nova, 24, 1");
  }, []);

  return {
    status,
    query,
    paramsText,
    resultMeta,
    resultRows,
    setQuery,
    setParamsText,
    run,
    loadSelectPreset,
    loadInsertPreset,
  };
}

export default function App() {
  const {
    status,
    query,
    paramsText,
    resultMeta,
    resultRows,
    setQuery,
    setParamsText,
    run,
    loadSelectPreset,
    loadInsertPreset,
  } = useSqlitePlayground();

  return (
    <View style={styles.root}>
      <View style={styles.bgBubbleTop} />
      <View style={styles.bgBubbleBottom} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>NITRO SQL LAB</Text>
          <Text style={styles.title}>Write, Run, Inspect</Text>
          <Text style={styles.subtitle}>
            Edit SQL below, pass params, and execute directly against the Nitro SQLite bridge.
          </Text>
          <Text style={styles.status}>{status}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Query</Text>
          <TextInput
            multiline
            value={query}
            onChangeText={(text: string) => setQuery(text)}
            style={styles.queryInput}
            placeholder="SELECT * FROM users WHERE active = ?"
            placeholderTextColor="#91a1b8"
          />

          <Text style={styles.label}>Params (comma/newline or JSON array)</Text>
          <TextInput
            value={paramsText}
            onChangeText={(text: string) => setParamsText(text)}
            style={styles.paramInput}
            placeholder="1"
            placeholderTextColor="#91a1b8"
          />

          <View style={styles.buttonRow}>
            <Pressable style={styles.primaryButton} onPress={run}>
              <Text style={styles.primaryButtonText}>Run Query</Text>
            </Pressable>

            <Pressable style={styles.ghostButton} onPress={loadSelectPreset}>
              <Text style={styles.ghostButtonText}>Active Users Preset</Text>
            </Pressable>

            <Pressable style={styles.ghostButton} onPress={loadInsertPreset}>
              <Text style={styles.ghostButtonText}>Insert Preset</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.resultHeader}>Result Meta</Text>
          <Text style={styles.resultMeta}>{resultMeta}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.resultHeader}>Raw Rows</Text>
          <Text style={styles.resultRows}>{resultRows}</Text>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08152a",
  },
  bgBubbleTop: {
    position: "absolute",
    top: -140,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#1dd8c7",
    opacity: 0.24,
  },
  bgBubbleBottom: {
    position: "absolute",
    bottom: -120,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#2f7cff",
    opacity: 0.26,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 62,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#10233f",
    borderWidth: 1,
    borderColor: "#2f466c",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  kicker: {
    color: "#3ce5cf",
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#eef6ff",
    marginBottom: 8,
  },
  subtitle: {
    color: "#b6cae8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: "#d5e3fa",
  },
  panel: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#30496f",
    backgroundColor: "#0f2038",
  },
  label: {
    color: "#9fb6d7",
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  queryInput: {
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: "#08162d",
    borderWidth: 1,
    borderColor: "#375380",
    color: "#e8f0ff",
    padding: 12,
    textAlignVertical: "top",
    fontFamily: "Menlo",
    fontSize: 13,
  },
  paramInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#08162d",
    borderWidth: 1,
    borderColor: "#375380",
    color: "#e8f0ff",
    paddingHorizontal: 12,
    fontFamily: "Menlo",
    fontSize: 13,
  },
  buttonRow: {
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#25d4be",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#05241f",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  ghostButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4a6692",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#102745",
  },
  ghostButtonText: {
    color: "#c8daf4",
    fontSize: 12,
    fontWeight: "700",
  },
  resultHeader: {
    color: "#d8e6fc",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultMeta: {
    color: "#c0d0eb",
    fontSize: 13,
    lineHeight: 20,
  },
  resultRows: {
    color: "#cbe4ff",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Menlo",
  },
});
