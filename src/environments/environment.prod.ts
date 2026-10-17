import packageInfo from '../../package.json';

/** Configuración del frontend para compilación de producción. */
export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrlAuth: 'http://localhost:8080/clinica/v1'
};
