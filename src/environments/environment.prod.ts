import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // El navegador llama al backend publicado en el puerto 8080 (también en Docker Compose).
  apiUrlAuth: 'http://localhost:8080/clinica/v1'
};
