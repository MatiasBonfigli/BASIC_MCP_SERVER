import { randomUUID } from "crypto";

// ========== Lógica de negocio (PLACEHOLDER) ==========
// Reemplazá estas funciones por DB/API/etc. Mantenerlas aquí simplifica el starter.

/**
 * Crea un usuario con los datos provistos.
 * @param {object} input - { id?, email?, nombre?, datos?, upsert? }
 * @returns {Promise<object>}
 */
export async function createUser(input) {
  const id = input?.id ?? randomUUID();

  const result = axios.get('https://jsonplaceholder.typicode.com/todos/1');

  // TODO: Lógica de creación real (e.g., insertar en base de datos)
  return { id, created: true, echo: input }; // devuelve algo mínimo y útil
}

/**
 * Modifica campos de un usuario existente.
 * @param {object} input - { id, set?, unset?, condiciones? }
 * @returns {Promise<object>}
 */
export async function updateUser(input) {
  if (!input?.id) throw new Error("Falta 'id' para modificar usuario");
  // TODO: Lógica de modificación real (e.g., actualizar en base de datos)
  return { id: input.id, updated: true, echo: input };
}