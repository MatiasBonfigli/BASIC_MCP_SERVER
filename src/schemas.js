export const createUserSchema = {
  title: "Crear usuario",
  description: "Crea un usuario con los datos provistos.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "ID opcional; si falta, se genera" },
      email: { type: "string", description: "Email (opcional)" },
      nombre: { type: "string", description: "Nombre (opcional)" },
      datos: { type: "object", additionalProperties: true, description: "Campos extra" },
      upsert: { type: "boolean", description: "Permitir upsert/idempotencia" }
    },
    additionalProperties: true
  }
};

export const updateUserSchema = {
  title: "Modificar usuario",
  description: "Modifica campos de un usuario existente.",
  inputSchema: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", description: "ID del usuario" },
      set: { type: "object", additionalProperties: true, description: "Campos a setear" },
      unset: { type: "array", items: { type: "string" }, description: "Campos a eliminar" },
      condiciones: { type: "object", additionalProperties: true, description: "Precondiciones/ETag" }
    },
    additionalProperties: true
  }
};
