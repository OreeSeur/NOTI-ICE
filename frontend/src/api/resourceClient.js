import { buildEndpoint, withId } from "./endpoints";
import { get, post, put, remove } from "./apiClient";

export const createResourceClient = (endpoint) => ({
  list: (params) => get(buildEndpoint(endpoint, params)),
  getById: (id) => get(withId(endpoint, id)),
  create: (payload) => post(endpoint, payload),
  update: (id, payload) => put(withId(endpoint, id), payload),
  delete: (id) => remove(withId(endpoint, id)),
});
