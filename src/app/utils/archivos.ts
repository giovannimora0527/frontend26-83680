/**
 * Descarga en el navegador un archivo recibido del backend.
 *
 * @param contenido archivo recibido.
 * @param nombre nombre con el que se guarda.
 */
export function descargarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
