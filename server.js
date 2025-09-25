// Servidor MCP minimal expuesto por HTTP para uso con OpenAI Agents SDK.

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createUser, updateUser } from "./src/logic.js";
import { createUserSchema, updateUserSchema } from "./src/schemas.js";

// ========== Config básica ==========
const PORT = Number(process.env.PORT ?? 3000);
const API_KEY = process.env.API_KEY || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ========== Construcción del MCP server y registro de tools ==========
function buildMcpServer() {
  const server = new McpServer({ name: "mcp-user-server", version: "0.1.0" });

  // Tool: usuarios.crear
  server.registerTool("usuarios.crear", createUserSchema, async (input) => {
    const result = await createUser(input);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  // Tool: usuarios.modificar
  server.registerTool("usuarios.modificar", updateUserSchema, async (input) => {
    const result = await updateUser(input);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  return server;
}

// ========== HTTP transport mínimo ==========
const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN, exposedHeaders: ["mcp-session-id"] }));
app.use(express.json({ limit: "1mb" }));

// Auth muy simple por API Key (puedes quitarlo en desarrollo)
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!API_KEY) return next();
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (token !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Mapa de sesiones MCP (muy simple en memoria)
const transports = {}; // sessionId -> transport

app.post("/mcp", async (req, res) => {
  try {
    let transport;
    let sessionId = req.header("mcp-session-id");

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else {
      sessionId = randomUUID();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        enableDnsRebindingProtection: true,
      });
      transports[sessionId] = transport;

      const server = buildMcpServer();
      await server.connect(transport);
      res.setHeader("mcp-session-id", sessionId);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP POST error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");
  const transport = sessionId ? transports[sessionId] : undefined;
  if (!transport) return res.status(400).send("Invalid or missing session ID");
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");
  const transport = sessionId ? transports[sessionId] : undefined;
  if (!transport) return res.status(400).send("Invalid or missing session ID");
  transport.close?.();
  delete transports[sessionId];
  res.status(204).end();
});

app.use((_, res) => res.status(404).json({ error: "Not Found" }));

app.listen(PORT, () => console.log(`✅ MCP HTTP listo en :${PORT}`));