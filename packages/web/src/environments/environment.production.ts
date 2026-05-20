/** Override at Docker build via fileReplacements or NG_APP_API_URL in CI. */
export const environment = {
  production: true,
  apiUrl: "http://localhost:3001/api/v1",
};
